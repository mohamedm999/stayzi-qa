import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@utils/logger';

type Period = '1 mois' | '3 mois' | '6 mois' | '1 an';

type RowData = {
  client: string;
  phone: string;
  checkin: string;
  checkout: string;
  persons: string;
  status: string;
  createdAt: string;
};

export class DashboardPage extends BasePage {
  readonly kpiClientsValue: Locator;
  readonly kpiReservationsValue: Locator;
  readonly kpiBiensValue: Locator;

  readonly addPropertyBtn: Locator;
  readonly createReservationBtn: Locator;

  readonly chartSection: Locator;
  readonly chartTitle: Locator;
  readonly period1mois: Locator;
  readonly period3mois: Locator;
  readonly period6mois: Locator;
  readonly period1an: Locator;

  readonly tableTitle: Locator;
  readonly table: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly reservationCount: Locator;

  readonly emptyChartState: Locator;

  constructor(page: Page) {
    super(page);

    this.kpiClientsValue = page.locator('.font-heading.text-3xl.font-bold.tabular-nums').nth(0);
    this.kpiReservationsValue = page.locator('.font-heading.text-3xl.font-bold.tabular-nums').nth(1);
    this.kpiBiensValue = page.locator('.font-heading.text-3xl.font-bold.tabular-nums').nth(2);

    this.addPropertyBtn = page.getByRole('button', { name: 'Ajouter un bien' });
    this.createReservationBtn = page.getByRole('button', { name: 'Créer réservation' });

    this.chartSection = page.getByRole('heading', { name: 'Réservations par mois' }).locator('..');
    this.chartTitle = page.getByRole('heading', { name: 'Réservations par mois' });
    this.period1mois = page.getByRole('button', { name: '1 mois' });
    this.period3mois = page.getByRole('button', { name: '3 mois' });
    this.period6mois = page.getByRole('button', { name: '6 mois' });
    this.period1an = page.getByRole('button', { name: '1 an' });

    this.tableTitle = page.getByRole('heading', { name: 'Réservations', exact: true });
    this.table = page.locator('table');
    this.tableHeaders = page.locator('table th');
    this.tableRows = page.locator('tbody tr');
    this.reservationCount = page.locator('text=/\\d+\\s*réservations?/i');

    this.emptyChartState = page.getByText('Aucune donnée');
  }

  async gotoDashboard(): Promise<void> {
    logger.step('Navigating to dashboard');
    await this.page.goto('/concierge/dashboard', { waitUntil: 'domcontentloaded' });
    await this.wait.forLoadingComplete();
  }

  async getKpiValue(kpi: 'clients' | 'réservations' | 'biens'): Promise<string> {
    switch (kpi) {
      case 'clients': return (await this.kpiClientsValue.textContent()) || '';
      case 'réservations': return (await this.kpiReservationsValue.textContent()) || '';
      case 'biens': return (await this.kpiBiensValue.textContent()) || '';
    }
  }

  async clickAddProperty(): Promise<void> {
    logger.step('Clicking Ajouter un bien');
    await this.addPropertyBtn.click();
  }

  async clickCreateReservation(): Promise<void> {
    logger.step('Clicking Créer réservation');
    await this.createReservationBtn.click();
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

    const cells = rows.nth(index).locator('td, th');
    const cellCount = await cells.count();
    if (cellCount < 8) return null;

    const client = ((await cells.nth(0).textContent()) || '').trim();

    // skip empty/skeleton rows
    if (!client && (await cells.nth(1).textContent())?.trim() === '') return null;

    return {
      client: client || ((await cells.nth(1).textContent()) || '').trim(),
      phone: ((await cells.nth(1).textContent()) || '').trim(),
      checkin: ((await cells.nth(2).textContent()) || '').trim(),
      checkout: ((await cells.nth(3).textContent()) || '').trim(),
      persons: ((await cells.nth(4).textContent()) || '').trim(),
      status: ((await cells.nth(5).textContent()) || '').trim(),
      createdAt: ((await cells.nth(6).textContent()) || '').trim(),
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

  async isChartEmpty(): Promise<boolean> {
    try {
      return await this.emptyChartState.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }
}
