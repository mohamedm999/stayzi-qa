import { Page } from '@playwright/test';

/**
 * Clear auth state from browser after a test.
 * Use in test.afterEach to ensure clean state for next test.
 */
export async function clearAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  });
}

/**
 * Clear all localStorage and sessionStorage after a test.
 */
export async function clearAllStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Take a named screenshot on failure for debugging.
 */
export async function screenshotOnFailure(page: Page, testName: string) {
  await page.screenshot({ path: `test-results/${testName}-failure.png`, fullPage: true });
}
