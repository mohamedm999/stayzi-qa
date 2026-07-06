import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@utils/logger';

export class SignupPage extends BasePage {
  readonly heading: Locator;
  readonly form: Locator;

  readonly firstNameInput: Locator;
  readonly firstNameLabel: Locator;
  readonly firstNameError: Locator;

  readonly lastNameInput: Locator;
  readonly lastNameLabel: Locator;
  readonly lastNameError: Locator;

  readonly emailInput: Locator;
  readonly emailLabel: Locator;
  readonly emailError: Locator;

  readonly phoneInput: Locator;
  readonly phoneLabel: Locator;
  readonly phoneError: Locator;
  readonly countryCodeBtn: Locator;

  readonly passwordInput: Locator;
  readonly passwordLabel: Locator;
  readonly passwordError: Locator;
  readonly passwordToggleBtn: Locator;

  readonly confirmPasswordInput: Locator;
  readonly confirmPasswordLabel: Locator;
  readonly confirmPasswordError: Locator;
  readonly confirmPasswordToggleBtn: Locator;

  readonly submitBtn: Locator;
  readonly loginLink: Locator;

  readonly passwordRequirements: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: 'Créer un compte' });
    this.form = page.locator('form');

    this.firstNameInput = page.locator('#firstName');
    this.firstNameLabel = page.locator('label[for="firstName"]');
    this.firstNameError = page.locator('[data-slot="field-error"]').first();

    this.lastNameInput = page.locator('#lastName');
    this.lastNameLabel = page.locator('label[for="lastName"]');

    this.emailInput = page.locator('#email');
    this.emailLabel = page.locator('label[for="email"]');

    this.phoneInput = page.locator('#phone');
    this.phoneLabel = page.locator('label[for="phone"]');
    this.phoneError = page.locator('text=Le numéro de téléphone est obligatoire');
    this.countryCodeBtn = page.locator('button[data-slot="popover-trigger"]');

    this.passwordInput = page.locator('#password');
    this.passwordLabel = page.locator('label[for="password"]');
    this.passwordError = page.locator('text=Le mot de passe doit contenir');
    this.passwordToggleBtn = page.locator('xpath=//input[@id="password"]/../button');

    this.confirmPasswordInput = page.locator('#confirmPassword');
    this.confirmPasswordLabel = page.locator('label[for="confirmPassword"]');
    this.confirmPasswordError = page.locator('text=Les mots de passe ne correspondent pas');
    this.confirmPasswordToggleBtn = page.locator('xpath=//input[@id="confirmPassword"]/../button');

    this.submitBtn = page.getByRole('button', { name: 'Créer un compte' });
    this.loginLink = page.getByRole('link', { name: 'Se connecter' });

    this.passwordRequirements = page.locator('.rounded-lg.border.bg-muted\\/30.p-3');
  }

  async gotoSingup(): Promise<void> {
    logger.step('Navigating to signup page');
    await this.page.goto('/auth/signup', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('load');
    await this.wait.forLoadingComplete();
  }

  async fillFirstName(firstName: string): Promise<void> {
    logger.step(`Filling first name: ${firstName}`);
    await this.firstNameInput.fill(firstName);
  }

  async fillLastName(lastName: string): Promise<void> {
    logger.step(`Filling last name: ${lastName}`);
    await this.lastNameInput.fill(lastName);
  }

  async fillEmail(email: string): Promise<void> {
    logger.step(`Filling email: ${email}`);
    await this.emailInput.fill(email);
  }

  async fillPhone(phone: string): Promise<void> {
    logger.step(`Filling phone: ${phone}`);
    await this.phoneInput.fill(phone);
  }

  async fillPassword(password: string): Promise<void> {
    logger.step('Filling password');
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string): Promise<void> {
    logger.step('Filling confirm password');
    await this.confirmPasswordInput.fill(password);
  }

  async fillSignupForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await this.fillFirstName(data.firstName);
    await this.fillLastName(data.lastName);
    await this.fillEmail(data.email);
    await this.fillPhone(data.phone);
    await this.fillPassword(data.password);
    await this.fillConfirmPassword(data.confirmPassword);
  }

  async clickSubmit(): Promise<void> {
    logger.step('Clicking submit button');
    await this.submitBtn.click();
  }

  async submitByFormRequest(): Promise<void> {
    logger.step('Submitting form via requestSubmit');
    await this.page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });
  }

  async submitSignup(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await this.fillSignupForm(data);
    await this.page.waitForTimeout(500);
    await this.clickSubmit();
  }

  async clickLoginLink(): Promise<void> {
    logger.step('Clicking login link');
    await this.loginLink.click();
  }

  async togglePasswordVisibility(): Promise<void> {
    logger.step('Toggling password visibility');
    await this.passwordToggleBtn.click();
  }

  async toggleConfirmPasswordVisibility(): Promise<void> {
    logger.step('Toggling confirm password visibility');
    await this.confirmPasswordToggleBtn.click();
  }

  async isPasswordVisible(): Promise<boolean> {
    return (await this.passwordInput.getAttribute('type')) === 'text';
  }

  async isConfirmPasswordVisible(): Promise<boolean> {
    return (await this.confirmPasswordInput.getAttribute('type')) === 'text';
  }

  async getPasswordRequirementTexts(): Promise<string[]> {
    const items = this.page.locator('.grid-cols-1 span, .grid-cols-1 div span');
    return items.allTextContents();
  }

  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) || '';
  }
}
