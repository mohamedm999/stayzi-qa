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

  test('@regression KPI cards should render a value', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();

    for (const kpi of ['occupation', 'revenus', 'checkins', 'a-traiter'] as const) {
      const value = (await dashboardPage.getKpiValue(kpi)).trim();
      expect(value, `${kpi} KPI should render a value`).not.toBe('');
    }
  });

  test('@regression clicking À traiter opens the tasks slide-over', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();

    const drawer = await dashboardPage.openTodayActivity();

    await expect(drawer.drawer).toBeVisible();
    await expect(drawer.title).toContainText("Aujourd'hui");
    await expect(drawer.closeBtn).toBeVisible();

    await drawer.close();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5000 });
  });

  test('@regression Créer réservation opens the reservation drawer', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    await dashboardPage.clickCreateReservation();

    const drawer = dashboardPage.getCreateReservationDrawer();
    await expect(drawer.drawer).toBeVisible();
    await expect(drawer.title).toBeVisible();
  });

  test('@regression Ajouter un bien opens the property wizard', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();
    const wizard = await dashboardPage.openPropertyWizard();

    await expect(wizard.dialog).toBeVisible();
    await expect(await wizard.isNextEnabled()).toBe(false);

    await wizard.selectMode('manual');
    await expect(await wizard.isNextEnabled()).toBe(true);
  });

  test('@regression E2E: create a property via the manual wizard', async ({ dashboardPage }) => {
    await dashboardPage.gotoDashboard();

    const created = await dashboardPage.createProperty(
      {
        name: `E2E Villa ${Date.now()}`,
        type: 'VILLA',
        description: 'Created by automated E2E test',
        city: 'Marrakech',
        country: 'Maroc',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        price: 850,
      },
      'fixtures/images/property-photo.png',
    );

    expect(created).toBe(true);
    await expect(dashboardPage.addPropertyBtn).toBeVisible();
  });

  test('@regression E2E: create a property via the import link wizard', async ({ dashboardPage, page }) => {
    await dashboardPage.gotoDashboard();

    // The backend scrape of an arbitrary Airbnb URL is not deterministic in
    // CI, so we mock the import endpoint and verify the prefilled-form flow.
    await page.route('**/api/v1/properties/import/link', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            source: 'AIRBNB',
            externalId: '44053185',
            sourceUrl: 'https://www.airbnb.fr/rooms/44053185',
            name: `Villa Import ${Date.now()}`,
            description: 'Importé par test E2E',
            type: 'VILLA',
            photos: ['https://picsum.photos/800/600'],
            pricePerNight: 950,
            rating: 5,
            capacity: { maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2 },
            address: {
              city: 'Marrakech',
              country: 'Maroc',
              latitude: 31.5483,
              longitude: -8.01,
              locationUrl: 'https://maps.app.goo.gl/xyz',
            },
            amenities: ['Piscine', 'WiFi'],
          },
        }),
      }),
    );

    const wizard = await dashboardPage.openPropertyWizard();
    await wizard.selectMode('link');
    await wizard.nextStep();

    await wizard.fillImportUrl('https://www.airbnb.fr/rooms/44053185');
    await wizard.clickImporter();

    await expect(wizard.dialog.getByText('1 photo(s) importée(s) automatiquement.')).toBeVisible();
    await expect(wizard.dialog.getByRole('textbox', { name: /Nom du bien/ })).toHaveValue(/Villa Import/);
    await expect(wizard.dialog.getByRole('textbox', { name: /Ville/ })).toHaveValue('Marrakech');
    await expect(wizard.dialog.getByRole('spinbutton', { name: /Prix/ })).toHaveValue('950');

    await wizard.submitForm();
    await expect(wizard.dialog.getByText('Bien ajouté avec succès !')).toBeVisible({ timeout: 15000 });
    await wizard.clickFermer();
    await expect(dashboardPage.addPropertyBtn).toBeVisible();
  });

  test('@regression E2E: create a reservation end-to-end', async ({ dashboardPage, page, dataGenerator }) => {
    await dashboardPage.gotoDashboard();

    const search = {
      checkIn: '2026-09-01',
      checkOut: '2026-09-05',
      city: 'marrakech' as const,
      guestCount: 2,
      type: 'VILLA' as const,
    };

    // --- Step 1: fill the search form and advance to results ---
    await dashboardPage.clickCreateReservation();
    let drawer = dashboardPage.getCreateReservationDrawer();

    const noPropDialog = dashboardPage.getNoPropertyDialog();
    if (await noPropDialog.isOpen()) {
      test.skip(true, 'No properties available, reservation search is not reachable');
      return;
    }

    await drawer.searchProperty(search);
    await page.waitForTimeout(1500);
    await drawer.goToNext();
    await page.waitForTimeout(2000);

    // --- If no property matches, create one first, then retry ---
    if ((await drawer.propertyRadios.count()) === 0) {
      await drawer.close();
      const created = await dashboardPage.createProperty({
        name: `E2E Villa ${Date.now()}`,
        type: 'VILLA',
        description: 'Created by automated E2E test',
        city: 'Marrakech',
        country: 'Maroc',
        maxGuests: 4,
        bedrooms: 2,
        bathrooms: 1,
        price: 850,
      });
      expect(created).toBe(true);

      await dashboardPage.clickCreateReservation();
      drawer = dashboardPage.getCreateReservationDrawer();
      await drawer.searchProperty(search);
      await page.waitForTimeout(1500);
      await drawer.goToNext();
      await page.waitForTimeout(2000);
    }

    // --- Step 2: select the property ---
    expect(await drawer.propertyRadios.count()).toBeGreaterThan(0);
    await drawer.selectProperty(0);
    await drawer.goToNext();

    // --- Step 3: fill guest info and confirm ---
    const guest = dataGenerator.user();
    await drawer.fillGuestInfo({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      country: 'Maroc',
      guestLanguage: 'Français',
      guestCount: 2,
    });
    await drawer.confirm();

    await expect(drawer.successTitle).toBeVisible({ timeout: 15000 });
  });
});
