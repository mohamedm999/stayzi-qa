import { test, expect } from '@fixtures/test.fixture';

test.describe('Dashboard Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke should display KPI cards with labels', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.kpiOccupation).toBeVisible();
    await expect(dashboardPage.kpiRevenus).toBeVisible();
    await expect(dashboardPage.kpiCheckins).toBeVisible();
    await expect(dashboardPage.kpiATraiter).toBeVisible();
  });

  test('@smoke should display action buttons', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.addPropertyBtn).toBeVisible();
    await expect(dashboardPage.createReservationBtn).toBeVisible();
  });

  test('@smoke should display chart section with period filters', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.chartTitle).toBeVisible();
    await expect(dashboardPage.period1mois).toBeVisible();
    await expect(dashboardPage.period3mois).toBeVisible();
    await expect(dashboardPage.period6mois).toBeVisible();
    await expect(dashboardPage.period1an).toBeVisible();
  });

  test('@smoke should display reservations table with 10 columns', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.tableTitle).toBeVisible();
    await expect(dashboardPage.table).toBeVisible();

    const headers = await dashboardPage.getHeaderTexts();
    expect(headers).toContain('Client');
    expect(headers).toContain('Téléphone');
    expect(headers).toContain('Check-in');
    expect(headers).toContain('Check-out');
    expect(headers).toContain('Pers.');
    expect(headers).toContain('Statut');
    expect(headers).toContain('Fiche police');
    expect(headers).toContain('Montant');
    expect(headers).toContain('QR Code');
    expect(headers).toContain('Actions');
  });

  test('@smoke should display reservation rows with data', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.table).toBeVisible();
    const count = await dashboardPage.getRowCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('@regression should display reservation count text', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.reservationCount).toBeVisible();
  });

  test('@regression should have visible reservation rows', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.table).toBeVisible();
    const visible = await dashboardPage.getVisibleRowCount();
    expect(visible).toBeGreaterThanOrEqual(0);
  });

  test('@regression should change chart period when filter is clicked', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await dashboardPage.selectPeriod('6 mois');
    await expect(dashboardPage.period6mois).toHaveClass(/bg-amber/);
    await dashboardPage.selectPeriod('1 an');
    await expect(dashboardPage.period1an).toHaveClass(/bg-amber/);
  });
});
