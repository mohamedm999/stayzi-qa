import { Page, Locator } from '@playwright/test';

export class WaitHelper {
  constructor(private page: Page) {}

  /**
   * Wait for an element to be visible
   */
  async forVisible(selector: string | Locator, timeout?: number): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for an element to be hidden (or removed from DOM)
   */
  async forHidden(selector: string | Locator, timeout?: number): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Wait for loading indicator to disappear
   * Tries multiple common selectors — doesn't fail if none exist
   */
  async forLoadingComplete(timeout = 15000): Promise<void> {
    const loadingSelectors = [
      '[data-testid="loading-spinner"]',
      '.spinner',
      '[class*="loading"]',
      '[class*="spinner"]',
      '.skeleton',
      '[class*="skeleton"]',
      '[data-testid="global-loader"]',
      '#global-loader',
    ];

    for (const selector of loadingSelectors) {
      try {
        const locator = this.page.locator(selector);
        if (await locator.isVisible()) {
          await locator.waitFor({ state: 'hidden', timeout });
          return;
        }
      } catch {
        // Selector doesn't exist — move to next
      }
    }

    // If no loader found, wait a brief moment for any async content
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for network to be idle (no requests for 500ms)
   */
  async forNetworkIdle(timeout = 10000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Wait for a specific API call to complete
   * Returns the response body
   */
  async forApiResponse(urlPattern: string | RegExp, timeout = 15000): Promise<unknown> {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        typeof urlPattern === 'string'
          ? response.url().includes(urlPattern)
          : urlPattern.test(response.url()),
      { timeout }
    );

    const response = await responsePromise;
    return response.json();
  }

  /**
   * Wait for page to be fully loaded (DOM + network idle)
   */
  async forPageReady(timeout = 30000): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout });
    await this.forNetworkIdle(timeout);
    await this.forLoadingComplete();
  }

  /**
   * Wait for an element to have a specific text content
   */
  async forText(selector: string | Locator, text: string, timeout?: number): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : locator;
    await locator.filter({ hasText: text }).first().waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for an element to be enabled and clickable
   */
  async forClickable(selector: string | Locator, timeout?: number): Promise<void> {
    const locator = typeof selector === 'string' ? this.page.locator(selector) : selector;
    await locator.waitFor({ state: 'attached', timeout });
    await locator.waitFor({ state: 'visible', timeout });
    await expect(locator).toBeEnabled({ timeout });
  }

  /**
   * Wait for the URL to contain a path
   */
  async forUrlContains(path: string, timeout = 10000): Promise<void> {
    await this.page.waitForURL(`**${path}**`, { timeout });
  }

  /**
   * Wait for a specific number of elements to appear
   */
  async forCount(selector: string, count: number, timeout = 10000): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout });
    while ((await locator.count()) < count) {
      await this.page.waitForTimeout(500);
    }
  }
}