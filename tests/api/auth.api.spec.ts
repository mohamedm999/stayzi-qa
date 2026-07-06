import { test, expect } from '@fixtures/test.fixture';
import { config } from '@utils/config';

test.describe('Auth API — Login', () => {
  test('@smoke @api should return 400 with validation errors for empty body', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/login', {
      data: {},
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 400,
    });
  });

  test('@smoke @api should return 400 when email is missing', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/login', {
      data: { password: 'SomePass1!' },
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors.email');
  });

  test('@smoke @api should return 400 when password is missing', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/login', {
      data: { email: 'user@example.com' },
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors.password');
  });

  test('@smoke @api should return 400 for invalid email format', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/login', {
      data: { email: 'not-an-email', password: 'SomePass1!' },
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors.email');
  });

  test('@regression @api should return 401 for invalid credentials', async ({ apiHelper }) => {
    const response = await apiHelper.post('/auth/login', {
      data: { email: 'nonexistent@test.com', password: 'WrongPass1!' },
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Email ou mot de passe incorrect');
  });

  test('@regression @api should return 200 with token for valid credentials', async ({ authHelper }) => {
    const response = await authHelper.loginAsGuest();

    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.data?.accessToken).toBeDefined();
    expect(response.data?.user).toBeDefined();
    expect(response.data?.user?.email).toBe(config.guestUser.email);
    expect(authHelper.isAuthenticated()).toBe(true);
  });

  test('@regression @api should return user profile with valid token', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/auth/me', token);

    expect(response.status).toBe(200);
  });

  test('@regression @api should return 401 for /auth/me without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/auth/me', {
      headers: { Authorization: 'Bearer invalid-token' },
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid or missing Keycloak token');
  });

  test('@regression @api should return user roles from token', async ({ authHelper }) => {
    const response = await authHelper.loginAsGuest();

    const roles = response.data?.user?.roles || [];
    expect(roles.length).toBeGreaterThan(0);
    expect(roles).toContain('ADMIN_CONCIERGERIE');
  });
});
