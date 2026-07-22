import { Page, Locator } from '@playwright/test';
import { logger } from '@utils/logger';

export type NavItemName =
  | 'Dashboard'
  | 'Locataire'
  | 'Biens'
  | 'Réservations'
  | 'Fiche de police'
  | "Livrets d'accueil"
  | 'Messages'
  | 'Collaborateurs'
  | 'Proprietaires'
  | 'Suivi financièrs'
  | 'Mon profil'
  | 'Membres'
  | 'Facture'
  | 'Aide & support';

export class SidebarComponent {
  private page: Page;

  // ─── Sidebar Structure ──────────────────────────────────────
  readonly wrapper: Locator;
  readonly container: Locator;
  readonly inner: Locator;
  readonly content: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly rail: Locator;

  // ─── Toggle ─────────────────────────────────────────────────
  readonly trigger: Locator;
  readonly mobileOverlay: Locator;
  readonly mobileDrawer: Locator;

  // ─── Navigation ─────────────────────────────────────────────
  readonly navMenu: Locator;
  readonly dashboardLink: Locator;
  readonly locataireLink: Locator;
  readonly biensLink: Locator;
  readonly reservationsLink: Locator;
  readonly ficheDePoliceLink: Locator;
  readonly livretsLink: Locator;
  readonly messagesLink: Locator;
  readonly collaborateursLink: Locator;
  readonly proprietairesBtn: Locator;
  readonly suiviFinanciersBtn: Locator;

  // ─── Admin Navigation ───────────────────────────────────────
  readonly monProfilLink: Locator;
  readonly membresLink: Locator;
  readonly factureBtn: Locator;
  readonly aideSupportLink: Locator;

  // ─── User Menu (in sidebar footer) ──────────────────────────
  readonly userTrigger: Locator;
  readonly userDropdown: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly avatarInitials: Locator;
  readonly upgradeItem: Locator;
  readonly accountItem: Locator;
  readonly billingItem: Locator;
  readonly notificationsItem: Locator;
  readonly logoutItem: Locator;

  // ─── Logout Confirmation Dialog ─────────────────────────────
  readonly logoutDialog: Locator;
  readonly logoutDialogTitle: Locator;
  readonly logoutDialogCancel: Locator;
  readonly logoutDialogConfirm: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sidebar structure
    this.wrapper = page.locator('[data-slot="sidebar"]');
    this.container = page.locator('[data-slot="sidebar-container"]');
    this.inner = page.locator('[data-slot="sidebar-inner"]');
    this.content = page.locator('[data-slot="sidebar-content"]');
    this.header = page.locator('[data-slot="sidebar-header"]');
    this.footer = page.locator('[data-slot="sidebar-footer"]');
    this.rail = page.locator('[data-slot="sidebar-rail"]');

    // Toggle — use data-slot (sr-only text gives accessible name, no aria-label attribute)
    this.trigger = page.locator('[data-slot="sidebar-trigger"]');
    this.mobileOverlay = page.locator('[data-vaul-drawer-overlay]');
    this.mobileDrawer = page.locator('[data-vaul-drawer][data-vaul-drawer-direction="left"]');

    // Navigation — enabled items render as <a>, disabled as <button>
    this.navMenu = page.locator('[data-slot="sidebar-menu"]');
    this.dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    this.locataireLink = page.getByRole('link', { name: 'Locataire' });
    this.biensLink = page.getByRole('link', { name: 'Biens' });
    this.reservationsLink = page.getByRole('link', { name: 'Réservations' });
    this.ficheDePoliceLink = page.getByRole('link', { name: 'Fiche de police' });
    this.livretsLink = page.getByRole('link', { name: "Livrets d'accueil" });
    this.messagesLink = page.getByRole('link', { name: 'Messages' });
    this.collaborateursLink = page.getByRole('link', { name: 'Collaborateurs' });
    this.proprietairesBtn = page.getByRole('button', { name: 'Proprietaires' });
    this.suiviFinanciersBtn = page.getByRole('button', { name: 'Suivi financièrs' });

    // Admin navigation
    this.monProfilLink = page.getByRole('link', { name: 'Mon profil' });
    this.membresLink = page.getByRole('link', { name: 'Membres' });
    this.factureBtn = page.getByRole('button', { name: 'Facture' });
    this.aideSupportLink = page.getByRole('link', { name: 'Aide & support' });

    // User menu (in sidebar footer)
    this.userTrigger = this.footer.locator('[data-slot="dropdown-menu-trigger"]');
    this.userDropdown = page.locator('[data-slot="dropdown-menu-content"]');
    this.userName = this.footer.locator('[data-slot="dropdown-menu-trigger"] .truncate.font-medium, [data-slot="dropdown-menu-trigger"] .font-semibold').first();
    this.userEmail = this.footer.locator('[data-slot="dropdown-menu-trigger"] .truncate.text-xs').first();
    this.avatarInitials = this.footer.locator('[data-slot="avatar-fallback"]');
    this.upgradeItem = this.userDropdown.getByRole('menuitem', { name: 'Profil' });
    this.accountItem = this.userDropdown.getByRole('menuitem', { name: 'Profil' });
    this.billingItem = this.userDropdown.getByRole('menuitem', { name: 'Paramètres' });
    this.notificationsItem = this.userDropdown.getByRole('menuitem', { name: 'Notifications' });
    this.logoutItem = this.userDropdown.getByRole('menuitem', { name: 'Déconnexion' });

    // Logout confirmation dialog
    this.logoutDialog = page.locator('[data-slot="alert-dialog-content"]');
    this.logoutDialogTitle = page.locator('[data-slot="alert-dialog-title"]');
    this.logoutDialogCancel = page.locator('[data-slot="alert-dialog-cancel"]');
    this.logoutDialogConfirm = page.locator('[data-slot="alert-dialog-action"]');
  }

  // ─── Toggle Actions ─────────────────────────────────────────

  async toggle(): Promise<void> {
    logger.step('Toggling sidebar');
    await this.trigger.click();
  }

  async expand(): Promise<void> {
    const state = await this.wrapper.getAttribute('data-state');
    if (state === 'collapsed') {
      await this.toggle();
    }
  }

  async collapse(): Promise<void> {
    const state = await this.wrapper.getAttribute('data-state');
    if (state === 'expanded') {
      await this.toggle();
    }
  }

  // ─── Mobile Actions ─────────────────────────────────────────

  async openMobile(): Promise<void> {
    if (await this.trigger.isVisible({ timeout: 2000 })) {
      await this.trigger.click();
      logger.step('Sidebar opened (mobile)');
    }
  }

  async closeMobile(): Promise<void> {
    if (await this.mobileOverlay.isVisible({ timeout: 2000 })) {
      await this.mobileOverlay.click();
      logger.step('Sidebar closed (mobile)');
    }
  }

  // ─── Navigation ─────────────────────────────────────────────

  async goTo(item: NavItemName): Promise<void> {
    logger.step(`Sidebar → ${item}`);
    const link = this.page.getByRole('link', { name: item });
    await link.click();
  }

  async goToDashboard(): Promise<void> { await this.goTo('Dashboard'); }
  async goToLocataire(): Promise<void> { await this.goTo('Locataire'); }
  async goToBiens(): Promise<void> { await this.goTo('Biens'); }
  async goToReservations(): Promise<void> { await this.goTo('Réservations'); }
  async goToMessages(): Promise<void> { await this.goTo('Messages'); }

  // ─── User Menu ──────────────────────────────────────────────

  async openUserMenu(): Promise<void> {
    logger.step('Opening user dropdown');
    await this.userTrigger.click();
  }

  async logout(): Promise<void> {
    logger.step('Logging out via sidebar');
    await this.openUserMenu();
    await this.logoutItem.click();
    await this.logoutDialogConfirm.click();
  }

  async cancelLogout(): Promise<void> {
    logger.step('Cancelling logout');
    await this.openUserMenu();
    await this.logoutItem.click();
    await this.logoutDialogCancel.click();
  }

  // ─── State Checks ───────────────────────────────────────────

  async getState(): Promise<'expanded' | 'collapsed'> {
    return (await this.wrapper.getAttribute('data-state')) as 'expanded' | 'collapsed';
  }

  async isExpanded(): Promise<boolean> {
    return (await this.getState()) === 'expanded';
  }

  async isCollapsed(): Promise<boolean> {
    return (await this.getState()) === 'collapsed';
  }

  async isVisible(): Promise<boolean> {
    try {
      return await this.container.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  async getActiveItem(): Promise<string> {
    const active = this.page.locator('[data-slot="sidebar-menu-button"][data-active="true"]');
    return (await active.textContent()) || '';
  }

  async isItemActive(item: NavItemName): Promise<boolean> {
    const active = this.page.locator('[data-slot="sidebar-menu-button"][data-active="true"]');
    const text = await active.textContent().catch(() => '');
    return text.trim() === item;
  }

  async isItemDisabled(item: NavItemName): Promise<boolean> {
    const btn = this.page.getByRole('button', { name: item });
    return btn.evaluate((el) => el.className.includes('cursor-not-allowed')).catch(() => false);
  }

  async isMobileOpen(): Promise<boolean> {
    return (await this.mobileDrawer.getAttribute('data-state')) === 'open';
  }
}
