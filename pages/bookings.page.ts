import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { logger } from '@utils/logger';

export type BookingStatus = 'INCOMPLETE' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type BookingSource = 'AIRBNB' | 'BOOKING' | 'SPEECH' | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK';
export type PropertyType = 'APARTMENT' | 'VILLA';
export type City = 'casablanca' | 'marrakech' | 'rabat' | 'tanger' | 'agadir';

export interface BookingRowData {
  client: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  status: string;
  amount: string;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  country: string;
  guestLanguage: string;
  guestCount: number;
  bookingSource?: BookingSource;
  advancePaymentAmount?: number;
}

export interface PropertySearch {
  checkIn: string;   // yyyy-MM-dd
  checkOut: string;   // yyyy-MM-dd
  city: City;
  guestCount: number;
  type: PropertyType;
}

// ─── Status Maps ─────────────────────────────────────────────

export const STATUS_LABELS: Record<BookingStatus, string> = {
  INCOMPLETE: 'Infos manquantes',
  UPCOMING: 'À venir',
  ACTIVE: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const SOURCE_LABELS: Record<BookingSource, string> = {
  AIRBNB: 'Airbnb',
  BOOKING: 'Booking',
  SPEECH: 'Speech',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
};

// ─── BookingsPage ────────────────────────────────────────────

export class BookingsPage extends BasePage {
  readonly heading: Locator;
  readonly syncBtn: Locator;
  readonly bookingCount: Locator;

  readonly tableContainer: Locator;
  readonly tableEl: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;

  readonly emptyState: Locator;
  readonly emptyStateIcon: Locator;

  readonly createBtn: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('.rounded-xl.border.bg-card h3');
    this.syncBtn = page.locator('.lucide-refresh-cw').locator('..');
    this.bookingCount = page.locator('.tabular-nums');

    this.tableContainer = page.locator('.rounded-xl.border.bg-card');
    this.tableEl = this.tableContainer.locator('table');
    this.tableHeaders = this.tableEl.locator('thead th');
    this.tableRows = this.tableEl.locator('tbody tr');

    this.emptyState = page.getByText('Aucune réservation pour le moment.');
    this.emptyStateIcon = page.locator('.lucide-inbox-icon');

    this.createBtn = page.getByRole('button', { name: 'Créer réservation' });
  }

  async goto(): Promise<void> {
    logger.step('Navigating to bookings page');
    await this.page.goto('/concierge/bookings', { waitUntil: 'domcontentloaded' });
    await this.page.waitForURL('**/concierge/bookings', { timeout: 15000 });
    await this.tableContainer.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      logger.info('Bookings table container not visible, proceeding anyway (may be empty or different UI)');
    });
    await this.page.locator('[data-slot="skeleton"]').first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  }

  async getHeaderTexts(): Promise<string[]> {
    return this.tableHeaders.allTextContents();
  }

  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getBookingCount(): Promise<string> {
    return (await this.bookingCount.textContent()) || '';
  }

  async getRowByClient(name: string): Locator {
    return this.tableRows.filter({ hasText: name }).first();
  }

  async getRowData(index: number): Promise<BookingRowData | null> {
    const count = await this.tableRows.count();
    if (index >= count) return null;

    const row = this.tableRows.nth(index);
    const cells = row.locator('td');
    const cellCount = await cells.count();
    if (cellCount < 10) return null;

    return {
      client: ((await cells.nth(0).textContent()) || '').trim(),
      phone: ((await cells.nth(1).textContent()) || '').trim(),
      checkIn: ((await cells.nth(2).textContent()) || '').trim(),
      checkOut: ((await cells.nth(3).textContent()) || '').trim(),
      guests: ((await cells.nth(4).textContent()) || '').trim(),
      status: ((await cells.nth(5).textContent()) || '').trim(),
      amount: ((await cells.nth(7).textContent()) || '').trim(),
    };
  }

  getStatusBadge(row: Locator): Locator {
    return row.locator('td').nth(5);
  }

  async getRowActions(index: number): Promise<{ view: Locator; cancel: Locator; complete: Locator }> {
    const row = this.tableRows.nth(index);
    const actionsCell = row.locator('td').last();
    const buttons = actionsCell.locator('button');
    return {
      view: buttons.first(),
      cancel: buttons.nth(1),
      complete: buttons.first(), // For INCOMPLETE rows, the first button is the complete action
    };
  }

  async isRowIncomplete(index: number): Promise<boolean> {
    const row = this.tableRows.nth(index);
    const classes = await row.getAttribute('class') || '';
    return classes.includes('bg-destructive/5');
  }

  async clickSync(): Promise<void> {
    logger.step('Clicking sync button');
    await this.syncBtn.click();
  }

  async clickCreate(): Promise<void> {
    logger.step('Clicking create reservation button');
    await this.createBtn.click();
  }

  getCreateDrawer(): CreateBookingDrawer {
    return new CreateBookingDrawer(this.page);
  }

  getDetailDrawer(): BookingDetailDrawer {
    return new BookingDetailDrawer(this.page);
  }

  getCancelDialog(): CancelBookingDialog {
    return new CancelBookingDialog(this.page);
  }

  getCompleteDialog(): CompleteBookingDialog {
    return new CompleteBookingDialog(this.page);
  }

  getNoPropertyDialog(): NoPropertyDialog {
    return new NoPropertyDialog(this.page);
  }
}

// ─── CreateBookingDrawer (3-Step Wizard) ─────────────────────

export class CreateBookingDrawer {
  readonly drawer: Locator;
  readonly title: Locator;
  readonly closeBtn: Locator;

  readonly prevBtn: Locator;
  readonly nextBtn: Locator;
  readonly confirmBtn: Locator;

  readonly stepperNav: Locator;
  readonly stepperItems: Locator;

  // Step 1 — Property Search
  readonly searchForm: Locator;
  readonly dateTrigger: Locator;
  readonly citySelect: Locator;
  readonly guestMinus: Locator;
  readonly guestPlus: Locator;
  readonly guestCountInput: Locator;
  readonly typeApartment: Locator;
  readonly typeVilla: Locator;

  // Step 2 — Property Results
  readonly propertyRadios: Locator;
  readonly noPropertiesMsg: Locator;
  readonly skeletonCards: Locator;

  // Step 3 — Guest Info
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly countryInput: Locator;
  readonly languageSelect: Locator;
  readonly bookingSourceSelect: Locator;
  readonly advancePaymentInput: Locator;

  // Step 4 — Success
  readonly successTitle: Locator;
  readonly successDescription: Locator;

  constructor(private page: Page) {
    this.drawer = page.locator('[data-vaul-drawer-direction="right"]');
    this.title = this.drawer.locator('[data-slot="drawer-title"]');
    this.closeBtn = this.drawer.getByRole('button', { name: 'Fermer' });

    this.prevBtn = this.drawer.getByRole('button', { name: 'Précédent' });
    this.nextBtn = this.drawer.getByRole('button', { name: 'Suivant' });
    this.confirmBtn = this.drawer.getByRole('button', { name: 'Confirmer la réservation' });

    this.stepperNav = this.drawer.locator('[data-slot="stepper"]');
    this.stepperItems = this.drawer.locator('[data-slot="stepper-item"]');

    // Step 1
    this.searchForm = this.drawer.locator('form#property-search-form');
    this.dateTrigger = this.searchForm.getByText('Sélectionner les dates');
    this.citySelect = this.drawer.locator('#city');
    this.guestMinus = this.drawer.getByRole('button', { name: 'Diminuer' });
    this.guestPlus = this.drawer.getByRole('button', { name: 'Augmenter' });
    this.guestCountInput = this.drawer.locator('input[type="number"]');
    this.typeApartment = this.drawer.locator('#appartement');
    this.typeVilla = this.drawer.locator('#villa');

    // Step 2
    this.propertyRadios = this.drawer.locator('[data-slot="radio-group-item"]:not(#appartement):not(#villa)');
    this.noPropertiesMsg = this.drawer.getByText('Aucune propriété ne correspond');
    this.skeletonCards = this.drawer.locator('.animate-pulse');

    // Step 3
    this.firstNameInput = this.drawer.locator('input[name="firstName"]');
    this.lastNameInput = this.drawer.locator('input[name="lastName"]');
    this.emailInput = this.drawer.locator('input[name="email"]');
    this.phoneInput = this.drawer.locator('input[name="phone"]');
    this.countryInput = this.drawer.locator('input[name="country"]');
    this.languageSelect = this.drawer.locator('select[name="guestLanguage"], #guestLanguage');
    this.bookingSourceSelect = this.drawer.locator('select[name="bookingSource"], #bookingSource');
    this.advancePaymentInput = this.drawer.locator('input[name="advancePaymentAmount"]');

    // Step 4
    this.successTitle = this.drawer.getByText('Réservation confirmée !');
    this.successDescription = this.drawer.getByText('La réservation et les informations');
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.drawer.isVisible({ timeout: 3000 });
    } catch {
      return false;
    }
  }

  async getCurrentStep(): Promise<number> {
    const active = this.drawer.locator('[data-slot="stepper-indicator"][data-state="active"]');
    return (await active.count()) > 0
      ? parseInt((await active.textContent()) || '1')
      : 1;
  }

  async goToNext(): Promise<void> {
    logger.step('Clicking Next in create booking wizard');
    await this.nextBtn.click();
  }

  async goToPrev(): Promise<void> {
    logger.step('Clicking Previous in create booking wizard');
    await this.prevBtn.click();
  }

  async confirm(): Promise<void> {
    logger.step('Confirming booking creation');
    await this.confirmBtn.click();
  }

  async close(): Promise<void> {
    logger.step('Closing create booking drawer');
    await this.closeBtn.click();
  }

  // Step 1 helpers
  async searchProperty(search: PropertySearch): Promise<void> {
    logger.step(`Searching property: ${search.city} ${search.type}`);

    // Set dates
    await this.dateTrigger.click();
    const calendar = this.page.locator('[data-slot="calendar"]');
    await calendar.waitFor({ state: 'visible', timeout: 5000 });

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    // Select check-in date within the correct month grid
    const [ciYear, ciMonth, ciDay] = search.checkIn.split('-');
    const ciGrid = calendar.getByRole('grid', { name: monthNames[parseInt(ciMonth) - 1] });
    await ciGrid.locator(`button[data-day="${ciDay}/${ciMonth}/${ciYear}"]`).click();
    // Select check-out date within the correct month grid
    const [coYear, coMonth, coDay] = search.checkOut.split('-');
    const coGrid = calendar.getByRole('grid', { name: monthNames[parseInt(coMonth) - 1] });
    await coGrid.locator(`button[data-day="${coDay}/${coMonth}/${coYear}"]`).click();

    // Confirm dates (button is in a popover outside the drawer DOM)
    await this.page.getByRole('button', { name: 'Confirmer' }).click();

    // Set city
    await this.citySelect.click();
    const cityLabels: Record<City, string> = {
      casablanca: 'Casablanca',
      marrakech: 'Marrakech',
      rabat: 'Rabat',
      tanger: 'Tanger',
      agadir: 'Agadir',
    };
    await this.page.getByRole('option', { name: cityLabels[search.city] }).click();

    // Set guest count
    const currentGuests = parseInt((await this.guestCountInput.inputValue()) || '1');
    const diff = search.guestCount - currentGuests;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) await this.guestPlus.click();
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) await this.guestMinus.click();
    }

    // Set type
    if (search.type === 'APARTMENT') {
      await this.typeApartment.click();
    } else {
      await this.typeVilla.click();
    }
  }

  async selectProperty(index = 0): Promise<void> {
    logger.step(`Selecting property at index ${index}`);
    const radio = this.propertyRadios.nth(index);
    await radio.click();
    await expect(radio).toHaveAttribute('data-state', 'checked', { timeout: 3000 });
  }

  async fillGuestInfo(guest: GuestInfo): Promise<void> {
    logger.step(`Filling guest info: ${guest.firstName} ${guest.lastName}`);
    await this.firstNameInput.fill(guest.firstName);
    await this.lastNameInput.fill(guest.lastName);
    if (guest.email) await this.emailInput.fill(guest.email);
    await this.phoneInput.fill(guest.phone);
    await this.countryInput.fill(guest.country);
    if (guest.guestCount) {
      // Guest count is set via the guest count input
    }
  }

  async getFieldError(fieldName: string): Promise<string> {
    const input = this.drawer.locator(`[name="${fieldName}"]`);
    const fieldWrapper = input.locator('..');
    const error = fieldWrapper.locator('[data-slot="field-error"]');
    try {
      return (await error.textContent()) || '';
    } catch {
      return '';
    }
  }
}

// ─── BookingDetailDrawer ─────────────────────────────────────

export class BookingDetailDrawer {
  readonly drawer: Locator;
  readonly title: Locator;
  readonly closeBtn: Locator;
  readonly statusBadge: Locator;

  readonly checkInDate: Locator;
  readonly checkOutDate: Locator;
  readonly nightsCount: Locator;

  readonly clientName: Locator;
  readonly clientEmail: Locator;
  readonly clientPhone: Locator;
  readonly clientCountry: Locator;
  readonly guestCount: Locator;
  readonly clientLanguage: Locator;

  readonly specialRequests: Locator;
  readonly totalAmount: Locator;
  readonly advancePayment: Locator;

  readonly documentsSection: Locator;
  readonly policeFormLink: Locator;
  readonly welcomeBookletLink: Locator;
  readonly qrCode: Locator;

  readonly instructions: Locator;
  readonly timestamps: Locator;

  constructor(private page: Page) {
    this.drawer = page.locator('[data-vaul-drawer-direction="right"]');
    this.title = this.drawer.locator('[data-slot="drawer-title"]');
    this.closeBtn = this.drawer.locator('[data-slot="drawer-close"]').first();
    this.statusBadge = this.drawer.locator('[data-slot="badge"]').first();

    this.checkInDate = this.drawer.getByText('Check-in').locator('..');
    this.checkOutDate = this.drawer.getByText('Check-out').locator('..');
    this.nightsCount = this.drawer.locator('.lucide-moon').locator('..');

    this.clientEmail = this.drawer.locator('a[href^="mailto:"]').or(this.drawer.getByText('Email').first().locator('..'));
    this.clientPhone = this.drawer.locator('a[href^="tel:"]').or(this.drawer.getByText(/^Téléphone$/).first().locator('..'));
    this.clientCountry = this.drawer.getByText('Pays').locator('..');
    this.guestCount = this.drawer.getByText('Voyageurs').locator('..');
    this.clientLanguage = this.drawer.getByText('Langue').locator('..');

    this.specialRequests = this.drawer.getByText('Demandes spéciales');
    this.totalAmount = this.drawer.getByText('Montant total');
    this.advancePayment = this.drawer.getByText('Acompte versé');

    this.documentsSection = this.drawer.getByText('Documents');
    this.policeFormLink = this.drawer.getByRole('link', { name: /fiche de police/i });
    this.welcomeBookletLink = this.drawer.getByRole('link', { name: /livret/i });
    this.qrCode = this.drawer.getByRole('img', { name: /qr code/i, exact: false }).or(
      this.drawer.locator('canvas, svg, [class*="qr"], [data-testid*="qr"]')
    ).first();

    this.instructions = this.drawer.getByText('Instructions');
    this.timestamps = this.drawer.getByText('Créée le');
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.drawer.isVisible({ state: 'visible', timeout: 3000 });
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    logger.step('Closing booking detail drawer');
    await this.closeBtn.click();
  }

  async getStatusLabel(): Promise<string> {
    return (await this.statusBadge.textContent()) || '';
  }

  async getNights(): Promise<string> {
    return (await this.nightsCount.textContent()) || '';
  }

  async getClientName(): Promise<string> {
    return (await this.title.textContent()) || '';
  }

  async getAmount(): Promise<string> {
    const text = await this.totalAmount.textContent() || '';
    return text.replace('Montant total', '').trim();
  }
}

// ─── CancelBookingDialog ─────────────────────────────────────

export class CancelBookingDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly cancelBtn: Locator;
  readonly confirmBtn: Locator;
  readonly loadingText: Locator;

  constructor(private page: Page) {
    this.dialog = page.getByRole('dialog', { name: /annuler/i });
    this.title = this.dialog.getByRole('heading');
    this.description = this.dialog.locator('.text-sm.text-muted-foreground');
    this.cancelBtn = this.dialog.getByRole('button', { name: 'Annuler' });
    this.confirmBtn = this.dialog.getByRole('button', { name: /confirmer l'annulation/i });
    this.loadingText = this.dialog.getByText('Annulation...');
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async confirm(): Promise<void> {
    logger.step('Confirming booking cancellation');
    await this.confirmBtn.click();
  }

  async cancel(): Promise<void> {
    logger.step('Cancelling the cancel dialog');
    await this.cancelBtn.click();
  }

  async getDescription(): Promise<string> {
    return (await this.description.textContent()) || '';
  }
}

// ─── CompleteBookingDialog ───────────────────────────────────

export class CompleteBookingDialog {
  readonly dialog: Locator;

  constructor(private page: Page) {
    this.dialog = page.locator('[data-slot="dialog-content"]');
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }
}

// ─── NoPropertyDialog ────────────────────────────────────────

export class NoPropertyDialog {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly addPropertyBtn: Locator;

  constructor(private page: Page) {
    this.dialog = page.locator('[role="dialog"]').filter({ hasText: /Aucune propriété/i }).or(
      page.locator('[role="alertdialog"]').filter({ hasText: /Aucune propriété/i })
    );
    this.title = this.dialog.getByText('Aucune propriété disponible');
    this.addPropertyBtn = this.dialog.getByRole('link', { name: 'Ajouter un bien' });
  }

  async isOpen(): Promise<boolean> {
    try {
      return await this.dialog.isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  async clickAddProperty(): Promise<void> {
    await this.addPropertyBtn.click();
  }
}
