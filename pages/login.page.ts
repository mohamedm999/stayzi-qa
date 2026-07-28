import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@lib/logger';

export class LoginPage extends BasePage {
  readonly logo: Locator;
  readonly brandText: Locator;
  readonly header: Locator;

  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly form: Locator;
  readonly cardContainer: Locator;
  readonly notificationRegion: Locator;

  readonly emailInput: Locator;
  readonly emailLabel: Locator;
  readonly emailError: Locator;

  readonly passwordInput: Locator;
  readonly passwordLabel: Locator;
  readonly passwordError: Locator;
  readonly passwordToggleBtn: Locator;

  readonly forgotPasswordLink: Locator;
  readonly submitBtn: Locator;
  readonly signupLink: Locator;

  readonly sidePanel: Locator;
  readonly sidePanelImage: Locator;

  constructor(page: Page) {
    super(page);

    this.logo = page.getByAltText('Stayzi');
    this.brandText = page.locator('header span');
    this.header = page.locator('header');

    this.heading = page.getByRole('heading', { name: 'Bienvenue' });
    this.subtitle = page.getByText('Connectez-vous à votre compte');
    this.form = page.locator('form');
    this.cardContainer = page.locator('[data-slot="card"]');
    this.notificationRegion = page.getByRole('region', { name: 'Notifications alt+T' });

    this.emailInput = page.locator('#email');
    this.emailLabel = page.locator('label[data-slot="field-label"]').first();
    this.emailError = page.locator('[data-slot="field-error"]').first();

    this.passwordInput = page.locator('#password');
    this.passwordLabel = page.locator('label[data-slot="field-label"]').nth(1);
    this.passwordError = page.locator('[data-slot="field-error"]').nth(1);
    this.passwordToggleBtn = page.locator('xpath=//input[@id="password"]/../button');

    this.forgotPasswordLink = page.getByRole('link', { name: 'Mot de passe oublié?' });
    this.submitBtn = page.getByRole('button', { name: 'Se connecter' });
    this.signupLink = page.getByRole('link', { name: 'Créer un compte' });

    this.sidePanel = page.locator('.bg-\\[\\#13274F\\]');
    this.sidePanelImage = page.getByAltText('Logo');
  }

  // ─── Navigation ──────────────────────────────────────────────

  async gotoLogin(): Promise<void> {
    logger.step('Navigating to login page');
    await this.page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('load');
    await this.wait.forLoadingComplete();
  }

  // ─── Form Actions ────────────────────────────────────────────

  async fillEmail(email: string): Promise<void> {
    logger.step(`Filling email: ${email}`);
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    logger.step('Filling password');
    await this.passwordInput.fill(password);
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
  }

  async clickSubmit(): Promise<void> {
    logger.step('Clicking submit button');
    await this.submitBtn.click();
  }

  async submitLogin(email: string, password: string): Promise<void> {
    logger.step(`Submitting login: ${email}`);
    await this.fillCredentials(email, password);
    await this.clickSubmit();
  }

  // ─── Password Toggle ─────────────────────────────────────────

  async togglePasswordVisibility(): Promise<void> {
    logger.step('Toggling password visibility');
    await this.passwordToggleBtn.click();
  }

  async isPasswordVisible(): Promise<boolean> {
    return (await this.passwordInput.getAttribute('type')) === 'text';
  }

  // ─── Navigation Links ────────────────────────────────────────

  async clickForgotPassword(): Promise<void> {
    logger.step('Clicking forgot password link');
    await this.forgotPasswordLink.click();
  }

  async clickSignup(): Promise<void> {
    logger.step('Clicking create account link');
    await this.signupLink.click();
  }

  // ─── State Checks ────────────────────────────────────────────

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) || '';
  }

  async getSubtitleText(): Promise<string> {
    return (await this.subtitle.textContent()) || '';
  }

  async getEmailErrorMessage(): Promise<string> {
    return (await this.emailError.textContent()) || '';
  }

  async getPasswordErrorMessage(): Promise<string> {
    return (await this.passwordError.textContent()) || '';
  }

  async hasInvalidEmail(): Promise<boolean> {
    const invalid = await this.emailInput.getAttribute('aria-invalid');
    return invalid === 'true';
  }

  async hasInvalidPassword(): Promise<boolean> {
    const invalid = await this.passwordInput.getAttribute('aria-invalid');
    return invalid === 'true';
  }

  async getNotificationText(): Promise<string> {
    return (await this.notificationRegion.textContent()) || '';
  }

  async isSidePanelVisible(): Promise<boolean> {
    return this.isVisible(this.sidePanel);
  }

  async getFormAction(): Promise<string | null> {
    return this.form.getAttribute('action');
  }

  async getFormMethod(): Promise<string | null> {
    return this.form.getAttribute('method');
  }
}
