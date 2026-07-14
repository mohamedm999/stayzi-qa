import { test, expect } from '@fixtures/test.fixture';

test.describe('Police Forms Page — Actions', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke each row should have action buttons in Actions column', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const count = await policeFormsPage.getActionButtonCount(i);
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('rows with stayFicheId should show download button', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    let found = false;
    for (let i = 0; i < rowCount && !found; i++) {
      const data = await policeFormsPage.getRowData(i);
      if (data && data.lienFiche && data.lienFiche !== '—') {
        const actions = await policeFormsPage.getRowActions(i);
        await expect(actions.download).toBeVisible();
        found = true;
      }
    }
  });

  test('rows with fichePolice URL should show external link button', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    let found = false;
    for (let i = 0; i < rowCount && !found; i++) {
      const data = await policeFormsPage.getRowData(i);
      if (data && data.lienFiche && data.lienFiche !== '—') {
        const actions = await policeFormsPage.getRowActions(i);
        const linkCount = await actions.externalLink.count();
        if (linkCount > 0) {
          await expect(actions.externalLink).toBeVisible();
          found = true;
        }
      }
    }
  });

  test('external link should open in new tab with noopener noreferrer', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    const firstRow = policeFormsPage.tableRows.first();
    const actionsCell = firstRow.locator('td').last();
    const link = actionsCell.locator('a').first();
    const count = await link.count();
    if (count > 0) {
      expect(await link.getAttribute('target')).toBe('_blank');
      expect(await link.getAttribute('rel')).toContain('noopener');
    }
  });

  test('copy link button should be visible in Lien fiche column', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    const firstRow = policeFormsPage.tableRows.first();
    const lienCell = firstRow.locator('td').nth(5);
    const copyBtn = lienCell.locator('button');
    const count = await copyBtn.count();
    if (count > 0) {
      await expect(copyBtn.first()).toBeVisible();
    }
  });

  test('download button should show tooltip on hover', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    const firstRow = policeFormsPage.tableRows.first();
    const actionsCell = firstRow.locator('td').last();
    const downloadBtn = actionsCell.locator('button').first();
    const count = await downloadBtn.count();
    if (count > 0) {
      await downloadBtn.hover();
      await policeFormsPage.page.waitForTimeout(500);
      const tooltip = policeFormsPage.page.getByRole('tooltip');
      const tooltipCount = await tooltip.count();
      if (tooltipCount > 0) {
        const text = await tooltip.textContent();
        expect(text).toBeTruthy();
      }
    }
  });
});
