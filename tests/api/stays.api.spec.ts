import { test, expect } from '@fixtures/test.fixture';

test.describe('Stays API — Auth Guard', () => {
  test('@api @smoke GET /stays should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/stays');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      statusCode: 401,
      message: 'Invalid or missing Keycloak token',
    });
  });

  test('@api GET /stays/paginated should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/stays/paginated', {
      params: { page: '1', limit: '10' },
    });

    expect(response.status).toBe(401);
  });

  test('@api POST /stays should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/stays', { data: {} });

    expect(response.status).toBe(401);
  });

  test('@api GET /stays/fiche-statuses should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.get('/stays/fiche-statuses', {
      params: { ids: 'fake-id-1,fake-id-2' },
    });

    expect(response.status).toBe(401);
  });

  test('@api PATCH /stays/{id}/activate should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.patch('/stays/fake-id/activate');

    expect(response.status).toBe(401);
  });

  test('@api PATCH /stays/{id}/complete should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.patch('/stays/fake-id/complete');

    expect(response.status).toBe(401);
  });

  test('@api PATCH /stays/{id}/cancel should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.patch('/stays/fake-id/cancel');

    expect(response.status).toBe(401);
  });

  test('@api PATCH /stays/{id}/complete-guest-info should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.patch('/stays/fake-id/complete-guest-info', { data: {} });

    expect(response.status).toBe(401);
  });

  test('@api POST /stays/sync/ical should return 401 without token', async ({ apiHelper }) => {
    const response = await apiHelper.post('/stays/sync/ical', { data: {} });

    expect(response.status).toBe(401);
  });
});

test.describe('Stays API — Wrong Method', () => {
  test('@api GET /stays/{id}/activate should return 404 (wrong method)', async ({ apiHelper }) => {
    const response = await apiHelper.get('/stays/fake-id/activate');

    expect(response.status).toBe(404);
  });
});

test.describe('Stays API — Authenticated Requests', () => {
  test('@api @smoke GET /stays should return 200 with valid token', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/stays', token);

    expect(response.status).toBe(200);
    expect(response.ok).toBe(true);
    const body = response.body as any;
    expect(body.success).toBe(true);
  });

  test('@api GET /stays should return array of bookings', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/stays', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('@api GET /stays/paginated should support pagination params', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.get('/stays/paginated', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page: '1', limit: '5' },
    });

    expect([200, 400]).toContain(response.status);
    if (response.status === 200) {
      const body = response.body as any;
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('page');
      expect(body.data).toHaveProperty('limit');
      expect(body.data).toHaveProperty('totalItems');
      expect(body.data).toHaveProperty('totalPages');
      expect(Array.isArray(body.data.data)).toBe(true);
      expect(body.data.data.length).toBeLessThanOrEqual(5);
    }
  });

  test('@api GET /stays/fiche-statuses should accept ids param', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.get('/stays/fiche-statuses', {
      headers: { Authorization: `Bearer ${token}` },
      params: { ids: 'nonexistent-id' },
    });

    expect(response.status).toBe(200);
    const body = response.body as any;
    expect(body.success).toBe(true);
    expect(typeof body.data).toBe('object');
  });

  test('@api POST /stays/sync/ical should require sync data', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.postAuth('/stays/sync/ical', token, {});

    // May return 400 (validation) or 200 depending on required fields
    expect([200, 201, 400]).toContain(response.status);
  });
});

test.describe('Stays API — Booking Lifecycle', () => {
  test('@api @regression booking status values should be valid enum', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/stays', token);

    expect(response.status).toBe(200);
    const body = response.body as any;
    const validStatuses = ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'INCOMPLETE'];

    if (Array.isArray(body.data) && body.data.length > 0) {
      for (const stay of body.data) {
        expect(validStatuses).toContain(stay.status);
      }
    }
  });

  test('@api @regression booking should have required fields', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const response = await apiHelper.getAuth('/stays', token);

    expect(response.status).toBe(200);
    const body = response.body as any;

    if (Array.isArray(body.data) && body.data.length > 0) {
      const stay = body.data[0];
      expect(stay.id || stay._id).toBeTruthy();
      expect(stay).toHaveProperty('status');
      expect(stay).toHaveProperty('dateRange');
      expect(stay).toHaveProperty('propertyId');
      expect(stay).toHaveProperty('clientId');
      expect(stay).toHaveProperty('payment');
      expect(stay).toHaveProperty('guestCount');
      expect(stay).toHaveProperty('createdAt');
    }
  });
});
