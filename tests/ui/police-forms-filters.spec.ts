import { test, expect } from '@fixtures/test.fixture';

test.describe('Police Forms Page — Filters & Search', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke should display search input with correct placeholder', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.searchInput).toBeVisible();
    await expect(policeFormsPage.searchInput).toHaveAttribute(
      'placeholder',
      'Rechercher un invité, téléphone, ID…',
    );
  });

  test('should display filters button', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.filtersBtn).toBeVisible();
    await expect(policeFormsPage.filtersBtn).toContainText('Filtres');
  });

  test('should open filters popover on click', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await policeFormsPage.openFilters();
    await expect(policeFormsPage.filterPopover).toBeVisible();
    await expect(policeFormsPage.stayStatusSelect).toBeVisible();
    await expect(policeFormsPage.ficheStatusSelect).toBeVisible();
  });

  test('filters popover should contain stay status dropdown', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await policeFormsPage.openFilters();
    await expect(policeFormsPage.stayStatusSelect).toBeVisible();
    const text = await policeFormsPage.stayStatusSelect.textContent();
    expect(text).toBeTruthy();
  });

  test('filters popover should contain fiche status dropdown', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await policeFormsPage.openFilters();
    await expect(policeFormsPage.ficheStatusSelect).toBeVisible();
    const text = await policeFormsPage.ficheStatusSelect.textContent();
    expect(text).toBeTruthy();
  });

  test('should filter by stay status "ACTIVE" and show only active stays', async ({
    policeFormsPage,
  }) => {
    await policeFormsPage.goto();
    const totalBefore = await policeFormsPage.getRowCount();

    await policeFormsPage.openFilters();
    await policeFormsPage.selectStayStatusFilter('En cours');

    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const data = await policeFormsPage.getRowData(i);
        if (data) {
          expect(data.stayStatus).toBe('En cours');
        }
      }
    }
  });

  test('should filter by fiche status "COMPLETED" and show only submitted fiches', async ({
    policeFormsPage,
  }) => {
    await policeFormsPage.goto();

    await policeFormsPage.openFilters();
    await policeFormsPage.selectFicheStatusFilter('Soumises');

    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        const data = await policeFormsPage.getRowData(i);
        if (data) {
          expect(data.ficheStatus).toBe('Soumise');
        }
      }
    }
  });

  test('should show active filters bar when filter is applied', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();

    await policeFormsPage.openFilters();
    await policeFormsPage.selectStayStatusFilter('En cours');
    await policeFormsPage.activeFiltersText.waitFor({ state: 'visible', timeout: 5000 });

    await expect(policeFormsPage.activeFiltersText).toBeVisible();
    const text = (await policeFormsPage.activeFiltersText.textContent()) || '';
    expect(text).toMatch(/\d+ résultat(s?) sur \d+/);
  });

  test('should reset filters when clicking "Réinitialiser" inline button', async ({
    policeFormsPage,
  }) => {
    await policeFormsPage.goto();

    await policeFormsPage.openFilters();
    await policeFormsPage.selectStayStatusFilter('En cours');
    await policeFormsPage.activeFiltersText.waitFor({ state: 'visible', timeout: 5000 });

    await expect(policeFormsPage.activeFiltersText).toBeVisible();

    await policeFormsPage.resetInlineBtn.click();
    await expect(policeFormsPage.activeFiltersText).not.toBeVisible();
  });

  test('should search by guest name and filter results', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const totalBefore = await policeFormsPage.getRowCount();

    if (totalBefore === 0) {
      test.skip();
      return;
    }

    const firstRowData = await policeFormsPage.getRowData(0);
    const guestName = firstRowData?.client?.split(' ')[0];

    if (!guestName) {
      test.skip();
      return;
    }

    await policeFormsPage.searchGuest(guestName);
    await policeFormsPage.page.waitForTimeout(500);

    const rowCount = await policeFormsPage.getRowCount();
    expect(rowCount).toBeGreaterThanOrEqual(1);
    expect(rowCount).toBeLessThanOrEqual(totalBefore);
  });

  test('should combine search + status filter', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const totalBefore = await policeFormsPage.getRowCount();

    if (totalBefore === 0) {
      test.skip();
      return;
    }

    const firstRowData = await policeFormsPage.getRowData(0);
    const guestName = firstRowData?.client?.split(' ')[0];

    if (!guestName) {
      test.skip();
      return;
    }

    await policeFormsPage.searchGuest(guestName);
    await policeFormsPage.page.waitForTimeout(500);

    const afterSearch = await policeFormsPage.getRowCount();

    await policeFormsPage.openFilters();
    await policeFormsPage.selectStayStatusFilter('En cours');
    await policeFormsPage.activeFiltersText.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    const afterFilter = await policeFormsPage.getRowCount();
    expect(afterFilter).toBeLessThanOrEqual(afterSearch);
  });

  test('should show empty filtered state when no matches', async ({
    policeFormsPage,
  }) => {
    await policeFormsPage.goto();

    await policeFormsPage.openFilters();
    await policeFormsPage.selectStayStatusFilter('Annulé');
    await policeFormsPage.selectFicheStatusFilter('Rejetées');

    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) {
      await expect(policeFormsPage.emptyFiltered).toBeVisible();
      await expect(policeFormsPage.clearFiltersBtn).toBeVisible();
    }
  });
});
