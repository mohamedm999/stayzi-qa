import { Page, Locator } from '@playwright/test';
import { logger } from '@utils/logger';

export class SidebarComponent {
  private page: Page;

  // ─── Sidebar Container ───────────────────────────────────────
  readonly sidebar: Locator;
  readonly toggleBtn: Locator; // mobile hamburger / collapse button
  readonly overlay: Locator; // mobile backdrop

  // ─── Guest Navigation ────────────────────────────────────────
  readonly dashboardLink: Locator;
  readonly myTripsLink: Locator;
  readonly myBookingsLink: Locator;
  readonly messagesLink: Locator;
  readonly favoritesLink: Locator;
  readonly profileLink: Locator;
  readonly settingsLink: Locator;

  // ─── Host Navigation ─────────────────────────────────────────
  readonly hostDashboardLink: Locator;
  readonly myListingsLink: Locator;
  readonly addListingLink: Locator;
  readonly reservationsLink: Locator;
  readonly calendarLink: Locator;
  readonly earningsLink: Locator;
  readonly reviewsLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Container
    this.sidebar = page.locator(
      '[data-testid="sidebar"], aside, [class*="sidebar"], [class*="side-nav"], nav[class*="dashboard"]'
    );
    this.toggleBtn = page.locator(
      '[data-testid="sidebar-toggle"], button[class*="hamburger"], button[class*="menu-toggle"], button[aria-label*="menu"]'
    );
    this.overlay = page.locator(
      '[class*="sidebar-overlay"], [class*="backdrop"], .sidebar-backdrop'
    );

    // Guest nav
    this.dashboardLink = page.locator(
      '[data-testid="sidebar-dashboard"], .sidebar a:has-text("Dashboard"), aside a:has-text("Dashboard")'
    );
    this.myTripsLink = page.locator(
      '[data-testid="sidebar-trips"], .sidebar a:has-text("Trips"), aside a:has-text("Trips")'
    );
    this.myBookingsLink = page.locator(
      '[data-testid="sidebar-bookings"], .sidebar a:has-text("Bookings"), aside a:has-text("Bookings")'
    );
    this.messagesLink = page.locator(
      '[data-testid="sidebar-messages"], .sidebar a:has-text("Messages"), aside a:has-text("Messages")'
    );
    this.favoritesLink = page.locator(
      '[data-testid="sidebar-favorites"], .sidebar a:has-text("Favorites"), aside a:has-text("Wishlist"), aside a:has-text("Saved")'
    );
    this.profileLink = page.locator(
      '[data-testid="sidebar-profile"], .sidebar a:has-text("Profile"), aside a:has-text("Profile")'
    );
    this.settingsLink = page.locator(
      '[data-testid="sidebar-settings"], .sidebar a:has-text("Settings"), aside a:has-text("Settings")'
    );

    // Host nav
    this.hostDashboardLink = page.locator(
      '[data-testid="sidebar-host-dashboard"], .sidebar a:has-text("Dashboard"), aside a:has-text("Overview")'
    );
    this.myListingsLink = page.locator(
      '[data-testid="sidebar-listings"], .sidebar a:has-text("Listings"), aside a:has-text("My Listings"), aside a:has-text("Properties")'
    );
    this.addListingLink = page.locator(
      '[data-testid="sidebar-add-listing"], .sidebar a:has-text("Add Listing"), aside a:has-text("New Listing"), aside a:has-text("Create")'
    );
    this.reservationsLink = page.locator(
      '[data-testid="sidebar-reservations"], .sidebar a:has-text("Reservations"), aside a:has-text("Bookings")'
    );
    this.calendarLink = page.locator(
      '[data-testid="sidebar-calendar"], .sidebar a:has-text("Calendar"), aside a:has-text("Availability")'
    );
    this.earningsLink = page.locator(
      '[data-testid="sidebar-earnings"], .sidebar a:has-text("Earnings"), aside a:has-text("Revenue"), aside a:has-text("Payouts")'
    );
    this.reviewsLink = page.locator(
      '[data-testid="sidebar-reviews"], .sidebar a:has-text("Reviews"), aside a:has-text("Ratings")'
    );
  }

  // ─── Actions ─────────────────────────────────────────────────

  /**
   * Open sidebar (if collapsed or on mobile)
   */
  async open(): Promise<void> {
    try {
      if (await this.toggleBtn.isVisible({ timeout: 2000 })) {
        await this.toggleBtn.click();
        logger.step('Sidebar opened via toggle');
      }
    } catch {
      // Sidebar might already be open
    }
  }

  /**
   * Close sidebar (mobile)
   */
  async close(): Promise<void> {
    try {
      if (await this.overlay.isVisible({ timeout: 2000 })) {
        await this.overlay.click();
        logger.step('Sidebar closed via overlay');
      }
    } catch {
      // No overlay — sidebar might be desktop (always visible)
    }
  }

  // ─── Guest Navigation ────────────────────────────────────────

  async goToDashboard(): Promise<void> {
    logger.step('Sidebar → Dashboard');
    await this.dashboardLink.click();
  }

  async goToTrips(): Promise<void> {
    logger.step('Sidebar → Trips');
    await this.myTripsLink.click();
  }

  async goToBookings(): Promise<void> {
    logger.step('Sidebar → Bookings');
    await this.myBookingsLink.click();
  }

  async goToMessages(): Promise<void> {
    logger.step('Sidebar → Messages');
    await this.messagesLink.click();
  }

  async goToProfile(): Promise<void> {
    logger.step('Sidebar → Profile');
    await this.profileLink.click();
  }

  async goToSettings(): Promise<void> {
    logger.step('Sidebar → Settings');
    await this.settingsLink.click();
  }

  // ─── Host Navigation ─────────────────────────────────────────

  async goToListings(): Promise<void> {
    logger.step('Sidebar → My Listings');
    await this.myListingsLink.click();
  }

  async goToAddListing(): Promise<void> {
    logger.step('Sidebar → Add Listing');
    await this.addListingLink.click();
  }

  async goToReservations(): Promise<void> {
    logger.step('Sidebar → Reservations');
    await this.reservationsLink.click();
  }

  async goToCalendar(): Promise<void> {
    logger.step('Sidebar → Calendar');
    await this.calendarLink.click();
  }

  async goToEarnings(): Promise<void> {
    logger.step('Sidebar → Earnings');
    await this.earningsLink.click();
  }

  // ─── State Checks ────────────────────────────────────────────

  /**
   * Check if sidebar is visible
   */
  async isVisible(): Promise<boolean> {
    try {
      return await this.sidebar.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Get the currently active/selected nav item text
   */
  async getActiveItem(): Promise<string> {
    const active = this.page.locator(
      '.sidebar a[class*="active"], aside a[class*="active"], [data-testid="sidebar"] a[class*="current"]'
    );
    return (await active.textContent()) || '';
  }
}