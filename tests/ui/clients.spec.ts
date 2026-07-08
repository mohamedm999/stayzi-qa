import { test, expect } from '@fixtures/test.fixture';
import { faker } from '@faker-js/faker/locale/en';

test.describe('Clients Page', () => {
  test.use({ storageState: '.auth/user.json' });

  const timestamp = Date.now();
  const testClient = {
    firstName: 'Test',
    lastName: `User${timestamp}`,
    email: `client${timestamp}@testmail.com`,
    phone: '+212600000000',
    nationality: 'Maroc',
    preferredLanguage: 'fr' as const,
    notes: `Created by automated test ${timestamp}`,
  };

  test('@smoke should display page structure with heading, subtitle, and button', async ({ clientsPage }) => {
    await clientsPage.goto();
    await expect(clientsPage.heading).toBeVisible();
    await expect(clientsPage.subtitle).toBeVisible();
    await expect(clientsPage.nouveauClientBtn).toBeVisible();
  });

  test('@smoke should display table with correct columns', async ({ clientsPage }) => {
    await clientsPage.goto();
    await expect(clientsPage.table).toBeVisible();

    const headers = await clientsPage.getHeaderTexts();
    expect(headers.length).toBeGreaterThanOrEqual(6);
  });

  test('@smoke should create a new client and display in table', async ({ clientsPage }) => {
    await clientsPage.goto();
    await clientsPage.clickNouveauClient();

    const drawer = await clientsPage.getCreateDrawer();
    await expect(drawer.dialog).toBeVisible();

    await drawer.fill(testClient);
    await drawer.submit();

    await expect(drawer.dialog).not.toBeVisible({ timeout: 10000 });
    await clientsPage.wait.forLoadingComplete();

    const rowCount = await clientsPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('@regression should show validation errors on empty form', async ({ clientsPage }) => {
    await clientsPage.goto();
    await clientsPage.clickNouveauClient();

    const drawer = await clientsPage.getCreateDrawer();
    await expect(drawer.dialog).toBeVisible();

    await drawer.submit();
    await expect(drawer.firstNameInput).toBeVisible();

    const firstNameError = await drawer.getFieldError('firstName');
    expect(firstNameError).toContain('requis');

    const lastNameError = await drawer.getFieldError('lastName');
    expect(lastNameError).toContain('requis');
  });

  test('@regression should display client details in view drawer', async ({ clientsPage }) => {
    await clientsPage.goto();
    const count = await clientsPage.getRowCount();
    expect(count).toBeGreaterThan(0);

    const actions = await clientsPage.getActionButtons(0);
    await actions.view.click();

    const drawer = await clientsPage.getViewDrawer();
    await expect(drawer.container).toBeVisible();
    await expect(drawer.coordonneesSection).toBeVisible();
  });

  test('@regression should delete a client via delete dialog', async ({ clientsPage }) => {
    await clientsPage.goto();
    const count = await clientsPage.getRowCount();
    expect(count).toBeGreaterThan(0);

    const rowData = await clientsPage.getRowData(0);
    expect(rowData).not.toBeNull();

    const actions = await clientsPage.getActionButtons(0);
    await actions.delete.click();

    const deleteDialog = await clientsPage.getDeleteDialog();
    await expect(deleteDialog.dialog).toBeVisible();

    await deleteDialog.confirm();
    await expect(deleteDialog.dialog).not.toBeVisible({ timeout: 10000 });
  });
});
