import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@utils/logger';

// ─── Types ──────────────────────────────────────────────────

export type StayStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type FicheStatus = 'COMPLETED' | 'PENDING' | 'REJECTED' | 'NO_FORM';
export type DocumentType = 'PASSPORT' | 'NATIONAL_ID';

export interface PoliceFormRowData {
  client: string;
  phone: string;
  guestCount: string;
  stayStatus: string;
  ficheStatus: string;
  document: string;
  lienFiche: string;
}

// ─── Status Maps ────────────────────────────────────────────

export const STAY_STATUS_LABELS: Record<StayStatus, string> = {
  UPCOMING: 'À venir',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const FICHE_STATUS_LABELS: Record<FicheStatus, string> = {
  COMPLETED: 'Soumise',
  PENDING: 'En attente',
  REJECTED: 'Rejetée',
  NO_FORM: 'Non générée',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  PASSPORT: 'Passeport',
  NATIONAL_ID: 'Carte Nationale',
};

// ─── PoliceFormsPage ────────────────────────────────────────

export class PoliceFormsPage extends BasePage {
  // Header
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly refreshBtn: Locator;

  // Summary cards
  readonly totalCard: Locator;
  readonly pendingCard: Locator;
  readonly submittedCard: Locator;
  readonly noFormCard: Locator;

  // Charts
  readonly submissionRateCard: Locator;
  readonly distributionCard: Locator;

  // Search
  readonly searchInput: Locator;

  // Filters
  readonly filtersBtn: Locator;
  readonly filterPopover: Locator;
  readonly stayStatusSelect: Locator;
  readonly ficheStatusSelect: Locator;
  readonly resetFiltersBtn: Locator;

  // Active filters bar
  readonly activeFiltersText: Locator;
  readonly resetInlineBtn: Locator;

  // Table
  readonly tableEl: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;

  // Pagination
  readonly pageInfo: Locator;
  readonly prevPageBtn: Locator;
  readonly nextPageBtn: Locator;

  // Error state
  readonly errorBanner: Locator;
  readonly errorTitle: Locator;
  readonly retryBtn: Locator;

  // Empty states
  readonly emptyNoData: Locator;
  readonly emptyFiltered: Locator;
  readonly clearFiltersBtn: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.heading = page.locator('h1');
    this.subtitle = page.locator('h1 + p, h1').locator('~ p').first();
    this.refreshBtn = page.getByRole('button', { name: 'Actualiser' });

    // Summary labels are paragraphs inside card containers; using their parent avoids matching chart text.
    this.totalCard = page.locator('p').filter({ hasText: /^Total$/ }).locator('..');
    this.pendingCard = page.locator('p').filter({ hasText: /^En attente$/ }).locator('..');
    this.submittedCard = page.locator('p').filter({ hasText: /^Soumises$/ }).locator('..');
    this.noFormCard = page.locator('p').filter({ hasText: /^Non générées$/ }).locator('..');

    // Charts
    this.submissionRateCard = page.getByText('Taux de soumission');
    this.distributionCard = page.getByText('Répartition des fiches');

    // Search
    this.searchInput = page.getByPlaceholder('Rechercher un invité, téléphone, ID…');

    // Filters
    this.filtersBtn = page.getByRole('button', { name: /Filtres/ });
    this.filterPopover = page.locator('[data-slot="popover-content"]');
    this.stayStatusSelect = this.filterPopover.locator('[role="combobox"]').first();
    this.ficheStatusSelect = this.filterPopover.locator('[role="combobox"]').nth(1);
    this.resetFiltersBtn = this.filterPopover.getByRole('button', { name: 'Réinitialiser les filtres' });

    // Active filters bar — shows "X résultat(s) sur Y"
    this.activeFiltersText = page.getByText(/\d+ résultat/).first();
    this.resetInlineBtn = page.getByRole('button', { name: 'Réinitialiser' }).first();

    // Table
    this.tableEl = page.locator('table');
    this.tableHeaders = this.tableEl.locator('thead th');
    this.tableRows = this.tableEl.locator('tbody tr');

    // Pagination — "Page X sur Y" text + prev/next buttons in same parent container
    this.pageInfo = page.locator('span').filter({ hasText: /Page \d+ sur \d+/ });
    const paginationParent = this.pageInfo.locator('../..');
    this.prevPageBtn = paginationParent.locator('button').first();
    this.nextPageBtn = paginationParent.locator('button').last();

    // Error state
    this.errorBanner = page.locator('div').filter({ hasText: 'Erreur de chargement' }).first();
    this.errorTitle = page.getByText('Erreur de chargement');
    this.retryBtn = page.getByRole('button', { name: 'Réessayer' });

    // Empty states
    this.emptyNoData = page.getByText('Aucune fiche de police pour le moment.');
    this.emptyFiltered = page.getByText('Aucune fiche ne correspond à vos filtres.');
    this.clearFiltersBtn = page.getByRole('button', { name: 'Effacer les filtres' });
  }

  // ─── Navigation ────────────────────────────────────────────

  async goto(): Promise<void> {
    logger.step('Navigating to police forms page');
    await this.page.goto('/concierge/police-forms', { waitUntil: 'domcontentloaded' });
    await this.page.waitForURL('**/concierge/police-forms', { timeout: 15000 });
    await this.tableEl.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      logger.info('Police forms table not visible, proceeding anyway (may be empty or different UI)');
    });
    await this.page.locator('table tbody tr td').first().filter({ hasText: /\S/ }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  // ─── Summary Cards ─────────────────────────────────────────

getStatValue(card: Locator): Locator {
    return card.locator('*').filter({ hasText: /\d+/ }).first().or(card.locator('..').locator('*').filter({ hasText: /\d+/ }).first());
  }

  // ─── Table ─────────────────────────────────────────────────

  async getHeaderCount(): Promise<number> {
    return this.tableHeaders.count();
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getRowData(index: number): Promise<PoliceFormRowData | null> {
    const count = await this.tableRows.count();
    if (index >= count) return null;

    const row = this.tableRows.nth(index);
    const cells = row.locator('td');
    const cellCount = await cells.count();
    if (cellCount < 7) return null;

    return {
      client: ((await cells.nth(0).textContent()) || '').trim(),
      phone: ((await cells.nth(0).locator('div').last().textContent()) || '').trim(),
      guestCount: ((await cells.nth(1).textContent()) || '').trim(),
      stayStatus: ((await cells.nth(2).textContent()) || '').trim(),
      ficheStatus: ((await cells.nth(3).textContent()) || '').trim(),
      document: ((await cells.nth(4).textContent()) || '').trim(),
      lienFiche: ((await cells.nth(5).textContent()) || '').trim(),
    };
  }

  async getRowActions(index: number): Promise<{ download: Locator; externalLink: Locator }> {
    const row = this.tableRows.nth(index);
    const actionsCell = row.locator('td').last();
    const buttons = actionsCell.locator('button');
    return {
      download: buttons.first(),
      externalLink: buttons.nth(1),
    };
  }

  async getActionButtonCount(index: number): Promise<number> {
    const row = this.tableRows.nth(index);
    const actionsCell = row.locator('td').last();
    return actionsCell.locator('button').count();
  }

  // ─── Search ────────────────────────────────────────────────

  async searchGuest(name: string): Promise<void> {
    logger.step(`Searching for guest: ${name}`);
    await this.searchInput.fill(name);
  }

  // ─── Filters ───────────────────────────────────────────────

  async openFilters(): Promise<void> {
    logger.step('Opening filters popover');
    await this.filtersBtn.click();
    await this.filterPopover.waitFor({ state: 'visible', timeout: 3000 });
  }

  async selectStayStatusFilter(status: string): Promise<void> {
    logger.step(`Selecting stay status filter: ${status}`);
    await this.stayStatusSelect.click();
    const option = this.page.locator('[data-slot="select-content"]').getByRole('option', { name: new RegExp(status, 'i') });
    await option.click();
  }

  async selectFicheStatusFilter(status: string): Promise<void> {
    logger.step(`Selecting fiche status filter: ${status}`);
    await this.ficheStatusSelect.click();
    const option = this.page.locator('[data-slot="select-content"]').getByRole('option', { name: new RegExp(status, 'i') });
    await option.click();
  }

  async resetFilters(): Promise<void> {
    logger.step('Resetting filters');
    await this.resetFiltersBtn.click();
  }

  // ─── Pagination ────────────────────────────────────────────

  async getPageInfo(): Promise<string> {
    return (await this.pageInfo.textContent()) || '';
  }

  // ─── Document Preview ──────────────────────────────────────

  async openDocumentPreview(index: number): Promise<void> {
    logger.step(`Opening document preview for row ${index}`);
    const row = this.tableRows.nth(index);
    const docCell = row.locator('td').nth(4);
    await docCell.getByRole('button').click();
  }

}

// ─── DocumentPreviewDialog ──────────────────────────────────

export class DocumentPreviewDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly frontLabel: Locator;
  readonly backLabel: Locator;
  readonly image: Locator;
  readonly closeBtn: Locator;

  constructor(private page: Page) {
    this.dialog = page.locator('[data-slot="dialog-content"]');
    this.title = this.dialog.locator('h2, [data-slot="dialog-title"]');
    this.frontLabel = this.dialog.getByText('Recto');
    this.backLabel = this.dialog.getByText('Verso');
    this.image = this.dialog.locator('img[alt="Document d\'identité"]');
    this.closeBtn = this.dialog.getByRole('button', { name: 'Fermer' }).or(
      this.dialog.locator('[data-slot="dialog-close"]')
    );
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    logger.step('Closing document preview dialog');
    await this.closeBtn.click();
  }
}

// ─── ConfirmActionDialog ────────────────────────────────────

export class ConfirmActionDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly cancelBtn: Locator;
  readonly confirmBtn: Locator;

  constructor(private page: Page) {
    this.dialog = page.locator('[data-slot="alert-dialog-content"]');
    this.title = this.dialog.getByText("Confirmer l'action");
    this.description = this.dialog.locator('[data-slot="alert-dialog-description"], .text-sm.text-muted-foreground');
    this.cancelBtn = this.dialog.getByRole('button', { name: 'Annuler' });
    this.confirmBtn = this.dialog.locator('[data-slot="alert-dialog-action"]');
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  async confirm(): Promise<void> {
    logger.step('Confirming action in dialog');
    await this.confirmBtn.click();
  }

  async cancel(): Promise<void> {
    logger.step('Cancelling action dialog');
    await this.cancelBtn.click();
  }

  async getDescription(): Promise<string> {
    return (await this.description.textContent()) || '';
  }
}
