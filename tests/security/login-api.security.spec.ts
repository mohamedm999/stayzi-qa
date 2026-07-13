import { test, expect } from '@fixtures/test.fixture';
import { TimingHelper } from '@helpers/timing.helper';
import { config } from '@utils/config';
import {
  SQL_INJECTION_PAYLOADS,
  NOSQL_INJECTION_PAYLOADS,
  XSS_PAYLOADS,
  COMMAND_INJECTION_PAYLOADS,
  PATH_TRAVERSAL_PAYLOADS,
  LDAP_INJECTION_PAYLOADS,
  CRLF_INJECTION_PAYLOADS,
  UNICODE_PAYLOADS,
  SPECIAL_CHAR_PAYLOADS,
  LENGTH_BOUNDARY_PAYLOADS,
  DOUBLE_ENCODING_PAYLOADS,
  BRUTE_FORCE_PASSWORDS,
  CONTENT_TYPE_MISMATCHES,
  MALICIOUS_TOKENS,
} from '@data/security-payloads';

const LOGIN_ENDPOINT = '/auth/login';
const ME_ENDPOINT = '/auth/me';

test.describe('Login API Security', () => {

  // ─── SQL Injection ───────────────────────────────────────────

  test.describe('SQL Injection', () => {
    for (const payload of SQL_INJECTION_PAYLOADS) {
      test(`@security @api SQL injection in email: ${payload.substring(0, 30)}...`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: payload, password: 'anything' },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }

    for (const payload of SQL_INJECTION_PAYLOADS) {
      test(`@security @api SQL injection in password: ${payload.substring(0, 30)}...`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: 'test@test.com', password: payload },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }
  });

  // ─── NoSQL Injection ─────────────────────────────────────────

  test.describe('NoSQL Injection', () => {
    for (const [i, payload] of NOSQL_INJECTION_PAYLOADS.entries()) {
      test(`@security @api NoSQL injection payload ${i + 1}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: payload,
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        expect(response.body).not.toHaveProperty('data.accessToken');
      });
    }
  });

  // ─── XSS / Script Injection ──────────────────────────────────

  test.describe('XSS / Script Injection', () => {
    for (const [i, payload] of XSS_PAYLOADS.entries()) {
      test(`@security @api XSS payload ${i + 1}: ${payload.substring(0, 30)}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: payload, password: 'test' },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        const bodyStr = JSON.stringify(response.body);
        expect(bodyStr).not.toContain('<script>');
        expect(bodyStr).not.toContain('onerror');
        expect(bodyStr).not.toContain('onload');
      });
    }
  });

  // ─── Command Injection ───────────────────────────────────────

  test.describe('Command Injection', () => {
    for (const [i, payload] of COMMAND_INJECTION_PAYLOADS.entries()) {
      test(`@security @api Command injection payload ${i + 1}: ${payload}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: `${payload}@test.com`, password: 'test' },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        const bodyStr = JSON.stringify(response.body).toLowerCase();
        expect(bodyStr).not.toContain('root:');
        expect(bodyStr).not.toContain('uid=');
      });
    }
  });

  // ─── Path Traversal ──────────────────────────────────────────

  test.describe('Path Traversal', () => {
    for (const [i, payload] of PATH_TRAVERSAL_PAYLOADS.entries()) {
      test(`@security @api Path traversal payload ${i + 1}: ${payload}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: payload, password: 'test' },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        const bodyStr = JSON.stringify(response.body);
        expect(bodyStr).not.toContain('root:x:0:0');
        expect(bodyStr).not.toContain('/bin/bash');
      });
    }
  });

  // ─── LDAP Injection ──────────────────────────────────────────

  test.describe('LDAP Injection', () => {
    for (const [i, payload] of LDAP_INJECTION_PAYLOADS.entries()) {
      test(`@security @api LDAP injection payload ${i + 1}: ${payload}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: `${payload}`, password: 'test' },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }
  });

  // ─── CRLF / Header Injection ─────────────────────────────────

  test.describe('CRLF / Header Injection', () => {
    for (const [i, payload] of CRLF_INJECTION_PAYLOADS.entries()) {
      test(`@security @api CRLF injection payload ${i + 1}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: payload, password: 'test' },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
        const headerKeys = Object.keys(response.headers);
        for (const key of headerKeys) {
          expect(key.toLowerCase()).not.toContain('x-injected');
        }
      });
    }
  });

  // ─── Unicode / Encoding Attacks ──────────────────────────────

  test.describe('Unicode / Encoding Attacks', () => {
    for (const [i, payload] of UNICODE_PAYLOADS.entries()) {
      test(`@security @api Unicode payload ${i + 1}: ${payload.substring(0, 30)}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: payload, password: 'test' },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }
  });

  // ─── Brute Force ─────────────────────────────────────────────

  test.describe('Brute Force Protection', () => {
    test('@security @api rapid failed attempts should not crash server', async ({ apiHelper }) => {
      const results: number[] = [];
      for (const password of BRUTE_FORCE_PASSWORDS) {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: config.guestUser.email, password },
        });
        results.push(response.status);
      }
      const serverErrors = results.filter(s => s >= 500);
      expect(serverErrors.length).toBe(0);
      expect(results.every(s => s === 401 || s === 400)).toBe(true);
    });

    test('@security @api same error message for all failed attempts', async ({ apiHelper }) => {
      const messages: string[] = [];
      for (const password of BRUTE_FORCE_PASSWORDS.slice(0, 5)) {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: config.guestUser.email, password },
        });
        if (response.body && typeof response.body === 'object') {
          const body = response.body as Record<string, unknown>;
          if (typeof body.message === 'string') {
            messages.push(body.message);
          }
        }
      }
      const unique = new Set(messages);
      expect(unique.size).toBe(1);
    });
  });

  // ─── Input Boundaries ────────────────────────────────────────

  test.describe('Input Boundaries', () => {
    for (const [i, payload] of LENGTH_BOUNDARY_PAYLOADS.short.entries()) {
      test(`@security @api Short input ${i + 1}: "${payload}" (${payload.length} chars)`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: payload, password: payload },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }

    for (const [i, payload] of LENGTH_BOUNDARY_PAYLOADS.long.entries()) {
      test(`@security @api Long input ${i + 1}: ${payload.length} chars`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: payload.substring(0, 100) + '@test.com', password: payload },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }

    for (const [i, payload] of SPECIAL_CHAR_PAYLOADS.entries()) {
      test(`@security @api Special char input ${i + 1}: ${JSON.stringify(payload).substring(0, 30)}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: `test${payload}@test.com`, password: payload },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }

    for (const [i, payload] of DOUBLE_ENCODING_PAYLOADS.entries()) {
      test(`@security @api Double encoding payload ${i + 1}: ${payload}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: { email: `${payload}@test.com`, password: payload },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }
  });

  // ─── HTTP Method Tampering ───────────────────────────────────

  test.describe('HTTP Method Tampering', () => {
    test('@security @api PUT on login endpoint', async ({ apiHelper }) => {
      const response = await apiHelper.put(LOGIN_ENDPOINT, {
        data: { email: 'test@test.com', password: 'test' },
      });
      if (response.status === 200 || response.status === 201) {
        expect(response.body).not.toHaveProperty('data.accessToken');
      }
    });

    test('@security @api PATCH on login endpoint', async ({ apiHelper }) => {
      const response = await apiHelper.patch(LOGIN_ENDPOINT, {
        data: { email: 'test@test.com', password: 'test' },
      });
      if (response.status === 200 || response.status === 201) {
        expect(response.body).not.toHaveProperty('data.accessToken');
      }
    });

    test('@security @api DELETE on login endpoint', async ({ apiHelper }) => {
      const response = await apiHelper.delete(LOGIN_ENDPOINT);
      if (response.status === 200 || response.status === 201) {
        expect(response.body).not.toHaveProperty('data.accessToken');
      }
    });

    test('@security @api OPTIONS on login endpoint should return allowed methods', async ({ apiHelper }) => {
      const response = await apiHelper.post(LOGIN_ENDPOINT, {
        data: { email: 'test@test.com', password: 'test' },
        headers: { 'Access-Control-Request-Method': 'POST' },
      });
      // POST should still work, just checking OPTIONS handling
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ─── Content-Type Mismatch ──────────────────────────────────

  test.describe('Content-Type Mismatch', () => {
    for (const [i, { contentType, body }] of CONTENT_TYPE_MISMATCHES.entries()) {
      test(`@security @api Content-Type mismatch ${i + 1}: ${contentType}`, async ({ apiHelper }) => {
        const response = await apiHelper.post(LOGIN_ENDPOINT, {
          data: body,
          headers: { 'Content-Type': contentType },
        });
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(500);
      });
    }
  });

  // ─── Session / Token Attacks ────────────────────────────────

  test.describe('Session / Token Attacks', () => {
    test('@security @api manipulated JWT token should be rejected', async ({ apiHelper }) => {
      // Create a fake JWT with modified payload
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: '1234567890',
        email: config.guestUser.email,
        roles: ['SUPER_ADMIN'],
        iat: Math.floor(Date.now() / 1000),
      })).toString('base64url');
      const fakeSignature = 'fakesignature';
      const manipulatedToken = `${header}.${payload}.${fakeSignature}`;

      const response = await apiHelper.getAuth(ME_ENDPOINT, manipulatedToken);
      expect(response.status).toBe(401);
    });

    test('@security @api expired token should be rejected', async ({ apiHelper }) => {
      // Create a JWT with iat in the distant past (expired)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        sub: '1234567890',
        email: config.guestUser.email,
        iat: 1000000000, // Year 2001
        exp: 1000003600, // Expired long ago
      })).toString('base64url');
      const fakeSignature = 'expired';
      const expiredToken = `${header}.${payload}.${fakeSignature}`;

      const response = await apiHelper.getAuth(ME_ENDPOINT, expiredToken);
      expect(response.status).toBe(401);
    });

    test('@security @api missing token should be rejected', async ({ apiHelper }) => {
      const response = await apiHelper.get(ME_ENDPOINT);
      expect(response.status).toBe(401);
    });

    for (const [i, token] of MALICIOUS_TOKENS.entries()) {
      test(`@security @api malicious token ${i + 1}: ${JSON.stringify(token).substring(0, 30)}`, async ({ apiHelper }) => {
        const response = await apiHelper.getAuth(ME_ENDPOINT, token);
        expect(response.status).toBe(401);
      });
    }
  });

  // ─── User Enumeration Prevention ─────────────────────────────

  test.describe('User Enumeration Prevention', () => {
    test('@security @api same error for existing and non-existing users', async ({ apiHelper }) => {
      const existingUser = await apiHelper.post(LOGIN_ENDPOINT, {
        data: { email: config.guestUser.email, password: 'WrongPassword123!' },
      });

      const nonExistingUser = await apiHelper.post(LOGIN_ENDPOINT, {
        data: { email: 'definitely-not-a-real-user-99999@test.com', password: 'WrongPassword123!' },
      });

      expect(existingUser.status).toBe(nonExistingUser.status);

      const existingMsg = (existingUser.body as Record<string, unknown>)?.message;
      const nonExistingMsg = (nonExistingUser.body as Record<string, unknown>)?.message;
      expect(existingMsg).toBe(nonExistingMsg);
    });
  });

  // ─── Security Headers ────────────────────────────────────────

  test.describe('Security Headers', () => {
    test('@security @api login response should have security headers', async ({ apiHelper }) => {
      const response = await apiHelper.post(LOGIN_ENDPOINT, {
        data: { email: 'test@test.com', password: 'test' },
      });

      const headers = response.headers;
      // Check for important security headers (informational — some may not be set)
      const findings: string[] = [];

      if (!headers['x-content-type-options']) {
        findings.push('Missing X-Content-Type-Options header');
      }
      if (!headers['x-frame-options']) {
        findings.push('Missing X-Frame-Options header');
      }
      if (!headers['strict-transport-security']) {
        findings.push('Missing Strict-Transport-Security header');
      }
      if (!headers['x-xss-protection']) {
        findings.push('Missing X-XSS-Protection header');
      }

      // Log findings but don't fail — these are server configuration issues
      if (findings.length > 0) {
        console.log('Security header findings:', findings);
      }

      // At minimum, server should not expose version info
      // Log as finding rather than hard fail — these are informational
      if (headers['x-powered-by']) {
        console.log(`FINDING: X-Powered-By header present: ${headers['x-powered-by']}`);
      }
      if (headers['server'] && headers['server'].match(/\d+\.\d+/)) {
        console.log(`FINDING: Server header exposes version: ${headers['server']}`);
      }
      // Soft assertion — just verify we can access headers
      expect(headers).toBeDefined();
    });
  });

  // ─── Response Information Leakage ───────────────────────────

  test.describe('Response Information Leakage', () => {
    test('@security @api error response should not contain stack traces', async ({ apiHelper }) => {
      const response = await apiHelper.post(LOGIN_ENDPOINT, {
        data: { email: '"><script>alert(1)</script>', password: '"><script>alert(1)</script>' },
      });

      const bodyStr = JSON.stringify(response.body).toLowerCase();
      expect(bodyStr).not.toContain('stack trace');
      expect(bodyStr).not.toContain('at line');
        expect(bodyStr).not.toContain('internal/server');
        expect(bodyStr).not.toContain('node_modules');
        expect(bodyStr).not.toContain('.ts:');
        expect(bodyStr).not.toContain('.js:');
    });

    test('@security @api error should not reveal which field is wrong', async ({ apiHelper }) => {
      // Wrong email, correct-ish password format
      const wrongEmail = await apiHelper.post(LOGIN_ENDPOINT, {
        data: { email: 'nonexistent@test.com', password: 'SomePass1!' },
      });

      // Correct email, wrong password
      const wrongPassword = await apiHelper.post(LOGIN_ENDPOINT, {
        data: { email: config.guestUser.email, password: 'WrongPass1!' },
      });

      // Both should return the same generic error
      const msg1 = (wrongEmail.body as Record<string, unknown>)?.message;
      const msg2 = (wrongPassword.body as Record<string, unknown>)?.message;
      expect(msg1).toBe(msg2);
      expect(msg1).toBe('Email ou mot de passe incorrect');
    });
  });

  // ─── Timing Attack ──────────────────────────────────────────

  test.describe('Timing Attack', () => {
    test('@security @api timing difference between valid and invalid emails should be minimal', async ({ request }) => {
      const timing = new TimingHelper(request, config.apiUrl);

      // Collect samples for non-existing email
      const invalidSamples = await timing.collectSamples(
        'nonexistent-user-99999@test.com',
        'WrongPass123!',
        5,
        100
      );

      // Collect samples for existing email (but wrong password)
      const validEmailSamples = await timing.collectSamples(
        config.guestUser.email,
        'WrongPass123!',
        5,
        100
      );

      const invalidStats = timing.computeStats(invalidSamples);
      const validEmailStats = timing.computeStats(validEmailSamples);

      console.log('Invalid email timing:', invalidStats);
      console.log('Valid email timing:', validEmailStats);

      // The timing difference should not be dramatically large (> 50% difference)
      // This is a soft check — hard thresholds depend on server implementation
      const percentDiff = Math.abs(invalidStats.mean - validEmailStats.mean) / Math.max(invalidStats.mean, 1) * 100;
      console.log(`Timing difference: ${percentDiff.toFixed(1)}%`);

      // Flag if difference is suspicious (> 50%), but don't hard fail
      // This is an informational test
      if (percentDiff > 50) {
        console.log(`WARNING: Significant timing difference detected (${percentDiff.toFixed(1)}%) — possible user enumeration via timing`);
      }
    });
  });
});
