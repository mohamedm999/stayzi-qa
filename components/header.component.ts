import { Page, Locator } from '@playwright/test';
import { logger } from '@utils/logger';

export class HeaderComponent {
  private page: Page;

  // ─── Navigation Links ────────────────────────────────────────
  readonly logo: Locator;
  readonly exploreLink: Locator;
  readonly becomeHostLink: Locator;

  // ─── Auth Buttons (logged out) ───────────────────────────────
  readonly loginBtn: Locator;
  readonly signupBtn: Locator;

  // ─── User Menu (logged in) ───────────────────────────────────
  readonly userMenuBtn: Locator;
  readonly profileLink: Locator;
  readonly myTripsLink: Locator;
  readonly myBookingsLink: Locator;
  readonly logoutBtn: Locator;

  // ─── Misc ────────────────────────────────────────────────────
  readonly languageDropdown: Locator;
  readonly notificationBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.logo = page.locator('[data-testid="logo"], header a[href="/"], .navbar-brand');
    this.exploreLink = page.locator('[data-testid="nav-explore"], nav a:has-text("Explore"), a[href*="explore"]');
    this.becomeHostLink = page.locator('[data-testid="nav-become-host"], nav a:has-text("Become a Host"), a[href*="host"]');

    // Auth (logged out)
    this.loginBtn = page.locator('[data-testid="nav-login"], nav button:has-text("Log in"), nav a:has-text("Log in")');
    this.signupBtn = page.locator('[data-testid="nav-signup"], nav button:has-text("Sign up"), nav a:has-text("Sign up")');

    // User menu (logged in)
    this.userMenuBtn = page.locator('[data-testid="user-menu-btn"], header [class*="avatar"], header button[class*="profile"]');
    this.profileLink = page.locator('[data-testid="user-profile"], .dropdown-menu a:has-text("Profile")');
    this.myTripsLink = page.locator('[data-testid="user-trips"], .dropdown-menu a:has-text("Trips")');
    this.myBookingsLink = page.locator('[data-testid="user-bookings"], .dropdown-menu a:has-text("Bookings")');
    this.logoutBtn = page.locator('[data-testid="user-logout"], .dropdown-menu button:has-text("Log out"), .dropdown-menu a:has-text("Log out")');

    // Misc
    this.languageDropdown = page.locator('[data-testid="language-selector"], header [class*="lang"]');
    this.notificationBtn = page.locator('[data-testid="notification-btn"], header button[class*="bell"], header button[class*="notif"]');
  }

  // ─── Actions ─────────────────────────────────────────────────

  /**
   * Click the logo to go to homepage
   */
  async goToHome(): Promise<void> {
    logger.step('Clicking logo → homepage');
    await this.logo.click();
  }

  /**
   * Navigate to Explore page
   */
  async goToExplore(): Promise<void> {
    logger.step('Navigating to Explore');
    await this.exploreLink.click();
  }

  /**
   * Click Log in from header
   */
  async clickLogin(): Promise<void> {
    logger.step('Clicking Log in from header');
    await this.loginBtn.click();
  }

  /**
   * Click Sign up from header
   */
  async clickSignup(): Promise<void> {
    logger.step('Clicking Sign up from header');
    await this.signupBtn.click();
  }

  /**
   * Open user dropdown menu (must be logged in)
   */
  async openUserMenu(): Promise<void> {
    logger.step('Opening user menu');
    await this.userMenuBtn.click();
  }

  /**
   * Logout through the user menu dropdown
   */
  async logout(): Promise<void> {
    logger.step('Logging out via header menu');
    await this.openUserMenu();
    await this.logoutBtn.click();
  }

  // ─── State Checks ────────────────────────────────────────────

  /**
   * Check if user appears logged in (user menu visible)
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      return await this.userMenuBtn.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Check if login/signup buttons are visible (user is logged out)
   */
  async isLoggedOut(): Promise<boolean> {
    try {
      return await this.loginBtn.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }
}