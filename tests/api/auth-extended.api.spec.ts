import { test, expect } from '@fixtures/test.fixture';

test.describe('Auth API — Register Validation', () => {
  test('@api should return 400 for empty registration body', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/register', { data: {} });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, statusCode: 400 });
  });

  test('@api should validate email format on register', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/register', {
      data: {
        email: 'not-an-email',
        password: 'StrongPass1!',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors.email');
  });

  test('@api should enforce strong password policy', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/register', {
      data: {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors.password');
  });

  test('@api should require firstName and lastName', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/register', {
      data: {
        email: 'test@example.com',
        password: 'StrongPass1!',
      },
    });

    expect(response.status).toBe(400);
    const errors = (response.body as any).errors;
    expect(errors.firstName || errors.lastName).toBeDefined();
  });
});

test.describe('Auth API — OTP Endpoints', () => {
  test('@api should return 400 for verify-otp with empty body', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/verify-otp', { data: {} });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false });
  });

  test('@api should validate email and code on verify-otp', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/verify-otp', {
      data: { email: 'not-email', code: '' },
    });

    expect(response.status).toBe(400);
  });

  test('@api should return 401 for verify-otp with invalid code', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/verify-otp', {
      data: { email: 'test@example.com', code: '000000' },
    });

    expect([400, 401]).toContain(response.status);
  });

  test('@api should return 400 for resend-otp with empty body', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/resend-otp', { data: {} });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false });
  });

  test('@api should validate email on resend-otp', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/resend-otp', {
      data: { email: 'not-an-email' },
    });

    expect(response.status).toBe(400);
  });
});

test.describe('Auth API — Refresh Token', () => {
  test('@api should return 401 for refresh without token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/refresh', { data: {} });

    expect(response.status).toBe(401);
  });

  test('@api should return 401 for refresh with invalid token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/refresh', {
      data: { refreshToken: 'invalid-refresh-token' },
    });

    expect(response.status).toBe(401);
  });
});

test.describe('Auth API — Logout Bug', () => {
  test('@api @bug logout should require authentication but currently returns 200 without token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/logout', { data: {} });

    // BUG: This returns 200 when it should return 401
    // Documenting current (broken) behavior — expect 200 until fixed
    expect(response.status).toBe(200);
    expect((response.body as any).success).toBe(true);
  });
});

test.describe('Auth API — Unimplemented Endpoints', () => {
  test('@api PUT /auth/me should return 404 (not implemented)', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.putAuth('/auth/me', token, { firstName: 'Updated' });

    expect(response.status).toBe(404);
  });

  test('@api DELETE /auth/me should return 404 (not implemented)', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.deleteAuth('/auth/me', token);

    expect(response.status).toBe(404);
  });
});

test.describe('Auth API — Profile with Valid Token', () => {
  test('@api @smoke should return user profile with valid token', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/auth/me', token);

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
  });

  test('@api should return consistent response format', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/auth/me', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('statusCode');
  });
});
