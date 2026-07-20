import { test, expect } from '@fixtures/test.fixture';

test.describe('Fiche Police API — Download', () => {
  test('@api should return 400 when stayFicheId is missing', async ({ apiHelper }) => {
    const response = await apiHelper.get('/fiche-police/download-all');

    expect(response.status).toBe(400);
    expect((response.body as any).message).toBe('stayFicheId query parameter is required');
  });

  test('@api should return 400 for nonexistent stayFicheId', async ({ apiHelper }) => {
    const response = await apiHelper.get('/fiche-police/download-all', {
      params: { stayFicheId: 'nonexistent-id-12345' },
    });

    expect(response.status).toBe(400);
    expect((response.body as any).message).toContain('No Fiche de Police batch found');
  });

  test('@api @bug @security fiche-police download should require authentication', async ({ apiHelper }) => {
    // BUG: This endpoint has NO auth — anyone with a valid stayFicheId can download police forms
    const response = await apiHelper.get('/fiche-police/download-all', {
      params: { stayFicheId: 'test-id' },
    });

    // Currently returns 400 (validation error) not 401 — no auth check
    // If auth were enforced, we'd expect 401 before the validation error
    expect(response.status).toBe(400);
  });

  test('@api fiche-police download with auth should behave the same as without', async ({ apiHelper, authHelper }) => {
    await authHelper.loginAsGuest();
    const token = authHelper.getToken();

    const withoutAuth = await apiHelper.get('/fiche-police/download-all', {
      params: { stayFicheId: 'nonexistent-id' },
    });

    const withAuth = await apiHelper.get('/fiche-police/download-all', {
      headers: { Authorization: `Bearer ${token}` },
      params: { stayFicheId: 'nonexistent-id' },
    });

    // Both should return the same status — proving no auth is enforced
    expect(withoutAuth.status).toBe(withAuth.status);
  });
});
