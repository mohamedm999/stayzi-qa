import { test, expect } from '@fixtures/test.fixture';

test.describe('Properties Page', () => {
  test.use({ storageState: '.auth/user.json' });

  const timestamp = Date.now();
  const testProperty = {
    name: `Villa Test ${timestamp}`,
    type: 'VILLA' as const,
    city: 'Marrakech',
    country: 'Maroc',
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 1,
    price: 500,
  };

  test('@smoke should display page structure with heading and add button', async ({ propertiesPage }) => {
    await propertiesPage.goto();
    await expect(propertiesPage.heading).toBeVisible();
    await expect(propertiesPage.subtitle).toBeVisible();
    await expect(propertiesPage.addPropertyBtn).toBeVisible();
  });

  test('@smoke step 1 should enable Suivant after selecting a mode', async ({ propertiesPage }) => {
    await propertiesPage.goto();
    const wizard = await propertiesPage.clickAddProperty();
    await expect(wizard.dialog).toBeVisible();

    await expect(await wizard.isNextEnabled()).toBe(false);
    await wizard.selectMode('manual');
    await expect(await wizard.isNextEnabled()).toBe(true);
  });

  test('@smoke step 2 manual form should show validation errors on empty submit', async ({ propertiesPage }) => {
    await propertiesPage.goto();
    const wizard = await propertiesPage.clickAddProperty();
    await expect(wizard.dialog).toBeVisible();

    await wizard.selectMode('manual');
    await wizard.nextStep();

    await wizard.submitForm();

    const nameError = await wizard.getFieldError('name');
    expect(nameError).toContain('obligatoire');

    const cityError = await wizard.getFieldError('city');
    expect(cityError).toContain('obligatoire');

    const countryError = await wizard.getFieldError('country');
    expect(countryError).toContain('obligatoire');
  });

  test('@regression should navigate back from step 2 to step 1', async ({ propertiesPage }) => {
    await propertiesPage.goto();
    const wizard = await propertiesPage.clickAddProperty();
    await expect(wizard.dialog).toBeVisible();

    await wizard.selectMode('manual');
    await wizard.nextStep();

    expect(await wizard.getStepState(1)).toBe('completed');
    expect(await wizard.getStepState(2)).toBe('active');

    await wizard.prevStep();
    expect(await wizard.getStepState(1)).toBe('active');
    expect(await wizard.getStepState(2)).toBe('inactive');
  });

  test.skip('should create a property via manual form and show success', async ({ propertiesPage }) => {
    await propertiesPage.goto();
    const wizard = await propertiesPage.clickAddProperty();
    await expect(wizard.dialog).toBeVisible();

    await wizard.selectMode('manual');
    await wizard.nextStep();

    await wizard.fillForm(testProperty);
    await wizard.clearICalFields();
    await wizard.submitForm();

    const msg = await wizard.getSuccessMessage();
    expect(msg).toContain('succès');

    await wizard.clickFermer();
    await expect(wizard.dialog).not.toBeVisible({ timeout: 10000 });
  });

  test('@regression should increment max guests with spinner buttons', async ({ propertiesPage }) => {
    await propertiesPage.goto();
    const wizard = await propertiesPage.clickAddProperty();
    await expect(wizard.dialog).toBeVisible();

    await wizard.selectMode('manual');
    await wizard.nextStep();

    await wizard.incrementGuests();
    const afterIncrement = await wizard.getMaxGuests();
    expect(afterIncrement).toBeGreaterThan(0);
  });
});
