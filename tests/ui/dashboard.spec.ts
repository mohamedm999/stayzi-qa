import { test, expect } from '@fixtures/test.fixture';

test.describe('Dashboard Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke should display KPI cards with dynamic values', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.kpiClientsValue).toBeVisible();
    await expect(dashboardPage.kpiReservationsValue).toBeVisible();
    await expect(dashboardPage.kpiBiensValue).toBeVisible();

    expect(Number(await dashboardPage.getKpiValue('clients'))).toBeGreaterThanOrEqual(0);
    expect(Number(await dashboardPage.getKpiValue('réservations'))).toBeGreaterThanOrEqual(0);
    expect(Number(await dashboardPage.getKpiValue('biens'))).toBeGreaterThanOrEqual(0);
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

  test('@smoke should display reservations table with columns', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await expect(dashboardPage.tableTitle).toBeVisible();
    await expect(dashboardPage.table).toBeVisible();

    const headers = await dashboardPage.getHeaderTexts();
    expect(headers.length).toBeGreaterThanOrEqual(7);
  });

  test('@smoke should display reservation rows with data', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    const count = await dashboardPage.getRowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('@regression should display reservation count text', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    const count = await dashboardPage.getReservationCount();
    expect(count).toMatch(/\d+\s*réservations?/i);
  });

  test('@regression should have visible reservation rows', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    const visible = await dashboardPage.getVisibleRowCount();
    expect(visible).toBeGreaterThan(0);
  });

  test('@regression should change chart period when filter is clicked', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await dashboardPage.selectPeriod('3 mois');
    await expect(dashboardPage.period3mois).toBeVisible();
    await dashboardPage.selectPeriod('1 an');
    await expect(dashboardPage.period1an).toBeVisible();
  });
});
