import { test, expect } from '@fixtures/test.fixture';

test.describe('Sidebar Navigation', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ sidebar }) => {
    await sidebar.page.goto('/concierge/dashboard');
    await sidebar.page.waitForLoadState('domcontentloaded');
    await expect(sidebar.dashboardLink).toBeVisible();
  });

  test('@smoke should display all 14 nav items', async ({ sidebar }) => {
    // Main nav items (10)
    await expect(sidebar.dashboardLink).toBeVisible();
    await expect(sidebar.locataireLink).toBeVisible();
    await expect(sidebar.biensLink).toBeVisible();
    await expect(sidebar.reservationsLink).toBeVisible();
    await expect(sidebar.ficheDePoliceLink).toBeVisible();
    await expect(sidebar.livretsLink).toBeVisible();
    await expect(sidebar.messagesLink).toBeVisible();
    await expect(sidebar.collaborateursLink).toBeVisible();
    await expect(sidebar.proprietairesBtn).toBeVisible();
    await expect(sidebar.suiviFinanciersBtn).toBeVisible();
    // Admin nav items (4)
    await expect(sidebar.monProfilLink).toBeVisible();
    await expect(sidebar.membresLink).toBeVisible();
    await expect(sidebar.factureBtn).toBeVisible();
    await expect(sidebar.aideSupportLink).toBeVisible();
  });

  test('@smoke should highlight active nav item based on current route', async ({ sidebar }) => {
    expect(await sidebar.getActiveItem()).toContain('Dashboard');
    expect(await sidebar.isItemActive('Dashboard')).toBe(true);
  });

  test('@smoke should navigate to Locataire page via sidebar', async ({ sidebar, page }) => {
    await sidebar.goToLocataire();
    await expect(page).toHaveURL(/\/concierge\/clients/);
    expect(await sidebar.isItemActive('Locataire')).toBe(true);
  });

  test('@smoke should navigate to Biens page via sidebar', async ({ sidebar, page }) => {
    await sidebar.goToBiens();
    await expect(page).toHaveURL(/\/concierge\/properties/);
  });

  test('@smoke should navigate to Réservations page via sidebar', async ({ sidebar, page }) => {
    await sidebar.goToReservations();
    await expect(page).toHaveURL(/\/concierge\/bookings/);
  });

  test('@regression disabled nav items should not be clickable links', async ({ sidebar }) => {
    await expect(sidebar.proprietairesBtn).toHaveClass(/cursor-not-allowed/);
    await expect(sidebar.suiviFinanciersBtn).toHaveClass(/cursor-not-allowed/);
    await expect(sidebar.factureBtn).toHaveClass(/cursor-not-allowed/);
  });

  test('@regression should collapse sidebar via trigger', async ({ sidebar }) => {
    expect(await sidebar.isExpanded()).toBe(true);
    await sidebar.toggle();
    expect(await sidebar.isCollapsed()).toBe(true);
  });

  test('@regression should expand sidebar after collapsing', async ({ sidebar }) => {
    await sidebar.collapse();
    expect(await sidebar.isCollapsed()).toBe(true);
    await sidebar.expand();
    expect(await sidebar.isExpanded()).toBe(true);
  });

  test('@regression should collapse/expand via Ctrl+B', async ({ sidebar, page }) => {
    await page.keyboard.press('Control+b');
    expect(await sidebar.isCollapsed()).toBe(true);
    await page.keyboard.press('Control+b');
    expect(await sidebar.isExpanded()).toBe(true);
  });
});

test.describe('Header', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ header }) => {
    await header.page.goto('/concierge/dashboard');
    await header.page.waitForLoadState('domcontentloaded');
    await expect(header.sidebarTrigger).toBeVisible();
  });

  test('@smoke should render sticky header with sidebar trigger', async ({ header }) => {
    await expect(header.header).toBeVisible();
    expect(await header.isSticky()).toBe(true);
    await expect(header.sidebarTrigger).toBeVisible();
  });

  test('@smoke sidebar trigger should have accessible name', async ({ header }) => {
    await expect(header.sidebarTrigger).toHaveAccessibleName('Toggle Sidebar');
  });

  test('@regression sidebar trigger should toggle sidebar', async ({ header, sidebar }) => {
    expect(await sidebar.isExpanded()).toBe(true);
    await header.toggleSidebar();
    expect(await sidebar.isCollapsed()).toBe(true);
    await header.toggleSidebar();
    expect(await sidebar.isExpanded()).toBe(true);
  });
});

test.describe('NavUser (User Menu)', () => {
  test.use({ storageState: '.auth/user.json' });

  test.beforeEach(async ({ sidebar }) => {
    await sidebar.page.goto('/concierge/dashboard');
    await sidebar.page.waitForLoadState('domcontentloaded');
    await expect(sidebar.dashboardLink).toBeVisible();
  });

  test('@smoke should display user name and email in sidebar footer', async ({ sidebar }) => {
    await expect(sidebar.userName).toBeVisible();
    await expect(sidebar.userEmail).toBeVisible();
  });

  test('@smoke should display avatar with user initials', async ({ sidebar }) => {
    await expect(sidebar.avatarInitials).toBeVisible();
    const initials = await sidebar.avatarInitials.textContent();
    expect(initials?.length).toBeGreaterThanOrEqual(1);
  });

  test('@smoke should open user dropdown menu', async ({ sidebar }) => {
    await sidebar.openUserMenu();
    await expect(sidebar.userDropdown).toBeVisible();
    await expect(sidebar.accountItem).toBeVisible();
    await expect(sidebar.billingItem).toBeVisible();
    await expect(sidebar.notificationsItem).toBeVisible();
    await expect(sidebar.logoutItem).toBeVisible();
  });

  test('@regression should show logout confirmation dialog', async ({ sidebar }) => {
    await sidebar.openUserMenu();
    await sidebar.logoutItem.click();
    await expect(sidebar.logoutDialog).toBeVisible();
    await expect(sidebar.logoutDialogTitle).toHaveText('Confirmer la déconnexion ?');
    await expect(sidebar.logoutDialogCancel).toHaveText('Annuler');
    await expect(sidebar.logoutDialogConfirm).toHaveText('Oui, déconnecter');
  });

  test('@regression should cancel logout and stay on page', async ({ sidebar, page }) => {
    await sidebar.openUserMenu();
    await sidebar.logoutItem.click();
    await sidebar.logoutDialogCancel.click();
    await expect(sidebar.logoutDialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/concierge\/dashboard/);
  });
});
