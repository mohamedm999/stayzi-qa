import { test, expect } from '@fixtures/test.fixture';

test.describe('Signup Page', () => {
  test.beforeEach(async ({ signupPage }) => {
    await signupPage.gotoSingup();
  });

  test('@smoke should load page with correct heading and form', async ({ signupPage }) => {
    await expect(signupPage.heading).toBeVisible();
    await expect(signupPage.form).toBeVisible();
  });

  test('@smoke should display all form fields with labels', async ({ signupPage }) => {
    await expect(signupPage.firstNameInput).toBeVisible();
    await expect(signupPage.firstNameLabel).toHaveText('Prénom');
    await expect(signupPage.lastNameInput).toBeVisible();
    await expect(signupPage.lastNameLabel).toHaveText('Nom');
    await expect(signupPage.emailInput).toBeVisible();
    await expect(signupPage.emailLabel).toHaveText('Email');
    await expect(signupPage.phoneInput).toBeVisible();
    await expect(signupPage.phoneLabel).toHaveText('Téléphone');
    await expect(signupPage.passwordInput).toBeVisible();
    await expect(signupPage.passwordLabel).toHaveText('Mot de passe');
    await expect(signupPage.confirmPasswordInput).toBeVisible();
    await expect(signupPage.confirmPasswordLabel).toHaveText('Confirmer Mot de passe');
    await expect(signupPage.submitBtn).toBeVisible();
    await expect(signupPage.submitBtn).toHaveText('Créer un compte');
  });

  test('@smoke should show required field errors on empty submit', async ({ signupPage }) => {
    await signupPage.clickSubmit();

    // Phone required error is shown by the client
    await expect(signupPage.phoneError).toBeVisible({ timeout: 3000 });
  });

  test('@smoke should toggle password visibility', async ({ signupPage }) => {
    await signupPage.fillPassword('MySecret1!');

    expect(await signupPage.isPasswordVisible()).toBe(false);
    await signupPage.togglePasswordVisibility();
    await expect(signupPage.passwordInput).toHaveAttribute('type', 'text');
    await signupPage.togglePasswordVisibility();
    await expect(signupPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('@smoke should toggle confirm password visibility', async ({ signupPage }) => {
    await signupPage.fillConfirmPassword('MySecret1!');

    expect(await signupPage.isConfirmPasswordVisible()).toBe(false);
    await signupPage.toggleConfirmPasswordVisibility();
    await expect(signupPage.confirmPasswordInput).toHaveAttribute('type', 'text');
    await signupPage.toggleConfirmPasswordVisibility();
    await expect(signupPage.confirmPasswordInput).toHaveAttribute('type', 'password');
  });

  test('@regression should navigate to login page', async ({ signupPage, page }) => {
    await signupPage.clickLoginLink();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('@regression should display password requirements', async ({ signupPage }) => {
    await expect(signupPage.passwordRequirements).toBeAttached();
  });

  test('@regression should register a new user and redirect to OTP verification', async ({ signupPage, page }) => {
    const ts = Date.now();
    const email = `testuser${ts}@testmail.com`;

    await signupPage.fillSignupForm({
      firstName: 'Test',
      lastName: `User${ts}`,
      email,
      phone: '+212600000000',
      password: 'TestPass1!',
      confirmPassword: 'TestPass1!',
    });

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });

    await expect(page).toHaveURL(/\/auth\/verify-otp/, { timeout: 20000 });
  });
});
