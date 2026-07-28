import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@lib/logger';

export type Language = 'fr' | 'en' | 'ar';

export interface CreateClientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality?: string;
  preferredLanguage?: Language;
  notes?: string;
}

export interface ClientRowData {
  client: string;
  contact: string;
  nationalite: string;
  langue: string;
  ajouteLe: string;
}

export class ClientsPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly nouveauClientBtn: Locator;

  readonly table: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly tableContainer: Locator;

  readonly emptyState: Locator;
  readonly errorState: Locator;
  readonly retryBtn: Locator;

  readonly paginationInfo: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;
  readonly paginationPages: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: 'Locataires', level: 1 });
    this.subtitle = page.getByText('Gérez votre base de locataires et leurs préférences.');
    this.nouveauClientBtn = page.getByRole('button', { name: 'Nouveau client' });

    this.tableContainer = page.locator('.rounded-xl.border').locator('..');
    this.table = page.getByRole('table');
    this.tableHeaders = page.locator('table thead th');
    this.tableRows = page.locator('tbody tr');

    this.emptyState = page.getByText('Aucun client pour le moment');
    this.errorState = page.getByText('Impossible de charger les clients');
    this.retryBtn = page.getByRole('button', { name: 'Réessayer' });

    this.paginationInfo = page.locator('span:has-text("client")');
    this.paginationPrev = page.locator('button:has(svg.lucide-chevron-left)');
    this.paginationNext = page.locator('button:has(svg.lucide-chevron-right)');
    this.paginationPages = page.locator('button.w-9');
  }

  async goto(): Promise<void> {
    logger.step('Navigating to clients page');
    await this.page.goto('/concierge/clients', { waitUntil: 'domcontentloaded' });
    await this.heading.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getHeaderTexts(): Promise<string[]> {
    return this.tableHeaders.allTextContents();
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getRowData(index: number): Promise<ClientRowData | null> {
    const rows = this.tableRows;
    const count = await rows.count();
    if (index >= count) return null;

    const cells = rows.nth(index).locator('td');
    const cellCount = await cells.count();
    if (cellCount < 6) return null;

    const clientText = ((await cells.nth(0).textContent()) || '').trim();
    if (!clientText) return null;

    return {
      client: clientText,
      contact: ((await cells.nth(1).textContent()) || '').trim(),
      nationalite: ((await cells.nth(2).textContent()) || '').trim(),
      langue: ((await cells.nth(3).textContent()) || '').trim(),
      ajouteLe: ((await cells.nth(4).textContent()) || '').trim(),
    };
  }

  async getActionButtons(rowIndex: number): Promise<{ view: Locator; edit: Locator; delete: Locator }> {
    const row = this.tableRows.nth(rowIndex);
    return {
      view: row.getByRole('button', { name: 'Voir les détails' }),
      edit: row.getByRole('button', { name: 'Modifier' }),
      delete: row.getByRole('button', { name: 'Supprimer' }),
    };
  }

  async clickNouveauClient(): Promise<void> {
    logger.step('Clicking Nouveau client');
    await this.nouveauClientBtn.click();
  }

  async getCreateDrawer(): Promise<CreateDrawer> {
    return new CreateDrawer(this.page);
  }

  async getViewDrawer(): Promise<ViewDrawer> {
    return new ViewDrawer(this.page);
  }

  async getDeleteDialog(): Promise<DeleteDialog> {
    return new DeleteDialog(this.page);
  }
}

// ─── Create Drawer (Nouveau client) ────────────────────────────

export class CreateDrawer {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly closeBtn: Locator;

  readonly form: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly nationalityInput: Locator;
  readonly languageTrigger: Locator;
  readonly notesTextarea: Locator;

  readonly annulerBtn: Locator;
  readonly enregistrerBtn: Locator;

  constructor(private page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Nouveau client' });
    this.title = this.dialog.locator('[data-slot="drawer-title"]');
    this.closeBtn = this.dialog.getByRole('button', { name: 'Fermer' });

    this.form = this.dialog.locator('form');
    this.firstNameInput = this.dialog.locator('#firstName');
    this.lastNameInput = this.dialog.locator('#lastName');
    this.emailInput = this.dialog.locator('#email');
    this.phoneInput = this.dialog.locator('#phone');
    this.nationalityInput = this.dialog.locator('#nationality');
    this.languageTrigger = this.dialog.locator('#preferredLanguage');
    this.notesTextarea = this.dialog.locator('#notes');

    this.annulerBtn = this.dialog.getByRole('button', { name: 'Annuler' });
    this.enregistrerBtn = this.dialog.getByRole('button', { name: 'Enregistrer' });
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async fill(data: CreateClientData): Promise<void> {
    logger.step(`Filling create client form: ${data.firstName} ${data.lastName}`);
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    if (data.nationality) {
      await this.nationalityInput.fill(data.nationality);
    }
    if (data.preferredLanguage) {
      await this.selectLanguage(data.preferredLanguage);
    }
    if (data.notes) {
      await this.notesTextarea.fill(data.notes);
    }
  }

  async selectLanguage(lang: Language): Promise<void> {
    logger.step(`Selecting language: ${lang}`);
    await this.languageTrigger.click();
    const option = this.page.getByRole('option');
    const labels: Record<Language, string> = { fr: 'Français', en: 'English', ar: 'العربية' };
    await this.page.getByRole('option', { name: labels[lang] }).click();
  }

  async submit(): Promise<void> {
    logger.step('Submitting create client form');
    await this.enregistrerBtn.click();
  }

  async cancel(): Promise<void> {
    logger.step('Cancelling create client form');
    await this.annulerBtn.click();
  }

  async getFieldError(field: string): Promise<string> {
    const input = this.dialog.locator(`#${field}`);
    const fieldWrapper = input.locator('..');
    const error = fieldWrapper.locator('[data-slot="field-error"]');
    try {
      return (await error.textContent()) || '';
    } catch {
      return '';
    }
  }
}

// ─── View Drawer (Eye button) ─────────────────────────────────

export class ViewDrawer {
  readonly container: Locator;
  readonly title: Locator;
  readonly closeBtn: Locator;

  readonly emailLink: Locator;
  readonly phoneLink: Locator;

  readonly coordonneesSection: Locator;

  constructor(private page: Page) {
    this.container = page.locator('[data-vaul-drawer-direction="right"]');
    this.title = this.container.locator('[data-slot="drawer-title"]');
    this.closeBtn = this.container.getByRole('button', { name: 'Fermer' });

    this.emailLink = this.container.locator('a[href^="mailto:"]');
    this.phoneLink = this.container.locator('a[href^="tel:"]');
    this.coordonneesSection = this.container.getByText('Coordonnées');
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.container.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    logger.step('Closing view drawer');
    await this.closeBtn.click();
  }

  async getEmail(): Promise<string> {
    return (await this.emailLink.textContent()) || '';
  }

  async getPhone(): Promise<string> {
    return (await this.phoneLink.textContent()) || '';
  }

  async getFieldValue(label: string): Promise<string> {
    const value = this.container.locator(`//span[text()='${label}']/following-sibling::span`);
    try {
      return (await value.textContent()) || '';
    } catch {
      return '';
    }
  }
}

// ─── Delete Dialog (Trash button) ──────────────────────────────

export class DeleteDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly annulerBtn: Locator;
  readonly confirmerBtn: Locator;

  constructor(private page: Page) {
    this.dialog = page.getByRole('dialog');
    this.title = this.dialog.locator('[data-slot="dialog-title"]');
    this.annulerBtn = this.dialog.getByRole('button', { name: 'Annuler' });
    this.confirmerBtn = this.dialog.getByRole('button', { name: 'Confirmer' });
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async confirm(): Promise<void> {
    logger.step('Confirming deletion');
    await this.confirmerBtn.click();
  }

  async cancel(): Promise<void> {
    logger.step('Cancelling deletion');
    await this.annulerBtn.click();
  }
}
