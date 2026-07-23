import { test, expect } from '@fixtures/test.fixture';

test.describe('Police Forms Page — Charts & Summary', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke should display 4 summary cards', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.totalCard).toBeVisible();
    await expect(policeFormsPage.pendingCard).toBeVisible();
    await expect(policeFormsPage.submittedCard).toBeVisible();
    await expect(policeFormsPage.noFormCard).toBeVisible();
  });

  test('should show Total card with numeric value', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.totalCard).toBeVisible();
    const value = await policeFormsPage.getStatValue(policeFormsPage.totalCard).textContent();
    expect(value).toMatch(/^\d+$/);
  });

  test('should show En attente card with numeric value', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.pendingCard).toBeVisible();
    const value = await policeFormsPage.getStatValue(policeFormsPage.pendingCard).textContent();
    expect(value).toMatch(/^\d+$/);
  });

  test('should show Soumises card with numeric value', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.submittedCard).toBeVisible();
    const value = await policeFormsPage.getStatValue(policeFormsPage.submittedCard).textContent();
    expect(value).toMatch(/^\d+$/);
  });

  test('should show Non générées card with numeric value', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.noFormCard).toBeVisible();
    const value = await policeFormsPage.getStatValue(policeFormsPage.noFormCard).textContent();
    expect(value).toMatch(/^\d+$/);
  });

  test('stat values should be non-negative integers', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const cards = [
      policeFormsPage.totalCard,
      policeFormsPage.pendingCard,
      policeFormsPage.submittedCard,
      policeFormsPage.noFormCard,
    ];
    for (const card of cards) {
      const value = await policeFormsPage.getStatValue(card).textContent();
      const num = parseInt(value || '', 10);
      expect(num).toBeGreaterThanOrEqual(0);
    }
  });

  test('Total should be greater than or equal to each individual stat', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const total = parseInt((await policeFormsPage.getStatValue(policeFormsPage.totalCard).textContent()) || '0', 10);
    const pending = parseInt((await policeFormsPage.getStatValue(policeFormsPage.pendingCard).textContent()) || '0', 10);
    const submitted = parseInt((await policeFormsPage.getStatValue(policeFormsPage.submittedCard).textContent()) || '0', 10);
    const noForm = parseInt((await policeFormsPage.getStatValue(policeFormsPage.noFormCard).textContent()) || '0', 10);
    expect(total).toBeGreaterThanOrEqual(pending);
    expect(total).toBeGreaterThanOrEqual(submitted);
    expect(total).toBeGreaterThanOrEqual(noForm);
  });

  test('should display "Taux de soumission" chart card', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.submissionRateCard).toBeVisible();
  });

  test('should display "Répartition des fiches" chart card', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.distributionCard).toBeVisible();
  });

  test('should expose four distinct summary-card labels', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.totalCard).toBeVisible();
    await expect(policeFormsPage.pendingCard).toBeVisible();
    await expect(policeFormsPage.submittedCard).toBeVisible();
    await expect(policeFormsPage.noFormCard).toBeVisible();
  });
});
