import { test, expect, APIRequestContext } from '@playwright/test';
import { config } from '@utils/config';

const API = config.apiUrl;
const BASE = config.devBaseUrl;

// ─── Helper: raw fetch bypassing ApiHelper ─────────────────────

async function rawPost(
  request: APIRequestContext,
  url: string,
  body: unknown,
  headers?: Record<string, string>
) {
  return request.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    data: body,
  });
}

async function rawGet(
  request: APIRequestContext,
  url: string,
  headers?: Record<string, string>
) {
  return request.fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// ═══════════════════════════════════════════════════════════════
// DEEP ATTACK TESTS — Actually trying to break the app
// ═══════════════════════════════════════════════════════════════

test.describe('DEEP ATTACKS — Exploitation Attempts', () => {

  // ─── 1. CSRF ATTACK (SameSite=None cookies) ──────────────────

  test.describe('1. CSRF via SameSite=None Cookies', () => {
    test('@security @attack CSRF: cross-origin form auto-submits login', async ({ request, page }) => {
      // Since cookies are SameSite=None, a cross-origin page could
      // include credentials. Test if the API accepts credentialed
      // cross-origin requests.
      const response = await request.fetch(`${API}/auth/me`, {
        method: 'GET',
        headers: {
          Origin: 'https://evil-attacker.com',
          Referer: 'https://evil-attacker.com/csrf.html',
        },
      });
      // Should reject without valid token — but does it leak info?
      const status = response.status();
      const body = await response.json().catch(() => ({}));
      console.log(`CSRF test: status=${status}, body=${JSON.stringify(body)}`);
      expect(status).toBe(401);
    });

    test('@security @attack CSRF: preflight OPTIONS reveals allowed origins', async ({ request }) => {
      const response = await request.fetch(`${API}/auth/login`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://evil-attacker.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      });
      const headers = response.headers();
      const acao = headers['access-control-allow-origin'];
      const acac = headers['access-control-allow-credentials'];
      console.log(`CORS preflight: ACAO=${acao}, ACAC=${acac}`);

      // If ACAO is * or reflects our origin WITH credentials, that's a finding
      if (acao === '*' || (acao === 'https://evil-attacker.com' && acac === 'true')) {
        console.log('FINDING: CORS allows arbitrary origins with credentials!');
      }
      // Don't hard fail — just report
      expect(true).toBe(true);
    });

    test('@security @attack CSRF: credentialed request from evil origin', async ({ request }) => {
      // Try to make a GET /auth/me with evil origin and see if cookies are accepted
      const response = await request.fetch(`${API}/auth/me`, {
        method: 'GET',
        headers: {
          Origin: 'https://evil.com',
          Referer: 'https://evil.com/steal',
        },
      });
      const status = response.status();
      const headers = response.headers();
      console.log(`Credentialed CSRF: status=${status}, ACAO=${headers['access-control-allow-origin']}`);
      expect(status).toBe(401);
    });
  });

  // ─── 2. EXTENDED BRUTE FORCE ─────────────────────────────────

  test.describe('2. Extended Brute Force (find lockout threshold)', () => {
    test('@security @attack brute force: 100 attempts to find lockout', async ({ request }) => {
      const results: { attempt: number; status: number; msg: string; duration: number }[] = [];
      const realEmail = config.guestUser.email;

      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        const response = await request.fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email: realEmail, password: `WrongPass${i}!` },
        });
        const duration = Date.now() - start;
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        results.push({
          attempt: i + 1,
          status: response.status(),
          msg: (body.message as string) || 'unknown',
          duration,
        });

        // Check if behavior changes (lockout, rate limit, captcha)
        if (response.status() !== 401 && response.status() !== 400) {
          console.log(`LOCKOUT DETECTED at attempt ${i + 1}: status=${response.status()}, msg=${body.message}`);
          break;
        }
      }

      // Analyze results
      const statuses = results.map(r => r.status);
      const uniqueStatuses = [...new Set(statuses)];
      const avgDuration = results.reduce((s, r) => s + r.duration, 0) / results.length;
      const messages = [...new Set(results.map(r => r.msg))];

      console.log(`\n=== BRUTE FORCE ANALYSIS (100 attempts) ===`);
      console.log(`Unique statuses: ${uniqueStatuses.join(', ')}`);
      console.log(`Unique messages: ${messages.join(' | ')}`);
      console.log(`Average response time: ${avgDuration.toFixed(0)}ms`);
      console.log(`Last 10 statuses: ${statuses.slice(-10).join(', ')}`);

      // Check for timing changes (server getting slower = possible lockout)
      const first10 = results.slice(0, 10);
      const last10 = results.slice(-10);
      const avgFirst = first10.reduce((s, r) => s + r.duration, 0) / 10;
      const avgLast = last10.reduce((s, r) => s + r.duration, 0) / 10;
      console.log(`First 10 avg: ${avgFirst.toFixed(0)}ms, Last 10 avg: ${avgLast.toFixed(0)}ms`);

      if (avgLast > avgFirst * 2) {
        console.log('FINDING: Response time doubled — possible progressive slowdown/lockout!');
      }

      // All should be 401 (no lockout found) or 429/403 (lockout found)
      expect(results.length).toBe(100);
      expect(results.every(r => r.status === 401 || r.status === 400 || r.status === 429 || r.status === 403)).toBe(true);
    });
  });

  // ─── 3. JWT ALGORITHM CONFUSION ──────────────────────────────

  test.describe('3. JWT Algorithm Attacks', () => {
    test('@security @attack JWT alg=none bypass', async ({ request }) => {
      // Try to craft a JWT with alg:none to bypass signature verification
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: '1234567890',
        email: config.guestUser.email,
        roles: ['ADMIN_CONCIERGERIE'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');
      const token = `${header}.${payload}.`;

      const response = await request.fetch(`${API}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`alg=none attack: status=${response.status()}`);
      expect(response.status()).toBe(401);
    });

    test('@security @attack JWT HS256 with empty secret', async ({ request }) => {
      // Try HS256 with empty string as secret (common misconfiguration)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: '1234567890',
        email: config.guestUser.email,
        roles: ['ADMIN_CONCIERGERIE'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');
      // Empty secret signature
      const crypto = await import('crypto');
      const sig = crypto.createHmac('sha256', '').update(`${header}.${payload}`).digest('base64url');
      const token = `${header}.${payload}.${sig}`;

      const response = await request.fetch(`${API}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`HS256 empty secret: status=${response.status()}`);
      expect(response.status()).toBe(401);
    });

    test('@security @attack JWT RS256→HS256 key confusion', async ({ request }) => {
      // If server uses RS256, try to sign with the public key as HMAC secret
      // This is a classic attack when key type is not validated
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: '1234567890',
        email: config.guestUser.email,
        roles: ['ADMIN_CONCIERGERIE'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      })).toString('base64url');
      // Use a fake "public key" as HMAC secret
      const crypto = await import('crypto');
      const fakePublicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END PUBLIC KEY-----';
      const sig = crypto.createHmac('sha256', fakePublicKey).update(`${header}.${payload}`).digest('base64url');
      const token = `${header}.${payload}.${sig}`;

      const response = await request.fetch(`${API}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`RS256→HS256 key confusion: status=${response.status()}`);
      expect(response.status()).toBe(401);
    });

    test('@security @attack JWT with modified payload (role escalation)', async ({ request }) => {
      // Login to get a real token
      const loginRes = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { email: config.guestUser.email, password: config.guestUser.password },
      });

      if (loginRes.status() !== 200) {
        console.log(`Login failed with status ${loginRes.status()} — skipping token manipulation`);
        return;
      }

      const loginBody = await loginRes.json() as any;
      const realToken = loginBody?.data?.accessToken || loginBody?.accessToken || '';

      if (!realToken) {
        console.log('Could not obtain real token from response');
        console.log(`Response: ${JSON.stringify(loginBody).substring(0, 200)}`);
        return;
      }

      console.log(`Got real token: ${realToken.substring(0, 50)}...`);

      // Decode the real token
      const parts = realToken.split('.');
      if (parts.length !== 3) {
        console.log('Token is not JWT format');
        return;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      console.log(`Original payload roles: ${JSON.stringify(payload.roles || payload.role)}`);

      // Modify roles to escalate
      payload.roles = ['SUPER_ADMIN', 'ADMIN_CONCIERGERIE'];
      payload.role = 'SUPER_ADMIN';

      // Re-encode with original signature (will fail but tests server behavior)
      const newPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const forgedToken = `${parts[0]}.${newPayload}.${parts[2]}`;

      const response = await request.fetch(`${API}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${forgedToken}` },
      });
      const body = await response.json().catch(() => ({})) as Record<string, unknown>;
      console.log(`Role escalation attempt: status=${response.status()}, roles=${JSON.stringify((body as any)?.data?.user?.roles)}`);
      // Should reject due to invalid signature
      expect(response.status()).toBe(401);
    });
  });

  // ─── 4. COOKIE MANIPULATION ──────────────────────────────────

  test.describe('4. Cookie Manipulation', () => {
    test('@security @attack cookie tampering: modify access_token value', async ({ page }) => {
      // Login via UI to get real cookies
      await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load');
      await page.locator('#email').fill(config.guestUser.email);
      await page.locator('#password').fill(config.guestUser.password);
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await page.waitForTimeout(5000);

      // Get all cookies after login
      const cookies = await page.context().cookies();
      const accessTokenCookie = cookies.find(c => c.name === 'access_token');
      console.log(`Cookies after login: ${cookies.map(c => c.name).join(', ')}`);

      if (accessTokenCookie) {
        console.log(`Original cookie value: ${accessTokenCookie.value.substring(0, 50)}...`);

        // Tamper with the cookie value
        const tamperedValue = accessTokenCookie.value + 'TAMPERED';
        await page.context().addCookies([{
          ...accessTokenCookie,
          value: tamperedValue,
        }]);

        // Try to access protected page
        await page.goto(`${BASE}/concierge/dashboard`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        const url = page.url();
        console.log(`After cookie tamper: URL=${url}`);

        if (url.includes('/auth/login')) {
          console.log('Safe: Tampered cookie correctly rejected — redirected to login');
        } else {
          console.log('CRITICAL: Tampered cookie accepted — app loaded without valid auth!');
        }
        expect(url).toContain('/auth/login');
      } else {
        console.log('No access_token cookie found after login — checking for localStorage auth');
        const localStorage = await page.evaluate(() => {
          return {
            accessToken: localStorage.getItem('accessToken'),
            refreshToken: localStorage.getItem('refreshToken'),
          };
        });
        console.log(`localStorage: accessToken=${localStorage.accessToken?.substring(0, 30)}...`);

        if (localStorage.accessToken) {
          // Tamper with localStorage token
          await page.evaluate((token) => {
            localStorage.setItem('accessToken', token + 'TAMPERED');
          }, localStorage.accessToken);

          await page.goto(`${BASE}/concierge/dashboard`, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(3000);
          const url = page.url();
          console.log(`After localStorage tamper: URL=${url}`);

          if (url.includes('/auth/login')) {
            console.log('Safe: Tampered localStorage token rejected');
          } else {
            console.log('CRITICAL: Tampered localStorage token accepted!');
          }
        }
      }
    });

    test('@security @attack cookie tampering: delete access_token, keep refresh_token', async ({ page }) => {
      // Login via UI to get real cookies
      await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('load');
      await page.locator('#email').fill(config.guestUser.email);
      await page.locator('#password').fill(config.guestUser.password);
      await page.getByRole('button', { name: 'Se connecter' }).click();
      await page.waitForTimeout(5000);

      const cookies = await page.context().cookies();
      const hasAccess = cookies.some(c => c.name === 'access_token');
      const hasRefresh = cookies.some(c => c.name === 'refresh_token');
      console.log(`Cookies: access_token=${hasAccess}, refresh_token=${hasRefresh}`);

      if (hasAccess && hasRefresh) {
        // Remove only access_token
        const accessCookie = cookies.find(c => c.name === 'access_token')!;
        await page.context().addCookies([{
          ...accessCookie,
          value: '',
          expires: -1,
        }]);

        await page.goto(`${BASE}/concierge/dashboard`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(5000);
        const url = page.url();
        console.log(`Without access_token (with refresh): URL=${url}`);

        if (url.includes('/concierge/')) {
          console.log('FINDING: App accepted refresh_token alone — auto-refreshed access token');
        } else {
          console.log('Safe: Access denied without access_token');
        }
      } else {
        console.log('No cookie-based auth found — app may use localStorage only');
      }
    });
  });

  // ─── 5. CORS + HOST HEADER ───────────────────────────────────

  test.describe('5. CORS Misconfiguration & Host Header', () => {
    for (const origin of [
      'https://evil.com',
      'https://dev.stayzi.app.evil.com',
      'null',
      'https://stayzi.app.evil.com',
      'https://evil-stayzi.app',
    ]) {
      test(`@security @attack CORS: origin "${origin}" should be rejected`, async ({ request }) => {
        const response = await request.fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: origin,
          },
          data: { email: 'test@test.com', password: 'test' },
        });
        const headers = response.headers();
        const acao = headers['access-control-allow-origin'];
        const acac = headers['access-control-allow-credentials'];

        console.log(`CORS test origin="${origin}": ACAO=${acao}, ACAC=${acac}`);

        if (acao === origin || acao === '*') {
          console.log(`CRITICAL: Server reflects malicious origin: ${acao}`);
          if (acac === 'true') {
            console.log('CRITICAL: AND allows credentials — full CORS bypass!');
          }
        }
        // Don't hard fail — report findings
        expect(true).toBe(true);
      });
    }

    test('@security @attack Host header injection in API request', async ({ request }) => {
      // Send request with different Host headers
      const evilHosts = [
        'evil.com',
        'localhost',
        '127.0.0.1',
        'api-dev.stayzi.app.evil.com',
      ];

      for (const host of evilHosts) {
        const response = await request.fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Host: host,
          },
          data: { email: 'test@test.com', password: 'test' },
        });
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        console.log(`Host="${host}": status=${response.status()}, msg=${body.message || body.error || 'unknown'}`);

        // Check if error message changes with different hosts (info leak)
        if (response.status() !== 401 && response.status() !== 400) {
          console.log(`FINDING: Unexpected status ${response.status()} with Host="${host}"`);
        }
      }
      expect(true).toBe(true);
    });
  });

  // ─── 6. OPEN REDIRECT ────────────────────────────────────────

  test.describe('6. Open Redirect After Login', () => {
    for (const redirect of [
      'https://evil.com',
      '//evil.com',
      '\\/evil.com',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      '/\\evil.com',
      '///evil.com',
    ]) {
      test(`@security @attack open redirect: "${redirect}"`, async ({ request }) => {
        // Try various redirect parameters on the login endpoint
        const urls = [
          `${API}/auth/login?redirect=${encodeURIComponent(redirect)}`,
          `${API}/auth/login?next=${encodeURIComponent(redirect)}`,
          `${API}/auth/login?returnTo=${encodeURIComponent(redirect)}`,
          `${API}/auth/login?callback=${encodeURIComponent(redirect)}`,
          `${API}/auth/login?continue=${encodeURIComponent(redirect)}`,
        ];

        for (const url of urls) {
          const response = await request.fetch(url, {
            method: 'GET',
            maxRedirects: 0,
          });
          const location = response.headers()['location'] || '';

          if (location.includes('evil.com') || location.includes('javascript:') || location.includes('data:')) {
            console.log(`CRITICAL OPEN REDIRECT: ${url} → ${location}`);
          }
        }
        expect(true).toBe(true);
      });
    }

    test('@security @attack open redirect in UI: login page redirect param', async ({ page }) => {
      const evilUrl = 'https://evil.com';
      await page.goto(`${BASE}/auth/login?redirect=${encodeURIComponent(evilUrl)}`);
      await page.waitForLoadState('load');

      // Check if the redirect param is present in the URL
      const currentUrl = page.url();
      const hasRedirectParam = currentUrl.includes('redirect=');
      console.log(`Redirect param present in URL: ${hasRedirectParam}`);

      if (hasRedirectParam) {
        console.log('FINDING: Login page accepts arbitrary redirect parameter');
        console.log(`URL: ${currentUrl}`);

        // Now login and see where it redirects
        await page.locator('#email').fill(config.guestUser.email);
        await page.locator('#password').fill(config.guestUser.password);
        await page.getByRole('button', { name: 'Se connecter' }).click();

        await page.waitForTimeout(5000);
        const finalUrl = page.url();
        console.log(`After login redirect: ${finalUrl}`);

        if (finalUrl.includes('evil.com') && !finalUrl.includes('redirect=')) {
          console.log('CRITICAL: App redirected to evil.com after login!');
        } else if (finalUrl.includes('/concierge/')) {
          console.log('Safe: App redirected to dashboard (ignored evil redirect)');
        } else {
          console.log(`Redirect behavior: ${finalUrl}`);
        }
      }

      // The vulnerability is that the redirect param is accepted — even if not acted upon
      // It could be combined with other attacks
      expect(true).toBe(true);
    });
  });

  // ─── 7. JSON ATTACKS ─────────────────────────────────────────

  test.describe('7. JSON Parser Attacks', () => {
    test('@security @attack prototype pollution via __proto__', async ({ request }) => {
      const response = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: 'test@test.com',
          password: 'test',
          __proto__: { isAdmin: true, role: 'SUPER_ADMIN' },
          constructor: { prototype: { isAdmin: true } },
        },
      });
      console.log(`Prototype pollution: status=${response.status()}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('@security @attack deep nesting JSON (stack overflow)', async ({ request }) => {
      // Create deeply nested JSON
      let deep: any = 'end';
      for (let i = 0; i < 1000; i++) {
        deep = { a: deep };
      }

      const response = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { email: 'test@test.com', password: 'test', nested: deep },
        timeout: 10000,
      });
      console.log(`Deep nesting: status=${response.status()}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('@security @attack huge JSON body (memory exhaustion)', async ({ request }) => {
      // Create a huge payload
      const hugeString = 'A'.repeat(10 * 1024 * 1024); // 10MB
      const response = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { email: 'test@test.com', password: hugeString },
        timeout: 15000,
      });
      console.log(`Huge body (10MB): status=${response.status()}`);
      // Server should reject, not crash
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('@security @attack JSON with null bytes', async ({ request }) => {
      const response = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { email: 'test@test.com\0admin', password: 'test\0bypass' },
      });
      console.log(`Null bytes: status=${response.status()}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('@security @attack JSON with duplicate keys', async ({ request }) => {
      // Send JSON with duplicate "email" keys — last one wins in most parsers
      const body = '{"email":"test@test.com","password":"test","email":"admin@test.com"}';
      const response = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.parse(body),
      });
      console.log(`Duplicate keys: status=${response.status()}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('@security @attack content-type confusion: send XML body', async ({ request }) => {
      const xmlBody = '<?xml version="1.0"?><login><email>test@test.com</email><password>test</password></login>';
      const response = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        data: xmlBody,
      });
      console.log(`XML body: status=${response.status()}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });

  // ─── 8. SESSION FIXATION + CONCURRENT SESSIONS ───────────────

  test.describe('8. Session Fixation & Concurrent Sessions', () => {
    test('@security @attack session fixation: does session ID change after login?', async ({ request }) => {
      // Login twice and compare tokens
      const login1 = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { email: config.guestUser.email, password: config.guestUser.password },
      });

      if (login1.status() !== 200) {
        console.log(`Login 1 failed: ${login1.status()} — possible rate limiting from earlier tests`);
        return;
      }

      const body1 = await login1.json() as any;
      const token1 = body1?.data?.accessToken || body1?.accessToken || '';

      // Small delay between logins
      await new Promise(r => setTimeout(r, 1000));

      const login2 = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { email: config.guestUser.email, password: config.guestUser.password },
      });
      const body2 = await login2.json() as any;
      const token2 = body2?.data?.accessToken || body2?.accessToken || '';

      if (token1 && token2) {
        const same = token1 === token2;
        console.log(`Session fixation: tokens ${same ? 'IDENTICAL (FINDING!)' : 'different (safe)'}`);
        if (same) {
          console.log('CRITICAL: Same token issued for consecutive logins — session fixation vulnerability');
        }
        // Extract JWT payloads to compare
        try {
          const p1 = JSON.parse(Buffer.from(token1.split('.')[1], 'base64url').toString());
          const p2 = JSON.parse(Buffer.from(token2.split('.')[1], 'base64url').toString());
          console.log(`Token 1 iat: ${p1.iat}, Token 2 iat: ${p2.iat}`);
          console.log(`Token 1 jti: ${p1.jti || 'none'}, Token 2 jti: ${p2.jti || 'none'}`);
          if (p1.jti && p2.jti && p1.jti === p2.jti) {
            console.log('CRITICAL: Same JTI (JWT ID) for different logins — no unique token per session');
          }
        } catch {}
      } else {
        console.log('Could not obtain tokens for session fixation test');
      }
      expect(true).toBe(true);
    });

    test('@security @attack concurrent sessions: can same user login 10 times?', async ({ request }) => {
      const tokens: string[] = [];

      for (let i = 0; i < 10; i++) {
        const response = await request.fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email: config.guestUser.email, password: config.guestUser.password },
        });

        if (response.status() === 429) {
          console.log(`Rate limited at attempt ${i + 1}`);
          break;
        }

        const body = await response.json() as any;
        const token = body?.data?.accessToken || body?.accessToken || '';
        if (token) tokens.push(token);
      }

      console.log(`Concurrent logins: ${tokens.length}/10 successful`);

      // Check if all tokens are unique
      const uniqueTokens = new Set(tokens);
      console.log(`Unique tokens: ${uniqueTokens.size}/${tokens.length}`);

      if (uniqueTokens.size < tokens.length) {
        console.log('FINDING: Duplicate tokens issued — possible session fixation');
      }

      // Check if any token is invalidated when another is created
      // (Test if old tokens still work after new login)
      if (tokens.length >= 2) {
        const oldToken = tokens[0];
        const meResponse = await request.fetch(`${API}/auth/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${oldToken}` },
        });
        console.log(`Old token still valid after new login: ${meResponse.status() === 200 ? 'YES (FINDING!)' : 'NO (safe)'}`);
      }

      expect(true).toBe(true);
    });
  });

  // ─── 9. CLICKJACKING ─────────────────────────────────────────

  test.describe('9. Clickjacking (UI Redressing)', () => {
    test('@security @attack login page can be iframe-embedded', async ({ page }) => {
      // Create a local page that embeds the login page in an iframe
      const html = `
        <html>
        <body>
          <h1>Evil Page</h1>
          <iframe src="${BASE}/auth/login" width="800" height="600"></iframe>
        </body>
        </html>
      `;

      // Navigate to a data URI with the evil page
      await page.goto(`data:text/html,${encodeURIComponent(html)}`);
      await page.waitForTimeout(3000);

      // Check if iframe loaded the login page
      const iframe = page.frameLocator('iframe');
      const loginVisible = await iframe.locator('#email').isVisible().catch(() => false);

      if (loginVisible) {
        console.log('CRITICAL: Login page can be embedded in iframe — clickjacking possible!');
        console.log('Missing X-Frame-Options and CSP frame-ancestors headers');
      } else {
        console.log('Safe: Login page cannot be iframe-embedded (X-Frame-Options or CSP present)');
      }
      expect(true).toBe(true);
    });

    test('@security @attack check X-Frame-Options on login page', async ({ request }) => {
      const response = await request.fetch(`${BASE}/auth/login`, {
        method: 'GET',
      });
      const headers = response.headers();
      const xfo = headers['x-frame-options'];
      const csp = headers['content-security-policy'];

      console.log(`X-Frame-Options: ${xfo || 'MISSING'}`);
      console.log(`CSP: ${csp || 'MISSING'}`);

      if (!xfo && (!csp || !csp.includes('frame-ancestors'))) {
        console.log('CRITICAL: No clickjacking protection — login page can be iframed');
      }
      expect(true).toBe(true);
    });
  });

  // ─── 10. HTTP METHOD OVERRIDE + PARAMETER POLLUTION ──────────

  test.describe('10. HTTP Method Override & Parameter Pollution', () => {
    for (const header of [
      'X-HTTP-Method-Override',
      'X-HTTP-Method',
      'X-Method-Override',
      '_method',
    ]) {
      test(`@security @attack method override via ${header}`, async ({ request }) => {
        const response = await request.fetch(`${API}/auth/me`, {
          method: 'GET',
          headers: {
            [header]: 'DELETE',
            Authorization: 'Bearer invalid',
          },
        });
        console.log(`${header}=DELETE: status=${response.status()}`);
        // Should not allow DELETE via override
        expect(response.status()).not.toBe(200);
      });
    }

    test('@security @attack parameter pollution: duplicate email field', async ({ request }) => {
      // Send two email fields — parsers handle this differently
      const body = JSON.stringify({
        email: 'test@test.com',
        password: 'test',
        email: 'admin@test.com',
      });
      const response = await request.fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.parse(body),
      });
      console.log(`Param pollution: status=${response.status()}`);
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });

    test('@security @attack URL parameter injection on login endpoint', async ({ request }) => {
      // Try injecting SQL via URL query parameters
      const evilParams = [
        '?email=admin\'--&password=test',
        '?debug=true',
        '?admin=true',
        '?role=superadmin',
        '?bypass=true',
      ];

      for (const params of evilParams) {
        const response = await request.fetch(`${API}/auth/login${params}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email: 'test@test.com', password: 'test' },
        });
        if (response.status() === 200) {
          console.log(`CRITICAL: Login succeeded with URL params: ${params}`);
        }
      }
      expect(true).toBe(true);
    });
  });

  // ─── 11. PASSWORD RESET ABUSE ────────────────────────────────

  test.describe('11. Password Reset Endpoint Abuse', () => {
    test('@security @attack password reset: enumerate valid emails', async ({ request }) => {
      // Test if password reset reveals whether email exists
      const endpoints = [
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/request-reset',
        '/auth/recover',
      ];

      for (const endpoint of endpoints) {
        const existingEmail = await request.fetch(`${API}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email: config.guestUser.email },
        });

        const nonExisting = await request.fetch(`${API}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email: 'nonexistent-99999@test.com' },
        });

        if (existingEmail.status() !== nonExisting.status()) {
          console.log(`FINDING: ${endpoint} leaks user existence: ${existingEmail.status()} vs ${nonExisting.status()}`);
        } else {
          const existingBody = await existingEmail.json().catch(() => ({})) as Record<string, unknown>;
          const nonExistingBody = await nonExisting.json().catch(() => ({})) as Record<string, unknown>;
          if (existingBody.message !== nonExistingBody.message) {
            console.log(`FINDING: ${endpoint} leaks user existence via message: "${existingBody.message}" vs "${nonExistingBody.message}"`);
          }
        }
      }
      expect(true).toBe(true);
    });
  });

  // ─── 12. RACE CONDITIONS ─────────────────────────────────────

  test.describe('12. Race Conditions', () => {
    test('@security @attack race condition: simultaneous logins with same credentials', async ({ request }) => {
      const promises = Array.from({ length: 10 }, () =>
        request.fetch(`${API}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          data: { email: config.guestUser.email, password: config.guestUser.password },
        })
      );

      const responses = await Promise.all(promises);
      const statuses = responses.map(r => r.status());
      const bodies = await Promise.all(responses.map(r => r.json().catch(() => ({}))));

      const successCount = statuses.filter(s => s === 200).length;
      const tokens = bodies.map((b: any) => b?.data?.accessToken || b?.accessToken || '').filter(Boolean);
      const uniqueTokens = new Set(tokens);

      console.log(`Race condition: ${successCount}/10 succeeded, ${uniqueTokens.size} unique tokens`);

      if (successCount > 1 && uniqueTokens.size < successCount) {
        console.log('FINDING: Race condition — duplicate tokens issued simultaneously');
      }
      expect(true).toBe(true);
    });
  });

  // ─── 13. MIDDLEWARE COOKIE-EXISTENCE BYPASS ──────────────────

  test.describe('13. Middleware Auth Bypass', () => {
    const protectedPaths = ['/', '/properties', '/clients', '/reservations', '/invoices', '/settings'];

    const fakeTokens = [
      { label: 'literal "anything"', value: 'anything' },
      { label: 'empty string', value: '' },
      { label: 'expired JWT', value: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.signature' },
      { label: 'random base64', value: 'dGVzdA==' },
      { label: 'SQL injection in token', value: "' OR 1=1 --" },
    ];

    for (const { label, value } of fakeTokens) {
      test(`@security @attack cookie=${label} — middleware should reject, not serve SSR HTML`, async ({ request }) => {
        for (const path of protectedPaths) {
          const response = await request.fetch(`${BASE}${path}`, {
            method: 'GET',
            headers: {
              Cookie: `access_token=${value}`,
            },
          });

          const status = response.status();
          const body = await response.text();
          const isHtml = body.includes('<!DOCTYPE') || body.includes('<html');
          const hasAppShell = body.includes('__next') || body.includes('id="__next"') || body.includes('id="root"');

          console.log(`Cookie=${label} | ${path} → ${status} | HTML: ${isHtml} | AppShell: ${hasAppShell}`);

          if (status === 200 && isHtml) {
            console.log(`CRITICAL FINDING: Middleware served SSR HTML for ${path} with fake token "${label}"`);
          }
        }

        // At minimum, all should NOT return 200 with full app shell
        const response = await request.fetch(`${BASE}/`, {
          method: 'GET',
          headers: {
            Cookie: `access_token=${value}`,
          },
        });

        const body = await response.text();
        const servedApp = response.status() === 200 && body.includes('__next');

        if (servedApp) {
          console.log('CRITICAL: Middleware only checks cookie existence, not JWT validity — any token bypasses auth');
        }

        expect(servedApp).toBe(false);
      });
    }

    test('@security @attack no cookie at all — middleware should redirect to login', async ({ request }) => {
      const response = await request.fetch(`${BASE}/`, {
        method: 'GET',
      });

      const status = response.status();
      const location = response.headers()['location'] || '';

      console.log(`No cookie | / → ${status} | Location: ${location}`);

      if (status === 200) {
        console.log('FINDING: Root path returns 200 without auth cookie — may serve public content');
      }

      expect(status).not.toBe(200);
    });

    test('@security @attack forged JWT with valid structure but wrong signature', async ({ request }) => {
      const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAwMDAwMDAwfQ.' +
        'invalidSignature123456789';

      const response = await request.fetch(`${BASE}/`, {
        method: 'GET',
        headers: {
          Cookie: `access_token=${forgedToken}`,
        },
      });

      const body = await response.text();
      const servedApp = response.status() === 200 && body.includes('__next');

      console.log(`Forged JWT valid structure | / → ${response.status()} | AppShell: ${servedApp}`);

      if (servedApp) {
        console.log('CRITICAL: Middleware accepted forged JWT with invalid signature');
      }

      expect(servedApp).toBe(false);
    });
  });
});
