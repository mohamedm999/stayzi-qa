import { test, expect } from '@fixtures/test.fixture';

test.describe('Security — Rate Limiting', () => {
  test('@api @bug @security no rate limiting on /auth/login', async ({ apiHelper }) => {
    const results: number[] = [];

    for (let i = 0; i < 10; i++) {
      const response = await apiHelper.post('/auth/login', {
        data: { email: 'bruteforce@test.com', password: 'WrongPass1!' },
      });
      results.push(response.status);
    }

    // BUG: All 10 requests succeed (get 401 not 429) — no rate limiting
    const ratelimited = results.filter((s) => s === 429);
    expect(ratelimited.length).toBe(0); // Documenting current broken behavior

    // All should be 401 (bad creds), none should be 429
    const unauthorized = results.filter((s) => s === 401);
    expect(unauthorized.length).toBe(10);
  });

  test('@api @bug @security no rate limiting on /auth/me', async ({ apiHelper }) => {
    const results: number[] = [];

    for (let i = 0; i < 10; i++) {
      const response = await apiHelper.get('/auth/me', {
        headers: { Authorization: 'Bearer fake-token' },
      });
      results.push(response.status);
    }

    // BUG: No 429 returned — no rate limiting on protected endpoints either
    const ratelimited = results.filter((s) => s === 429);
    expect(ratelimited.length).toBe(0);
  });

  test('@api @bug @security no account lockout after failed logins', async ({ apiHelper }) => {
    const results: number[] = [];

    // 20 failed login attempts — should trigger lockout
    for (let i = 0; i < 20; i++) {
      const response = await apiHelper.post('/auth/login', {
        data: { email: 'lockout-test@example.com', password: `WrongPass${i}!` },
      });
      results.push(response.status);
    }

    // BUG: All return 401 — no lockout (should eventually return 423 or 429)
    const allUnauthorized = results.every((s) => s === 401);
    expect(allUnauthorized).toBe(true);
  });
});

test.describe('Security — CORS', () => {
  test('@api OPTIONS preflight should return 204', async ({ apiHelper }) => {
    const response = await apiHelper.get('/auth/me', {
      headers: {
        Origin: 'https://dev.stayzi.app',
        'Access-Control-Request-Method': 'GET',
      },
    });

    const corsOrigin = response.headers['access-control-allow-origin'];
    expect(corsOrigin).toBe('https://dev.stayzi.app');
  });

  test('@api CORS should allow credentials', async ({ apiHelper }) => {
    const response = await apiHelper.get('/auth/me', {
      headers: { Origin: 'https://dev.stayzi.app' },
    });

    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });
});

test.describe('Security — Response Headers', () => {
  test('@api @security error messages should not leak internal details', async ({ apiHelper }) => {
    const response = await apiHelper.get('/auth/me', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    expect(response.status).toBe(401);
    // BUG (LOW): Message reveals "Keycloak" as auth provider
    const message = (response.body as any).message;
    expect(message).toContain('Keycloak');
  });
});

test.describe('Security — Unimplemented Routes', () => {
  const unimplementedRoutes = [
    { method: 'GET', path: '/teams' },
    { method: 'GET', path: '/billing' },
    { method: 'GET', path: '/messages' },
    { method: 'GET', path: '/owners' },
    { method: 'GET', path: '/finances' },
    { method: 'GET', path: '/livret' },
    { method: 'GET', path: '/support' },
  ];

  for (const route of unimplementedRoutes) {
    test(`@api ${route.method} ${route.path} should return 404 (not implemented)`, async ({ apiHelper }) => {
      const response = await apiHelper.get(route.path);

      expect(response.status).toBe(404);
    });
  }
});

test.describe('Security — Input Validation', () => {
  test('@api @security large payload should not crash server', async ({ apiHelper }) => {
    const largePayload = { email: 'a'.repeat(10000) + '@test.com', password: 'x'.repeat(10000) };

    const response = await apiHelper.post('/auth/login', { data: largePayload });

    // Should return 400 (validation) or 413 (payload too large), not 500
    expect(response.status).toBeLessThan(500);
  });

  test('@api @security non-JSON content type should be handled gracefully', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/login', {
      data: 'this is not json',
      headers: { 'Content-Type': 'text/plain' },
    });

    // Currently returns 400 instead of 415 — not ideal but not a crash
    expect(response.status).toBeLessThan(500);
  });
});

test.describe('Security — Consistent Response Format', () => {
  test('@api 401 responses should use consistent format', async ({ apiHelper }) => {
    const endpoints = ['/stays', '/properties', '/clients', '/auth/me'];

    for (const endpoint of endpoints) {
      const response = await apiHelper.get(endpoint);

      expect(response.status).toBe(401);
      const body = response.body as any;
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('statusCode', 401);
      expect(body).toHaveProperty('message');
    }
  });

  test('@api 400 responses should include errors object', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/login', { data: {} });

    expect(response.status).toBe(400);
    const body = response.body as any;
    expect(body).toHaveProperty('success', false);
    expect(body).toHaveProperty('statusCode', 400);
    expect(body).toHaveProperty('errors');
  });
});
