import { test, expect } from '@fixtures/test.fixture';

test.describe('Bookings Page — Detail Drawer', () => {
  test.use({ storageState: '.auth/user.json' });

  test('should open detail drawer when clicking view button', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.drawer).toBeVisible();
  });

  test('detail drawer should show client name as title', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    const name = await drawer.getClientName();
    expect(name.length).toBeGreaterThan(0);
  });

  test('detail drawer should show status badge', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.statusBadge).toBeVisible();
    const status = await drawer.getStatusLabel();
    expect(status.length).toBeGreaterThan(0);
  });

  test('detail drawer should show check-in and check-out dates', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.checkInDate).toBeVisible();
    await expect(drawer.checkOutDate).toBeVisible();
  });

  test('detail drawer should show nights count', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    const nights = await drawer.getNights();
    expect(nights).toMatch(/\d+.*nuit/);
  });

  test('detail drawer should show client contact info', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.clientEmail).toBeVisible();
    await expect(drawer.clientPhone).toBeVisible();
  });

  test('detail drawer should show payment section', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.totalAmount).toBeVisible();
  });

  test('detail drawer should show documents section', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.documentsSection).toBeVisible();
  });

  test('detail drawer should show timestamps', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.timestamps).toBeVisible();
  });

  test('detail drawer should close with close button', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    await actions.view.click();

    const drawer = bookingsPage.getDetailDrawer();
    await expect(drawer.drawer).toBeVisible();
    await drawer.close();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5000 });
  });

  test('QR code should be visible for ACTIVE/UPCOMING bookings', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    // Find an ACTIVE or UPCOMING booking
    for (let i = 0; i < rowCount; i++) {
      const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
      const text = await badge.textContent();
      if (text?.includes('En cours') || text?.includes('À venir')) {
        const actions = await bookingsPage.getRowActions(i);
        await actions.view.click();

        const drawer = bookingsPage.getDetailDrawer();
        await expect(drawer.qrCode).toBeVisible();
        return;
      }
    }
  });
});
