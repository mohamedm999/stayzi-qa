import { test, expect } from '@fixtures/test.fixture';

test.describe('Clients API — Auth Guard', () => {
  test('@api @smoke GET /clients should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/clients');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: 'Invalid or missing Keycloak token',
    });
  });

  test('@api GET /clients/{id} should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/clients/fake-id');

    expect(response.status).toBe(401);
  });

  test('@api POST /clients should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/clients', { data: {} });

    expect(response.status).toBe(401);
  });
});

test.describe('Clients API — Unimplemented Endpoints', () => {
  test('@api @bug PUT /clients/{id} should return 404 (not implemented)', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.putAuth('/clients/fake-id', token, {
      firstName: 'Updated',
    });

    // BUG: Update endpoint not implemented
    expect(response.status).toBe(404);
  });

  test('@api @bug DELETE /clients/{id} should return 404 (not implemented)', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.deleteAuth('/clients/fake-id', token);

    // BUG: Delete endpoint not implemented
    expect(response.status).toBe(404);
  });
});

test.describe('Clients API — Authenticated Requests', () => {
  test('@api @smoke GET /clients should return 200 with valid token', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/clients', token);

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    const body = response.body as any;
    expect(body.success).toBe(true);
  });

  test('@api GET /clients should return paginated clients', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/clients', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('page');
    expect(body.data).toHaveProperty('limit');
    expect(body.data).toHaveProperty('totalItems');
    expect(Array.isArray(body.data.data)).toBe(true);
  });

  test('@api @regression GET /clients/{id} should return single client', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const listResponse = await apiHelper.getAuth('/clients', token);
    const listBody = listResponse.body as any;
    const items = listBody.data.data;

    if (Array.isArray(items) && items.length > 0) {
      const clientId = items[0].id || items[0]._id;
      const response = await apiHelper.getAuth(`/clients/${clientId}`, token);

      expect(response.status).toBe(200);
      const body = response.body as any;
      expect(body.success).toBe(true);
      const returnedId = body.data.id || body.data._id;
      expect(returnedId).toBe(clientId);
    }
  });

  test('@api @regression client should have required fields', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/clients', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    const items = body.data.data;

    if (Array.isArray(items) && items.length > 0) {
      const client = items[0];
      expect(client.id || client._id).toBeTruthy();
    }
  });
});
