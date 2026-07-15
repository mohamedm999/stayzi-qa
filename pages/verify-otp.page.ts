import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@utils/logger';

export class VerifyOtpPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly form: Locator;
  readonly cardContainer: Locator;

  readonly singleOtpInput: Locator;
  readonly multiOtpInputs: Locator;

  readonly submitBtn: Locator;
  readonly resendBtn: Locator;
  readonly backToLoginLink: Locator;

  readonly errorMessage: Locator;
  readonly emailText: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByText('Vérifiez votre email');
    this.subtitle = page.getByText(/envoyé un code/i);
    this.form = page.locator('form');
    this.cardContainer = page.locator('[data-slot="card"]');

    this.singleOtpInput = page.getByRole('textbox', { name: 'Code de vérification' });
    this.multiOtpInputs = page.locator('input[data-slot="otp-input"], input[name="otp-0"], input[name="otp_0"]');

    this.submitBtn = page.getByRole('button', { name: /verifier|vérifier|confirmer|valider/i });
    this.resendBtn = page.getByRole('button', { name: /renvoyer|renvoyer le code/i });
    this.backToLoginLink = page.getByRole('link', { name: /retour|se connecter/i });

    this.errorMessage = page.locator('[data-slot="field-error"], [role="alert"]');
    this.emailText = page.getByText(/@/);
  }

  // ─── Navigation ──────────────────────────────────────────────

  async goto(): Promise<void> {
    logger.step('Navigating to OTP verification page');
    await this.page.goto('/auth/verify-otp', { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('load');
    await this.wait.forLoadingComplete();
  }

  // ─── OTP Input Handling ──────────────────────────────────────

  private async isMultiInputMode(): Promise<boolean> {
    return (await this.multiOtpInputs.count()) > 1;
  }

  async fillOtp(code: string): Promise<void> {
    logger.step(`Filling OTP code: ${code}`);

    if (await this.isMultiInputMode()) {
      const digits = code.split('');
      const inputs = this.multiOtpInputs;
      const count = await inputs.count();
      for (let i = 0; i < Math.min(digits.length, count); i++) {
        await inputs.nth(i).fill(digits[i]);
      }
    } else {
      await this.singleOtpInput.fill(code);
    }
  }

  // ─── Form Actions ────────────────────────────────────────────

  async clickSubmit(): Promise<void> {
    logger.step('Clicking OTP submit button');
    await this.submitBtn.click();
  }

  async verifyOtp(code: string): Promise<void> {
    logger.step(`Verifying OTP: ${code}`);
    await this.fillOtp(code);
    // Wait for submit button to become enabled after filling OTP
    await this.page.waitForFunction(
      (btn) => btn && !(btn as HTMLButtonElement).disabled,
      await this.submitBtn.elementHandle(),
      { timeout: 5000 }
    );
    await this.clickSubmit();
    // After successful OTP, click "Continuer" to proceed to dashboard
    const continueBtn = this.page.getByRole('button', { name: /continuer/i });
    try {
      await continueBtn.waitFor({ state: 'visible', timeout: 10000 });
      logger.step('Clicking Continuer button');
      await continueBtn.click();
    } catch {
      // Continue button may not appear if OTP failed — that's expected
    }
  }

  async clickResend(): Promise<void> {
    logger.step('Clicking resend code button');
    await this.resendBtn.click();
  }

  async clickBackToLogin(): Promise<void> {
    logger.step('Clicking back to login link');
    await this.backToLoginLink.click();
  }

  // ─── State Checks ────────────────────────────────────────────

  async isOnOtpPage(): Promise<boolean> {
    return this.page.url().includes('/auth/verify-otp');
  }

  async waitForCodeSent(timeout = 5000): Promise<void> {
    logger.step('Waiting for code sent confirmation');
    await this.page.waitForURL('**/auth/verify-otp', { timeout });
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.first().textContent()) || '';
  }

  async getDisplayedEmail(): Promise<string> {
    const text = await this.emailText.first().textContent() || '';
    const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    return match ? match[0] : text;
  }

  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) || '';
  }

  async getSubtitleText(): Promise<string> {
    return (await this.subtitle.textContent()) || '';
  }
}
