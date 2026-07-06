import { test, expect } from '@fixtures/test.fixture';

test.describe('Login Page', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.gotoLogin();
  });

  test('@smoke should load page with correct title and heading', async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.heading).toHaveText('Bienvenue');
    await expect(loginPage.subtitle).toBeVisible();
    await expect(loginPage.logo).toBeVisible();
    await expect(loginPage.brandText).toHaveText('Stayzi');
    await expect(loginPage.form).toBeVisible();
  });

  test('@smoke should display email and password fields', async ({ loginPage }) => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.emailInput).toHaveAttribute('placeholder', 'vous@example.com');
    await expect(loginPage.emailLabel).toHaveText('Email');
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.passwordLabel).toHaveText('Mot de passe');
    await expect(loginPage.submitBtn).toBeVisible();
    await expect(loginPage.submitBtn).toHaveText('Se connecter');
  });

  test('@smoke should show validation errors when submitting empty form', async ({ loginPage }) => {
    await loginPage.clickSubmit();

    await expect(loginPage.emailError).toBeVisible({ timeout: 3000 });
    await expect(loginPage.emailError).toHaveText('Adresse email invalide');
    await expect(loginPage.passwordError).toBeVisible({ timeout: 3000 });
    await expect(loginPage.passwordError).toHaveText('Le mot de passe est obligatoire');

    expect(await loginPage.hasInvalidEmail()).toBe(true);
    expect(await loginPage.hasInvalidPassword()).toBe(true);
  });

  test('@smoke should toggle password visibility', async ({ loginPage }) => {
    await loginPage.fillPassword('MySecretPass1!');

    expect(await loginPage.isPasswordVisible()).toBe(false);

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('@smoke should navigate to signup page', async ({ loginPage, page }) => {
    await loginPage.clickSignup();
    await expect(page).toHaveURL(/\/auth\/signup/);
  });

  test('@regression should have forgot password link', async ({ loginPage }) => {
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toHaveText('Mot de passe oublié?');
  });

  test('@regression should have a notification region for toasts', async ({ loginPage }) => {
    await expect(loginPage.notificationRegion).toBeAttached();
    await expect(loginPage.notificationRegion).toHaveAttribute('aria-live', 'polite');
  });

  test('@regression should display side panel image on desktop', async ({ loginPage }) => {
    const visible = await loginPage.isSidePanelVisible();
    if (visible) {
      await expect(loginPage.sidePanelImage).toBeVisible();
    }
  });

  test('@regression should submit login without query params in URL (JS interception)', async ({ loginPage, page }) => {
    await loginPage.submitLogin('user@example.com', 'password123');
    await expect(page).not.toHaveURL(/\?/, { timeout: 10000 });
  });

  test('@regression should show error toast on invalid credentials', async ({ loginPage }) => {
    await loginPage.submitLogin('wrong@email.com', 'WrongPass1!');
    await expect(loginPage.notificationRegion).not.toBeEmpty({ timeout: 10000 });
  });

  test('@smoke should login with valid credentials and redirect to dashboard', async ({ loginPage, page }) => {
    const email = process.env.TEST_USER_EMAIL || '';
    const password = process.env.TEST_USER_PASSWORD || '';

    test.skip(!email || !password, 'TEST_USER_EMAIL or TEST_USER_PASSWORD not configured');

    await loginPage.submitLogin(email, password);

    await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/concierge\//, { timeout: 10000 });
    await expect(page.locator('header')).toBeVisible();
  });
});
