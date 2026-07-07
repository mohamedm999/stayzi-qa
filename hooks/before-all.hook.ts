import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Inject auth state from the global storageState file into a page.
 * Use in test.beforeEach to set up auth when not using test.use({ storageState }).
 */
export async function injectAuthFromStorage(page: Page, storagePath = '.auth/user.json') {
  const absPath = path.resolve(process.cwd(), storagePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Storage state file not found: ${absPath}. Run globalSetup first.`);
  }

  const state = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  await page.goto('/');
  await page.evaluate((items: { name: string; value: string }[]) => {
    items.forEach(({ name, value }) => localStorage.setItem(name, value));
  }, state.origins[0].localStorage);
  if (state.cookies.length > 0) {
    await page.context().addCookies(state.cookies);
  }
}
