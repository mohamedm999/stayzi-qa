import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@utils/logger';

export type PropertyType = 'APARTMENT' | 'VILLA';
export type WizardMode = 'manual' | 'link';

export interface CreatePropertyData {
  name: string;
  type: PropertyType;
  description?: string;
  city: string;
  country: string;
  locationUrl?: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
}

export class PropertiesPage extends BasePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly addPropertyBtn: Locator;

  readonly cardGrid: Locator;
  readonly emptyState: Locator;
  readonly errorState: Locator;
  readonly retryBtn: Locator;

  readonly paginationInfo: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', { name: 'Mes biens' });
    this.subtitle = page.getByText('Gérez vos propriétés et importez vos annonces');
    this.addPropertyBtn = page.getByRole('button', { name: 'Ajouter un bien' });

    this.cardGrid = page.locator('.grid.sm\\:grid-cols-2');
    this.emptyState = page.getByText('Aucun bien pour le moment');
    this.errorState = page.getByText('Impossible de charger les biens');
    this.retryBtn = page.getByRole('button', { name: 'Réessayer' });

    this.paginationInfo = page.locator('span:has-text("bien")');
  }

  async goto(): Promise<void> {
    logger.step('Navigating to properties page');
    await this.page.goto('/concierge/properties', { waitUntil: 'domcontentloaded' });
    await this.wait.forLoadingComplete();
  }

  async clickAddProperty(): Promise<PropertyWizard> {
    logger.step('Clicking Ajouter un bien');
    await this.addPropertyBtn.click();
    const wizard = new PropertyWizard(this.page);
    await wizard.dialog.waitFor({ state: 'visible', timeout: 10000 });
    return wizard;
  }

  async getCardCount(): Promise<number> {
    const cards = this.cardGrid.locator('> a, > div');
    return cards.count();
  }

  async getCardTitle(index: number): Promise<string> {
    const cards = this.cardGrid.locator('> a, > div');
    const title = cards.nth(index).locator('p.font-medium, h3');
    return (await title.textContent()) || '';
  }
}

// ─── Property Wizard (3 steps) ─────────────────────────────────

export class PropertyWizard {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly closeBtn: Locator;

  readonly stepper: Locator;
  readonly stepperItems: Locator;

  readonly step1Panel: Locator;
  readonly step2Panel: Locator;
  readonly step3Panel: Locator;

  readonly prevBtn: Locator;
  readonly nextBtn: Locator;

  constructor(private page: Page) {
    this.dialog = page.getByRole('dialog');
    this.title = this.dialog.locator('[data-slot="drawer-title"]');
    this.closeBtn = this.dialog.getByRole('button', { name: 'Fermer' });

    this.stepper = this.dialog.locator('[data-slot="stepper"]');
    this.stepperItems = this.dialog.locator('[data-slot="stepper-item"]');

    this.step1Panel = this.dialog.locator('[data-slot="stepper-panel"][data-state="1"]');
    this.step2Panel = this.dialog.locator('[data-slot="stepper-panel"][data-state="2"]');
    this.step3Panel = this.dialog.locator('[data-slot="stepper-panel"][data-state="3"]');

    this.prevBtn = this.dialog.getByRole('button', { name: 'Précédent' });
    this.nextBtn = this.dialog.getByRole('button', { name: 'Suivant' });
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async getStepState(step: 1 | 2 | 3): Promise<string> {
    return (await this.stepperItems.nth(step - 1).getAttribute('data-state')) || '';
  }

  // ─── Step 1: Mode Selection ──────────────────────────────────

  async selectMode(mode: WizardMode): Promise<void> {
    logger.step(`Selecting mode: ${mode}`);
    if (mode === 'manual') {
      await this.dialog.getByText('Saisie manuelle').click();
    } else {
      await this.dialog.getByText('Importer depuis un lien').click();
    }
  }

  async nextStep(): Promise<void> {
    logger.step('Clicking Suivant');
    await this.nextBtn.click();
  }

  async prevStep(): Promise<void> {
    logger.step('Clicking Précédent');
    await this.prevBtn.click();
  }

  async isNextEnabled(): Promise<boolean> {
    return this.nextBtn.isEnabled();
  }

  async isPrevEnabled(): Promise<boolean> {
    return this.prevBtn.isEnabled();
  }

  // ─── Step 2: Import Mode ────────────────────────────────────

  async fillImportUrl(url: string): Promise<void> {
    logger.step(`Filling import URL: ${url}`);
    const input = this.step2Panel.locator('input[placeholder*="airbnb"]');
    await input.fill(url);
  }

  async clickImporter(): Promise<void> {
    logger.step('Clicking Importer');
    await this.step2Panel.getByRole('button', { name: 'Importer' }).click();
  }

  // ─── Step 2: Manual Form ────────────────────────────────────

  async fillForm(data: CreatePropertyData): Promise<void> {
    logger.step(`Filling property form: ${data.name}`);
    await this.dialog.locator('#name').fill(data.name);
    await this.selectType(data.type);
    if (data.description) {
      await this.dialog.locator('#description').fill(data.description);
    }
    await this.dialog.locator('#city').fill(data.city);
    await this.dialog.locator('#country').fill(data.country);
    if (data.locationUrl) {
      await this.dialog.locator('#locationUrl').fill(data.locationUrl);
    }
    await this.setMaxGuests(data.maxGuests);
    await this.dialog.locator('#bedrooms').fill(String(data.bedrooms));
    await this.dialog.locator('#bathrooms').fill(String(data.bathrooms));
    await this.dialog.locator('#price').fill(String(data.price));
  }

  async selectType(type: PropertyType): Promise<void> {
    logger.step(`Selecting property type: ${type}`);
    await this.dialog.getByRole('radio', { name: type }).click();
  }

  async setMaxGuests(count: number): Promise<void> {
    const input = this.dialog.locator('#maxGuests');
    await input.click();
    await input.fill('');
    await input.fill(String(count));
  }

  async incrementGuests(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Augmenter' }).click();
  }

  async decrementGuests(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Diminuer' }).click();
  }

  async getMaxGuests(): Promise<number> {
    const val = await this.dialog.locator('#maxGuests').inputValue();
    return parseInt(val, 10) || 0;
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

  async submitForm(): Promise<void> {
    logger.step('Submitting property form');
    await this.dialog.getByRole('button', { name: 'Enregistrer le bien' }).click();
  }

  // ─── Step 3: Success ─────────────────────────────────────────

  async getSuccessMessage(): Promise<string> {
    const msg = this.step3Panel.getByText('Bien ajouté avec succès');
    return (await msg.textContent()) || '';
  }

  async clickFermer(): Promise<void> {
    logger.step('Closing wizard');
    await this.step3Panel.getByRole('button', { name: 'Fermer' }).click();
  }
}
