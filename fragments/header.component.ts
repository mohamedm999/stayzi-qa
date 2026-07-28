import { Page, Locator } from '@playwright/test';
import { logger } from '@lib/logger';

export class HeaderComponent {
  private page: Page;

  readonly header: Locator;
  readonly sidebarTrigger: Locator;

  constructor(page: Page) {
    this.page = page;

    this.header = page.locator('header');
    this.sidebarTrigger = page.locator('[data-slot="sidebar-trigger"]');
  }

  // ─── Actions ─────────────────────────────────────────────────

  async toggleSidebar(): Promise<void> {
    logger.step('Toggling sidebar via header trigger');
    await this.sidebarTrigger.click();
  }

  // ─── State Checks ────────────────────────────────────────────

  async isVisible(): Promise<boolean> {
    try {
      return await this.header.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  async isSticky(): Promise<boolean> {
    const cls = await this.header.getAttribute('class');
    return cls?.includes('sticky') ?? false;
  }
}
