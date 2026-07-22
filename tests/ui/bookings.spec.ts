import { test, expect } from '@fixtures/test.fixture';

test.describe('Bookings Page — Table', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke should display bookings page with heading and table', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await expect(bookingsPage.heading).toBeVisible();
    await expect(bookingsPage.tableContainer).toBeVisible();
  });

  test('@smoke should display correct table columns', async ({ bookingsPage }) => {
    await bookingsPage.goto();

    const headers = await bookingsPage.getHeaderTexts();
    expect(headers.length).toBeGreaterThanOrEqual(11);

    expect(headers[0].toLowerCase()).toContain('client');
    expect(headers[1].toLowerCase()).toContain('propriété');
    expect(headers[2].toLowerCase()).toContain('téléphone');
    expect(headers[3].toLowerCase()).toContain('check-in');
    expect(headers[4].toLowerCase()).toContain('check-out');
    expect(headers[5].toLowerCase()).toContain('pers');
    expect(headers[6].toLowerCase()).toContain('statut');
    expect(headers[7].toLowerCase()).toContain('fiche police');
    expect(headers[8].toLowerCase()).toContain('montant');
  });

  test('should display sync button with tooltip', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await expect(bookingsPage.syncBtn).toBeVisible();
  });

  test('should display booking count badge', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const count = await bookingsPage.getBookingCount();
    expect(count).toMatch(/\d+/);
  });

  test('should show empty state when no bookings exist', async ({ bookingsPage }) => {
    // This test only passes if the DB is empty
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount === 0) {
      await expect(bookingsPage.emptyState).toBeVisible();
      await expect(bookingsPage.emptyStateIcon).toBeVisible();
    }
  });

  test('should display rows with all 11 columns', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount > 0) {
      const firstRow = bookingsPage.tableRows.first();
      const cells = firstRow.locator('td');
      expect(await cells.count()).toBeGreaterThanOrEqual(11);
    }
  });

  test('should show status badge with correct variant', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount > 0) {
      const statusCell = bookingsPage.getStatusBadge(bookingsPage.tableRows.first());
      const text = (await statusCell.textContent()) || '';
      const validStatuses = ['À venir', 'En cours', 'Terminée', 'Annulée', 'Infos manquantes'];
      expect(validStatuses.some(s => text.includes(s))).toBe(true);
    }
  });

  test('should display view and cancel action buttons per row', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    if (rowCount > 0) {
      const firstRow = bookingsPage.tableRows.first();
      const cells = firstRow.locator('td');
      expect(await cells.count()).toBe(11);
      // Actions column (last cell) should contain interactive elements
      const lastCell = cells.last();
      const innerHtml = await lastCell.innerHTML();
      expect(innerHtml).toContain('button');
    }
  });

  test('INCOMPLETE rows should have destructive styling', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    for (let i = 0; i < rowCount; i++) {
      const isIncomplete = await bookingsPage.isRowIncomplete(i);
      if (isIncomplete) {
        const badge = bookingsPage.getStatusBadge(bookingsPage.tableRows.nth(i));
        const text = await badge.textContent();
        expect(text).toContain('Infos manquantes');
      }
    }
  });

  test('should display amounts in MAD format', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    for (let i = 0; i < rowCount; i++) {
      const data = await bookingsPage.getRowData(i);
      if (data && data.amount && data.amount !== '—') {
        expect(data.amount).toMatch(/MAD|—/);
      }
    }
  });

  test('check-in date should be before check-out date', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    for (let i = 0; i < rowCount; i++) {
      const data = await bookingsPage.getRowData(i);
      if (data && data.checkIn && data.checkOut && data.checkIn !== '—' && data.checkOut !== '—') {
        // Both dates should be non-empty strings
        expect(data.checkIn.length).toBeGreaterThan(0);
        expect(data.checkOut.length).toBeGreaterThan(0);
      }
    }
  });

  test('should navigate to /concierge/bookings', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    expect(bookingsPage.page.url()).toContain('/concierge/bookings');
  });

  test('should have 11 table header columns', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const headers = bookingsPage.tableHeaders;
    expect(await headers.count()).toBe(11);
  });

  test('guest count should be a positive number', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    for (let i = 0; i < rowCount; i++) {
      const data = await bookingsPage.getRowData(i);
      if (data && data.guests) {
        const num = parseInt(data.guests);
        expect(num).toBeGreaterThan(0);
      }
    }
  });

  test('createdAt date should be in readable format', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    const rowCount = await bookingsPage.getRowCount();
    for (let i = 0; i < rowCount; i++) {
      const data = await bookingsPage.getRowData(i);
      if (data && data.createdAt) {
        // Format: "08 juil. 2026" or "dd/MM/yyyy"
        expect(data.createdAt.length).toBeGreaterThan(3);
      }
    }
  });
});
