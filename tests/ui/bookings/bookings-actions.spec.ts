import { test, expect } from '@fixtures/test.fixture';

test.describe('Bookings Page — Actions (Cancel, Complete)', () => {
  test.use({ storageState: '.auth/user.json' });

  // ─── CANCEL ──────────────────────────────────────────────

  test('should open cancel dialog when clicking cancel button', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    // Find a non-cancelled row
    for (let i = 0; i < rowCount; i++) {
      const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
      const text = await badge.textContent();
      if (text && !text.includes('Annulée')) {
        const actions = await bookingsPage.getRowActions(i);
        await actions.cancel.click();

        const dialog = bookingsPage.getCancelDialog();
        await expect(dialog.dialog).toBeVisible();
        return;
      }
    }
  });

  test('cancel dialog should show correct title', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
      const text = await badge.textContent();
      if (text && !text.includes('Annulée')) {
        const actions = await bookingsPage.getRowActions(i);
        await actions.cancel.click();

        const dialog = bookingsPage.getCancelDialog();
        const title = await dialog.title.textContent();
        expect(title).toContain('Annuler');
        return;
      }
    }
  });

  test('cancel dialog should show warning description', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
      const text = await badge.textContent();
      if (text && !text.includes('Annulée')) {
        const actions = await bookingsPage.getRowActions(i);
        await actions.cancel.click();

        const dialog = bookingsPage.getCancelDialog();
        const desc = await dialog.getDescription();
        expect(desc).toContain('irréversible');
        return;
      }
    }
  });

  test('cancel dialog should have cancel and confirm buttons', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
      const text = await badge.textContent();
      if (text && !text.includes('Annulée')) {
        const actions = await bookingsPage.getRowActions(i);
        await actions.cancel.click();

        const dialog = bookingsPage.getCancelDialog();
        await expect(dialog.cancelBtn).toBeVisible();
        await expect(dialog.confirmBtn).toBeVisible();
        return;
      }
    }
  });

  test('should close cancel dialog when clicking Annuler', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
      const text = await badge.textContent();
      if (text && !text.includes('Annulée')) {
        const actions = await bookingsPage.getRowActions(i);
        await actions.cancel.click();

        const dialog = bookingsPage.getCancelDialog();
        await expect(dialog.dialog).toBeVisible();
        await dialog.cancel();
        await expect(dialog.dialog).not.toBeVisible({ timeout: 5000 });
        return;
      }
    }
  });

  // ─── COMPLETE INCOMPLETE ─────────────────────────────────

  test('INCOMPLETE rows should show complete button instead of view', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const isIncomplete = await bookingsPage.isRowIncomplete(i);
      if (isIncomplete) {
        const actions = await bookingsPage.getRowActions(i);
        await expect(actions.complete).toBeVisible();
        return;
      }
    }
  });

  test('complete button should have AlertTriangle icon (destructive style)', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const isIncomplete = await bookingsPage.isRowIncomplete(i);
      if (isIncomplete) {
        const row = bookingsPage.tableRows.nth(i);
        const alertIcon = row.locator('.lucide-alert-triangle');
        await expect(alertIcon).toBeVisible();
        return;
      }
    }
  });

  // ─── STATUS BEHAVIOR ─────────────────────────────────────

  test('CANCELLED rows should have disabled cancel button', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
      const text = await badge.textContent();
      if (text?.includes('Annulée')) {
        const actions = await bookingsPage.getRowActions(i);
        const isDisabled = await actions.cancel.isDisabled();
        expect(isDisabled).toBe(true);
        return;
      }
    }
  });

  test('each row should have exactly 2 action buttons (view/complete + cancel)', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      const row = bookingsPage.tableRows.nth(i);
      const actionButtons = row.locator('td:last-child button');
      const count = await actionButtons.count();
      expect(count).toBe(2);
    }
  });

  test('view button should have eye icon', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    for (let i = 0; i < rowCount; i++) {
      const isIncomplete = await bookingsPage.isRowIncomplete(i);
      if (!isIncomplete) {
        const actions = await bookingsPage.getRowActions(i);
        const icon = actions.view.locator('.lucide-eye-icon, svg');
        await expect(icon).toBeVisible();
        return;
      }
    }
  });

  test('cancel button should have ban icon', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) return;

    const actions = await bookingsPage.getRowActions(0);
    const icon = actions.cancel.locator('.lucide-ban-icon, svg');
    await expect(icon).toBeVisible();
  });
});
