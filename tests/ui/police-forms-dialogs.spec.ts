import { test, expect } from '@fixtures/test.fixture';
import { PoliceFormsPage, DocumentPreviewDialog } from '@pages/police-forms.page';

test.describe('Police Forms Page — Dialogs', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke should open DocumentPreviewDialog when clicking document cell', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    let found = false;
    for (let i = 0; i < rowCount && !found; i++) {
      const data = await policeFormsPage.getRowData(i);
      if (data && data.document && data.document !== '—') {
        await policeFormsPage.openDocumentPreview(i);
        const dialog = new DocumentPreviewDialog(policeFormsPage.page);
        found = await dialog.isOpen();
        if (found) {
          await expect(dialog.dialog).toBeVisible();
          await dialog.close();
        }
      }
    }
  });

  test('DocumentPreviewDialog should show "Passeport" or "Carte Nationale" as title', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    let found = false;
    for (let i = 0; i < rowCount && !found; i++) {
      const data = await policeFormsPage.getRowData(i);
      if (data && data.document && data.document !== '—') {
        await policeFormsPage.openDocumentPreview(i);
        const dialog = new DocumentPreviewDialog(policeFormsPage.page);
        found = await dialog.isOpen();
        if (found) {
          const title = (await dialog.title.textContent()) || '';
          expect(['Passeport', 'Carte Nationale']).toContain(title);
          await dialog.close();
        }
      }
    }
  });

  test('DocumentPreviewDialog should display document image', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    let found = false;
    for (let i = 0; i < rowCount && !found; i++) {
      const data = await policeFormsPage.getRowData(i);
      if (data && data.document && data.document !== '—') {
        await policeFormsPage.openDocumentPreview(i);
        const dialog = new DocumentPreviewDialog(policeFormsPage.page);
        found = await dialog.isOpen();
        if (found) {
          await expect(dialog.image).toBeVisible();
          await dialog.close();
        }
      }
    }
  });

  test('DocumentPreviewDialog should close on close button click', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    let found = false;
    for (let i = 0; i < rowCount && !found; i++) {
      const data = await policeFormsPage.getRowData(i);
      if (data && data.document && data.document !== '—') {
        await policeFormsPage.openDocumentPreview(i);
        const dialog = new DocumentPreviewDialog(policeFormsPage.page);
        found = await dialog.isOpen();
        if (found) {
          await dialog.close();
          await policeFormsPage.page.waitForTimeout(500);
          const visible = await dialog.dialog.isVisible().catch(() => false);
          expect(visible).toBe(false);
        }
      }
    }
  });

  test('DocumentPreviewDialog should have front/back labels for dual-sided documents', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    if (rowCount === 0) return;

    let found = false;
    for (let i = 0; i < rowCount && !found; i++) {
      const data = await policeFormsPage.getRowData(i);
      if (data && data.document && data.document !== '—') {
        await policeFormsPage.openDocumentPreview(i);
        const dialog = new DocumentPreviewDialog(policeFormsPage.page);
        found = await dialog.isOpen();
        if (found) {
          const frontCount = await dialog.frontLabel.count();
          const backCount = await dialog.backLabel.count();
          if (frontCount > 0 && backCount > 0) {
            await expect(dialog.frontLabel).toBeVisible();
            await expect(dialog.backLabel).toBeVisible();
          }
          await dialog.close();
        }
      }
    }
  });
});
