import { Page, Locator } from '@playwright/test';
import { WaitHelper } from '@lib/wait.helper';
import { logger } from '@lib/logger';

export class BasePage {
  readonly page: Page;
  readonly wait: WaitHelper;

  // Common selectors (override in child pages if needed)
  readonly loadingSpinner = '[data-testid="loading-spinner"], .spinner, [class*="loading"]';
  readonly globalLoader = '[data-testid="global-loader"], #global-loader';
  readonly toastSuccess = '[data-testid="toast-success"], [class*="toast-success"]';
  readonly toastError = '[data-testid="toast-error"], [class*="toast-error"]';
  readonly cookieBanner = '[data-testid="cookie-banner"], [class*="cookie"], #cookie-consent';
  readonly acceptCookiesBtn = '[data-testid="accept-cookies"], button:has-text("Accept"), button:has-text("I Agree")';

  constructor(page: Page) {
    this.page = page;
    this.wait = new WaitHelper(page);
  }

  // ─── Navigation ──────────────────────────────────────────────

  /**
   * Navigate to a path relative to the base URL
   */
  async goto(path = '/', options?: { waitForLoad?: boolean }): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.page.url().origin}${path}`;
    logger.step(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });

    if (options?.waitForLoad !== false) {
      await this.wait.forLoadingComplete();
    }
  }

  /**
   * Reload the current page
   */
  async reload(): Promise<void> {
    logger.step('Reloading page');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.wait.forLoadingComplete();
  }

  // ─── Cookies ─────────────────────────────────────────────────

  /**
   * Dismiss cookie/banner if it appears
   */
  async dismissCookieBanner(): Promise<void> {
    try {
      const banner = this.page.locator(this.cookieBanner);
      if (await banner.isVisible({ timeout: 3000 })) {
        await this.page.locator(this.acceptCookiesBtn).first().click();
        logger.info('Cookie banner dismissed');
      }
    } catch {
      // No banner — that's fine
    }
  }

  // ─── Toast / Notifications ───────────────────────────────────

  /**
   * Get the success toast message text
   */
  async getSuccessToast(): Promise<string> {
    const toast = this.page.locator(this.toastSuccess).first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    return (await toast.textContent()) || '';
  }

  /**
   * Get the error toast message text
   */
  async getErrorToast(): Promise<string> {
    const toast = this.page.locator(this.toastError).first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });
    return (await toast.textContent()) || '';
  }

  // ─── Element Helpers ─────────────────────────────────────────

  /**
   * Type text into an input with a small delay (simulates real typing)
   */
  async typeSlowly(selector: string | Locator, text: string, delay = 50): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.click();
    await locator.fill('');
    await locator.type(text, { delay });
  }

  /**
   * Clear an input field
   */
  async clearInput(selector: string | Locator): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.click({ clickCount: 3 });
    await locator.press('Backspace');
  }

  /**
   * Upload a file to a file input
   */
  async uploadFile(selector: string | Locator, filePath: string): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.setInputFiles(filePath);
  }

  // ─── Visibility Checks ───────────────────────────────────────

  /**
   * Check if an element is visible (returns boolean, no throw)
   */
  async isVisible(selector: string | Locator, timeout = 3000): Promise<boolean> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    try {
      return await locator.isVisible({ timeout });
    } catch {
      return false;
    }
  }

  /**
   * Get text content safely (returns empty string if not found)
   */
  async getText(selector: string | Locator): Promise<string> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    try {
      return (await locator.textContent()) || '';
    } catch {
      return '';
    }
  }

  // ─── Screenshots ─────────────────────────────────────────────

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    await this.page.screenshot({
      path: `screenshots/${filename}`,
      fullPage: true,
    });
    logger.info(`Screenshot saved: ${filename}`);
  }
}