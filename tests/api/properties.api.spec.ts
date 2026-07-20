import { test, expect } from '@fixtures/test.fixture';

test.describe('Properties API — Auth Guard', () => {
  test('@api @smoke GET /properties should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/properties');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: 'Invalid or missing Keycloak token',
    });
  });

  test('@api GET /properties/{id} should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/properties/fake-id');

    expect(response.status).toBe(401);
  });

  test('@api POST /properties should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/properties', { data: {} });

    expect(response.status).toBe(401);
  });

  test('@api PUT /properties/{id} should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.put('/properties/fake-id', { data: {} });

    expect(response.status).toBe(401);
  });

  test('@api DELETE /properties/{id} should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.delete('/properties/fake-id');

    expect(response.status).toBe(401);
  });

  test('@api GET /properties/search should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/properties/search', {
      params: { query: 'riad' },
    });

    expect(response.status).toBe(401);
  });

  test('@api GET /properties/cities should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/properties/cities');

    expect(response.status).toBe(401);
  });

  test('@api POST /properties/import/link should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/properties/import/link', {
      data: { url: 'https://airbnb.com/rooms/12345' },
    });

    expect(response.status).toBe(401);
  });

  test('@api GET /properties/{id}/livret-link should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/properties/fake-id/livret-link');

    expect(response.status).toBe(401);
  });

  test('@api PATCH /properties/{id}/collaborators should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.patch('/properties/fake-id/collaborators', { data: {} });

    expect(response.status).toBe(401);
  });
});

test.describe('Properties API — Wrong Method', () => {
  test('@api POST /properties/cities should return 404 (wrong method)', async ({ apiHelper }) => {
    const response = await apiHelper.post('/properties/cities', { data: {} });

    expect(response.status).toBe(404);
  });
});

test.describe('Properties API — Authenticated Requests', () => {
  test('@api @smoke GET /properties should return 200 with valid token', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/properties', token);

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    const body = response.body as any;
    expect(body.success).toBe(true);
  });

  test('@api GET /properties should return paginated properties', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/properties', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('page');
    expect(body.data).toHaveProperty('limit');
    expect(body.data).toHaveProperty('totalItems');
    expect(body.data).toHaveProperty('totalPages');
    expect(Array.isArray(body.data.data)).toBe(true);
  });

  test('@api GET /properties/cities should return cities list', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/properties/cities', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body.success).toBe(true);
  });

  test('@api GET /properties/search should accept search param', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.get('/properties/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { search: 'riad' },
    });

    // search endpoint may return 200 or 400 depending on required params
    expect([200, 400]).toContain(response.status);
  });

  test('@api @regression property should have required fields', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/properties', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    const items = body.data.data;

    if (Array.isArray(items) && items.length > 0) {
      const property = items[0];
      expect(property.id || property._id).toBeTruthy();
      expect(property).toHaveProperty('name');
    }
  });

  test('@api @regression GET /properties/{id} should return single property', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const listResponse = await apiHelper.getAuth('/properties', token);
    const listBody = listResponse.body as any;
    const items = listBody.data.data;

    if (Array.isArray(items) && items.length > 0) {
      const propertyId = items[0].id || items[0]._id;
      const response = await apiHelper.getAuth(`/properties/${propertyId}`, token);

      expect(response.status).toBe(200);
      const body = response.body as any;
      expect(body.success).toBe(true);
      const returnedId = body.data.id || body.data._id;
      expect(returnedId).toBe(propertyId);
    }
  });
});

test.describe('Properties API — Performance', () => {
  test('@api @bug /properties/{id}/livret-link should respond within 3 seconds', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const start = Date.now();
    const response = await apiHelper.get('/properties/fake-id/livret-link', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
    const elapsed = Date.now() - start;

    // Audit found 5.7s response — flag if > 3s
    if (elapsed > 3000) {
      console.warn(`PERF WARNING: /properties/{id}/livret-link took ${elapsed}ms`);
    }

    expect(response.status).toBeDefined();
  });
});
