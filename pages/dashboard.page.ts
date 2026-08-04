import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@lib/logger';
import { CreateBookingDrawer, NoPropertyDialog } from './bookings.page';
import { CreatePropertyData, PropertyWizard } from './properties.page';

type Period = '1 mois' | '3 mois' | '6 mois' | '1 an';

type RowData = {
  client: string;
  phone: string;
  checkin: string;
  checkout: string;
  persons: string;
  status: string;
  fichePolice: string;
  amount: string;
};

export class DashboardPage extends BasePage {
  readonly kpiOccupation: Locator;
  readonly kpiRevenus: Locator;
  readonly kpiCheckins: Locator;
  readonly kpiATraiter: Locator;

  readonly addPropertyBtn: Locator;
  readonly createReservationBtn: Locator;
  readonly activityBtn: Locator;

  readonly chartSection: Locator;
  readonly chartTitle: Locator;
  readonly chartDescription: Locator;
  readonly period1mois: Locator;
  readonly period3mois: Locator;
  readonly period6mois: Locator;
  readonly period1an: Locator;

  readonly tableTitle: Locator;
  readonly table: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly reservationCount: Locator;



  constructor(page: Page) {
    super(page);

    this.kpiOccupation = page.getByText('Occupation');
    this.kpiRevenus = page.getByText('Revenus (mois)');
    this.kpiCheckins = page.getByText('Check-ins 7j');
    this.kpiATraiter = page.getByText('À traiter');

    this.addPropertyBtn = page.getByRole('button', { name: /Ajouter un bien/i });
    this.createReservationBtn = page.getByRole('button', { name: /Créer réservation|Nouvelle réservation/i });

    // Opens the "Aujourd'hui" (today's activity / pending tasks) slide-over.
    this.activityBtn = page.getByRole('button', { name: "Ouvrir l'activité du jour" });

    this.chartSection = page.getByText('Réservations par mois').locator('..');
    this.chartTitle = page.getByText('Réservations par mois');
    this.chartDescription = page.getByText(/Évolution sur les/i);
    this.period1mois = page.getByRole('button', { name: '1 mois' });
    this.period3mois = page.getByRole('button', { name: '3 mois' });
    this.period6mois = page.getByRole('button', { name: '6 mois' });
    this.period1an = page.getByRole('button', { name: '1 an' });

    this.tableTitle = page.getByRole('heading', { name: 'Réservations', exact: true });
    this.table = page.locator('table');
    this.tableHeaders = page.locator('table th');
    this.tableRows = page.locator('tbody tr');
    this.reservationCount = page.getByText(/\d+\s*réservation/);


  }

  async gotoDashboard(): Promise<void> {
    logger.step('Navigating to dashboard');
    await this.page.goto('/concierge/dashboard', { waitUntil: 'domcontentloaded' });
    await this.kpiOccupation.waitFor({ state: 'visible', timeout: 10000 });
  }

  async getKpiValue(kpi: 'occupation' | 'revenus' | 'checkins' | 'a-traiter'): Promise<string> {
    const labelMap: Record<string, Locator> = {
      'occupation': this.kpiOccupation,
      'revenus': this.kpiRevenus,
      'checkins': this.kpiCheckins,
      'a-traiter': this.kpiATraiter,
    };
    const label = labelMap[kpi];
    const card = label.locator('..').locator('..');
    const value = card.locator('.text-2xl.font-bold');
    return (await value.textContent()) || '';
  }

  async clickAddProperty(): Promise<void> {
    logger.step('Clicking Ajouter un bien');
    await this.addPropertyBtn.click();
  }

  async clickCreateReservation(): Promise<void> {
    logger.step('Clicking Créer réservation');
    await this.createReservationBtn.click();
  }

  /**
   * Get the "New Reservation" wizard drawer opened from the dashboard header.
   * Call clickCreateReservation() first.
   */
  getCreateReservationDrawer(): CreateBookingDrawer {
    return new CreateBookingDrawer(this.page);
  }

  /**
   * Open the "Add Property" wizard from the dashboard header and wait for it.
   */
  async openPropertyWizard(): Promise<PropertyWizard> {
    await this.clickAddProperty();
    const wizard = new PropertyWizard(this.page);
    await wizard.dialog.waitFor({ state: 'visible', timeout: 10000 });
    return wizard;
  }

  /**
   * Get the "no property available" alert shown when a guest has no properties.
   */
  getNoPropertyDialog(): NoPropertyDialog {
    return new NoPropertyDialog(this.page);
  }

  /**
   * Create a property end-to-end via the manual wizard and return whether
   * the success screen was reached. The wizard is closed on success.
   * Pass `photoPath` to also upload an image before submitting.
   */
  async createProperty(data: CreatePropertyData, photoPath?: string): Promise<boolean> {
    logger.step(`Creating property: ${data.name}`);
    const wizard = await this.openPropertyWizard();
    await wizard.selectMode('manual');
    await wizard.nextStep();
    await wizard.fillForm(data);
    if (photoPath) {
      await wizard.uploadPhotos(photoPath);
    }
    await wizard.submitForm();

    const success = await wizard.dialog
      .getByText('Bien ajouté avec succès !')
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (success) {
      logger.success(`Property created: ${data.name}`);
      await wizard.clickFermer();
    }
    return success;
  }

  /**
   * Open the "À traiter" (today's activity / pending tasks) slide-over.
   * The KPI card itself is not interactive; it is opened via the
   * "Ouvrir l'activité du jour" button next to the header actions.
   */
  async openTodayActivity(): Promise<ActivityDrawer> {
    logger.step('Opening today activity slide-over');
    await this.activityBtn.click();
    const drawer = new ActivityDrawer(this.page);
    await drawer.drawer.waitFor({ state: 'visible', timeout: 5000 });
    return drawer;
  }

  async selectPeriod(period: Period): Promise<void> {
    logger.step(`Selecting chart period: ${period}`);
    switch (period) {
      case '1 mois': await this.period1mois.click(); break;
      case '3 mois': await this.period3mois.click(); break;
      case '6 mois': await this.period6mois.click(); break;
      case '1 an': await this.period1an.click(); break;
    }
  }

  async getReservationCount(): Promise<string> {
    return (await this.reservationCount.textContent()) || '';
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getRowData(index: number): Promise<RowData | null> {
    const rows = this.tableRows;
    const count = await rows.count();
    if (index >= count) return null;

    const cells = rows.nth(index).locator('td');
    const cellCount = await cells.count();
    if (cellCount < 8) return null;

    const client = ((await cells.nth(0).textContent()) || '').trim();
    if (!client && (await cells.nth(1).textContent())?.trim() === '') return null;

    return {
      client,
      phone: ((await cells.nth(1).textContent()) || '').trim(),
      checkin: ((await cells.nth(2).textContent()) || '').trim(),
      checkout: ((await cells.nth(3).textContent()) || '').trim(),
      persons: ((await cells.nth(4).textContent()) || '').trim(),
      status: ((await cells.nth(5).textContent()) || '').trim(),
      fichePolice: ((await cells.nth(6).textContent()) || '').trim(),
      amount: ((await cells.nth(7).textContent()) || '').trim(),
    };
  }

  async getVisibleRowCount(): Promise<number> {
    const rows = this.tableRows;
    const count = await rows.count();
    let visible = 0;
    for (let i = 0; i < count; i++) {
      if (await rows.nth(i).isVisible()) visible++;
    }
    return visible;
  }

  async getRowStatus(index: number): Promise<string> {
    const data = await this.getRowData(index);
    return data?.status || '';
  }

  async getHeaderTexts(): Promise<string[]> {
    return this.tableHeaders.allTextContents();
  }
}

// ─── Today's Activity Slide-over (Aujourd'hui / À traiter) ─────────

export class ActivityDrawer {
  readonly drawer: Locator;
  readonly title: Locator;
  readonly badge: Locator;
  readonly closeBtn: Locator;

  readonly checkinsSection: Locator;
  readonly alertesSection: Locator;
  readonly checkoutsSection: Locator;

  readonly items: Locator;

  constructor(private page: Page) {
    // Right-side vaul drawer opened via "Ouvrir l'activité du jour".
    // Filtered on the "Aujourd'hui" title so it does not collide with the
    // booking/clients drawers (which also render as right-side vaul drawers).
    this.drawer = page
      .locator('[data-vaul-drawer-direction="right"]')
      .filter({ hasText: "Aujourd'hui" })
      .last();

    this.title = this.drawer.locator('[data-slot="drawer-title"]');
    this.badge = this.drawer.locator('[data-slot="badge"]');
    this.closeBtn = this.drawer.getByRole('button', { name: 'Fermer' });

    this.checkinsSection = this.drawer.getByText(/Check-ins/);
    this.alertesSection = this.drawer.getByText('Alertes');
    this.checkoutsSection = this.drawer.getByText(/Check-outs/);

    // Each pending task renders as a bordered card inside a section.
    this.items = this.drawer.locator('div.rounded-lg.border.bg-card');
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.drawer.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Number of activity cards rendered across all sections.
   */
  async getItemCount(): Promise<number> {
    return this.items.count();
  }

  /**
   * Text of every activity card (e.g. "14:00 Riad Azura Marc-Antoine Girard").
   */
  async getItemTitles(): Promise<string[]> {
    return this.items.allTextContents();
  }

  async close(): Promise<void> {
    logger.step('Closing today activity slide-over');
    await this.closeBtn.click();
  }
}
