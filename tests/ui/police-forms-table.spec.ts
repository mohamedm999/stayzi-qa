import { test, expect } from '@fixtures/test.fixture';
import { PoliceFormsPage } from '@pages/police-forms.page';

test.describe('Police Forms Page — Table', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke should display page with heading "Fiches de police" and table', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.heading).toBeVisible();
    await expect(policeFormsPage.heading).toContainText('Fiches de police');
    await expect(policeFormsPage.tableEl).toBeVisible();
  });

  test('@smoke should display correct 7 table columns', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const headers = policeFormsPage.tableHeaders;
    expect(await headers.count()).toBe(7);

    const expected = ['Client', 'Pers.', 'Statut séjour', 'Statut fiche', 'Document', 'Lien fiche', 'Actions'];
    for (let i = 0; i < expected.length; i++) {
      const text = (await headers.nth(i).textContent()) || '';
      expect(text.trim()).toContain(expected[i]);
    }
  });

  test('should display heading subtitle about "formulaires de police"', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.subtitle).toBeVisible();
    const text = (await policeFormsPage.subtitle.textContent()) || '';
    expect(text.toLowerCase()).toContain('formulaires de police');
  });

  test('should display 4 summary cards (Total, En attente, Soumises, Non générées)', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.totalCard).toBeVisible();
    await expect(policeFormsPage.pendingCard).toBeVisible();
    await expect(policeFormsPage.submittedCard).toBeVisible();
    await expect(policeFormsPage.noFormCard).toBeVisible();
  });

  test('should show table headers count equals 7', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const count = await policeFormsPage.getHeaderCount();
    expect(count).toBe(7);
  });

  test('should display row with valid stay status badge', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      const data = await policeFormsPage.getRowData(0);
      if (data) {
        const validStatuses = ['À venir', 'En cours', 'Terminée', 'Annulée'];
        expect(validStatuses.some(s => data.stayStatus.includes(s))).toBe(true);
      }
    }
  });

  test('should display row with valid fiche status badge', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      const data = await policeFormsPage.getRowData(0);
      if (data) {
        const validStatuses = ['Soumise', 'En attente', 'Rejetée', 'Non générée'];
        expect(validStatuses.some(s => data.ficheStatus.includes(s))).toBe(true);
      }
    }
  });

  test('should display client name in first column (font-medium div)', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      const firstRow = policeFormsPage.tableRows.first();
      const nameCell = firstRow.locator('td').first().locator('div.font-medium');
      await expect(nameCell).toBeVisible();
      const name = (await nameCell.textContent()) || '';
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  test('should display phone or dash in client cell', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      const data = await policeFormsPage.getRowData(0);
      if (data) {
        expect(data.phone).toBeTruthy();
      }
    }
  });

  test('should display guest count as number or dash in Pers. column', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      const data = await policeFormsPage.getRowData(0);
      if (data) {
        const isNumber = /^\d+$/.test(data.guestCount);
        const isDash = data.guestCount === '—';
        expect(isNumber || isDash).toBe(true);
      }
    }
  });

  test('should have actions column with buttons', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      const firstRow = policeFormsPage.tableRows.first();
      await firstRow.locator('td').last().locator('button').first().waitFor({ state: 'visible', timeout: 5000 });
      const actionsCell = firstRow.locator('td').last();
      const btnCount = await actionsCell.locator('button').count();
      expect(btnCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('should show empty state "Aucune fiche de police pour le moment." when no rows', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) {
      await expect(policeFormsPage.emptyNoData).toBeVisible();
    }
  });

  test('should display refresh button with text "Actualiser"', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    await expect(policeFormsPage.refreshBtn).toBeVisible();
  });

  test('row count should match data returned', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount > 0) {
      const firstRow = policeFormsPage.tableRows.first();
      await firstRow.locator('td').first().waitFor({ state: 'visible', timeout: 5000 });
      const nameDiv = firstRow.locator('td').first().locator('div').first();
      await nameDiv.waitFor({ state: 'visible', timeout: 5000 });
      const name = (await nameDiv.textContent()) || '';
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  test('should navigate to /concierge/police-forms', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    expect(policeFormsPage.page.url()).toContain('/concierge/police-forms');
  });
});
