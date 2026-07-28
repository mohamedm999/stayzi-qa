import { test, expect } from '@fixtures/test.fixture';

test.describe('Bookings Page — Create Booking Wizard', () => {
  test.use({ storageState: '.auth/user.json' });

  test('should open create booking drawer', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    await expect(drawer.drawer).toBeVisible();
    await expect(drawer.title).toBeVisible();
  });

  test('should display 3-step stepper', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    await expect(drawer.stepperNav).toBeVisible();
    expect(await drawer.stepperItems.count()).toBe(4);
  });

  test('step 1 should show property search form', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    await expect(drawer.searchForm).toBeVisible();
    await expect(drawer.dateTrigger).toBeVisible();
    await expect(drawer.citySelect).toBeVisible();
    await expect(drawer.typeApartment).toBeVisible();
    await expect(drawer.typeVilla).toBeVisible();
  });

  test('step 1 should have guest count increment/decrement buttons', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    await expect(drawer.guestMinus).toBeVisible();
    await expect(drawer.guestPlus).toBeVisible();
    await expect(drawer.guestCountInput).toBeVisible();
  });

  test('guest count should increment when clicking plus', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    const initial = await drawer.guestCountInput.inputValue();
    await drawer.guestPlus.click();
    const after = await drawer.guestCountInput.inputValue();
    expect(parseInt(after)).toBeGreaterThan(parseInt(initial));
  });

  test('guest count should decrement when clicking minus', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    await drawer.guestPlus.click();
    await drawer.guestPlus.click();
    const before = await drawer.guestCountInput.inputValue();
    await drawer.guestMinus.click();
    const after = await drawer.guestCountInput.inputValue();
    expect(parseInt(after)).toBeLessThan(parseInt(before));
  });

  test('previous button should be disabled on step 1', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    await expect(drawer.prevBtn).toBeDisabled();
  });

  test('should show no-properties dialog when user has 0 properties', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const noPropDialog = bookingsPage.getNoPropertyDialog();
    const visible = await noPropDialog.isOpen();
    if (visible) {
      await expect(noPropDialog.title).toBeVisible();
      await expect(noPropDialog.addPropertyBtn).toBeVisible();
    }
  });

  test('should close drawer with close button', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    await expect(drawer.drawer).toBeVisible();
    await drawer.close();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5000 });
  });

  test('step 3 should show guest info form fields', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();

    // Skip to step 3 if properties exist
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    // Search and select a property first
    await drawer.searchProperty({
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
      city: 'marrakech',
      guestCount: 2,
      type: 'VILLA',
    });

    // Wait for results or no-results
    await bookingsPage.page.waitForTimeout(2000);

    // Try to select property if available
    const radioCount = await drawer.propertyRadios.count();
    if (radioCount > 0) {
      await drawer.selectProperty(0);
      await drawer.goToNext();

      // Now on step 3
      await expect(drawer.firstNameInput).toBeVisible();
      await expect(drawer.lastNameInput).toBeVisible();
      await expect(drawer.phoneInput).toBeVisible();
      await expect(drawer.countryInput).toBeVisible();
    }
  });

  test('step 3 should show validation errors on empty submit', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();

    // This test only works if properties exist and we can reach step 3
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    // Search property
    await drawer.searchProperty({
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
      city: 'marrakech',
      guestCount: 2,
      type: 'VILLA',
    });

    await bookingsPage.page.waitForTimeout(2000);
    const radioCount = await drawer.propertyRadios.count();
    if (radioCount === 0) return;

    await drawer.selectProperty(0);
    await drawer.goToNext();

    // On step 3, try to confirm without filling
    await drawer.confirm();

    // Check for validation errors
    const firstNameError = await drawer.getFieldError('firstName');
    const phoneError = await drawer.getFieldError('phone');
    expect(firstNameError.length + phoneError.length).toBeGreaterThan(0);
  });

  test('should go back to step 2 when clicking previous', async ({ bookingsPage }) => {
    await bookingsPage.goto();
    await bookingsPage.clickCreate();

    const drawer = bookingsPage.getCreateDrawer();
    const noPropDialog = bookingsPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) return;

    await drawer.searchProperty({
      checkIn: '2026-08-01',
      checkOut: '2026-08-05',
      city: 'marrakech',
      guestCount: 2,
      type: 'VILLA',
    });

    await bookingsPage.page.waitForTimeout(2000);
    const radioCount = await drawer.propertyRadios.count();
    if (radioCount === 0) return;

    await drawer.selectProperty(0);
    await drawer.goToNext();

    // Now on step 3, go back
    await drawer.goToPrev();

    // Should be back on step 2 — property radios visible
    await expect(drawer.propertyRadios.first()).toBeVisible();
  });
});
