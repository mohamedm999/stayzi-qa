import { test, expect } from '@fixtures/test.fixture';

test.describe('Collaborators API — Auth Guard', () => {
  test('@api @smoke GET /collaborators should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/collaborators');

    expect(response.status).toBe(401);
  });
});

test.describe('Collaborators API — Authenticated Requests', () => {
  test('@api GET /collaborators should return 200 with valid token', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/collaborators', token);

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    const body = response.body as any;
    expect(body.success).toBe(true);
  });
});
