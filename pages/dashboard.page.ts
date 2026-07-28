import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@lib/logger';

type Period = '1 mois' | '3 mois' | '6 mois' | '1 an';

type RowData = {
  client: string;
  phone: string;
  checkin: string;
  checkout: string;
  persons: string;
  status: string;
  amount: string;
};

export class DashboardPage extends BasePage {
  readonly kpiOccupation: Locator;
  readonly kpiRevenus: Locator;
  readonly kpiCheckins: Locator;
  readonly kpiATraiter: Locator;

  readonly addPropertyBtn: Locator;
  readonly createReservationBtn: Locator;

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

  readonly emptyChartState: Locator;

  readonly todayPanel: Locator;

  constructor(page: Page) {
    super(page);

    this.kpiOccupation = page.getByText('Occupation');
    this.kpiRevenus = page.getByText('Revenus (mois)');
    this.kpiCheckins = page.getByText('Check-ins 7j');
    this.kpiATraiter = page.getByText('À traiter');

    this.addPropertyBtn = page.getByRole('button', { name: /Ajouter un bien/i });
    this.createReservationBtn = page.getByRole('button', { name: /Créer réservation|Nouvelle réservation/i });

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

    this.emptyChartState = page.getByText('Aucune donnée');

    this.todayPanel = page.getByText('Aujourd\'hui').locator('..');
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
    if (cellCount < 7) return null;

    const client = ((await cells.nth(0).textContent()) || '').trim();
    if (!client && (await cells.nth(1).textContent())?.trim() === '') return null;

    return {
      client,
      phone: ((await cells.nth(1).textContent()) || '').trim(),
      checkin: ((await cells.nth(2).textContent()) || '').trim(),
      checkout: ((await cells.nth(3).textContent()) || '').trim(),
      persons: ((await cells.nth(4).textContent()) || '').trim(),
      status: ((await cells.nth(5).textContent()) || '').trim(),
      amount: ((await cells.nth(6).textContent()) || '').trim(),
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
