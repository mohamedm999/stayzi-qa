# Stayzi — Bookings Page Deep Analysis
## `/concierge/bookings` — Test Locators, Workflows & Component Structure

---

## 1. PAGE ARCHITECTURE

```
/concierge/bookings
├── RecentBookingsTable (main page content)
│   ├── Header bar: h3 "Réservations" + Sync button + Count badge
│   ├── Table (9 columns)
│   │   ├── Skeleton rows (loading state)
│   │   ├── Empty state ("Aucune réservation pour le moment.")
│   │   └── Booking rows (with conditional rendering per status)
│   ├── BookingDetailDrawer (view booking details)
│   └── CompleteBookingDialog (for INCOMPLETE bookings)
├── CreateBookingDrawer (3-step wizard)
│   ├── Step 1: PropertySearchStep (dates, city, guests, type)
│   ├── Step 2: PropertyResultsStep (property selection via RadioGroup)
│   ├── Step 3: Guest Info Form (client details + payment)
│   └── Step 4: Success feedback
└── No-Properties AlertDialog (when user has 0 properties)
```

**Source chunks:**
- `0fbo2vexpdd5a.js` (148KB) — Main page: hooks, drawers, table, form schemas, date-fns
- `0saw93g_ytgt..js` (53KB) — Shared components: Stepper, ConfirmDialog, Field, Badge, etc.

---

## 2. BOOKING STATUSES

### 2.1 Status Map (Table — L variable)

| Status | French Label | Badge Variant | Visual |
|---|---|---|---|
| `INCOMPLETE` | "Infos manquantes" | `destructive` | Red, row has bg-destructive/5 border-l-2 border-l-destructive + AlertTriangle icon |
| `UPCOMING` | "À venir" | `secondary` | Gray |
| `ACTIVE` | "En cours" | `default` | Primary color |
| `COMPLETED` | "Terminée" | `outline` | Outlined |
| `CANCELLED` | "Annulée" | `destructive` | Red |

### 2.2 Status Map (Detail Drawer — I variable)

| Status | Label | Variant |
|---|---|---|
| `UPCOMING` | "À venir" | `secondary` |
| `ACTIVE` | "En cours" | `default` |
| `COMPLETED` | "Terminée" | `outline` |
| `CANCELLED` | "Annulée" | `destructive` |

**Note:** Detail drawer does NOT include INCOMPLETE (incomplete bookings use CompleteBookingDialog instead).

### 2.3 BookingSource Enum (t_)

```
AIRBNB | BOOKING | SPEECH | FACEBOOK | INSTAGRAM | TIKTOK
```

---

## 3. BOOKINGS TABLE (RecentBookingsTable)

### 3.1 Table Container

```html
<div class="rounded-xl border bg-card">
  <div class="px-4 py-3 border-b flex items-center justify-between">
    <h3 class="text-sm font-semibold">Réservations</h3>
    <div class="flex items-center gap-2">
      <!-- Sync button + Count badge -->
    </div>
  </div>
  <div class="overflow-x-auto"><table>...</table></div>
</div>
```

### 3.2 Table Headers (9 columns)

| # | Header | Data |
|---|---|---|
| 1 | Client | client.firstName + " " + client.lastName |
| 2 | Téléphone | client.phone ?? "—" |
| 3 | Check-in | format(dateRange.checkIn) — dd/MM/yyyy |
| 4 | Check-out | format(dateRange.checkOut) — dd/MM/yyyy |
| 5 | Pers. | guestCount in amber badge (rounded-full, size-6) |
| 6 | Statut | Badge with variant per status map |
| 7 | Montant | payment.totalAmount + " MAD" or "—" |
| 8 | Créée le | format(createdAt) |
| 9 | Actions | Eye (view) + Ban (cancel) — OR AlertTriangle + Ban for INCOMPLETE |

### 3.3 INCOMPLETE Row (special styling)

```html
<tr class="bg-destructive/5 hover:bg-destructive/10 border-l-2 border-l-destructive">
  <td>
    <div class="flex items-center gap-1.5 text-destructive font-medium">
      <svg class="lucide alert-triangle size-3.5 shrink-0"></svg>
      Non renseigné
    </div>
  </td>
</tr>
```

### 3.4 Empty State

```html
<tr><td colspan="9" class="p-0">
  <div class="py-16">
    <svg class="lucide inbox-icon size-12"></svg>
    <p class="text-muted-foreground">Aucune réservation pour le moment.</p>
  </div>
</td></tr>
```

### 3.5 Sync Button

- Icon: `lucide-refresh-cw` (size-3.5, animate-spin while syncing)
- Tooltip: "Synchroniser Airbnb/Booking maintenant"
- API: `bookingService.syncIcal()`
- Toast on changes: "Synchronisation Airbnb/Booking : {created} nouvelle(s), {updated} mise(s) à jour, {cancelled} annulée(s)."
- Toast no changes: "Synchronisation effectuée — aucun changement détecté."

---

## 4. CREATE BOOKING WORKFLOW (3-Step Drawer)

### 4.1 Drawer Open

The "Créer réservation" button is INSIDE the drawer. On open, it calls `propertyService.findAll()`. If 0 properties → AlertDialog "Aucune propriété disponible" with "Ajouter un bien" button.

### 4.2 Drawer Structure

```
Drawer (direction="right", sm:max-w-lg!)
├── DrawerHeader (border-b pb-4)
│   ├── DrawerTitle: "Nouvelle réservation" + Close button (aria-label="Fermer")
│   └── StepperNav: [1] — [2] — [3] with StepperSeparator between each
├── StepperPanel (flex-1 overflow-y-auto)
│   ├── StepperContent value=1: PropertySearchStep
│   ├── StepperContent value=2: PropertyResultsStep
│   ├── StepperContent value=3: Guest Info Form
│   └── StepperContent value=4: Success feedback
└── DrawerFooter (border-t pt-4)
    ├── "Précédent" button (disabled when step=1, variant="outline")
    └── "Suivant" / "Confirmer la réservation" / "Création..." (loading)
```

### 4.3 Step 1 — Property Search (form#property-search-form)

**Zod Schema (tS):**

| Field | Component | Validation Message |
|---|---|---|
| checkIn | Popover + Calendar (range, 2 months, disabled past dates) | "La date d'arrivée est obligatoire." |
| checkOut | Same calendar (range mode) | "La date de départ est obligatoire." |
| city | Select dropdown | "Veuillez sélectionner une ville." |
| guestCount | ButtonGroup (minus/input/plus, type=number) | "Au moins 1 personne." |
| type | RadioGroup (card style with icons) | "Veuillez sélectionner un type de bien." |

**City values:** casablanca, marrakech, rabat, tanger, agadir
**Type values:** APARTMENT (Building icon), VILLA (Home icon)
**Date format:** Display dd/MM/yyyy, Submit yyyy-MM-dd
**Calendar buttons:** "Effacer" (clear), "Confirmer" (close popover)

### 4.4 Step 2 — Property Results

- API: `propertyService.search({checkIn, checkOut, city, guestCount, type})`
- Loading: 5 skeleton placeholder cards
- Empty: "Aucune propriété ne correspond à vos critères de recherche."
- Results: RadioGroup of property cards
- Selection stored via `onSelect(property)`

### 4.5 Step 3 — Guest Info (guestInfoSchema / tH)

**Zod Schema:**

| Field | Type | Required | Validation |
|---|---|---|---|
| firstName | string().trim() | YES | min 1 — "Prénom est obligatoire" |
| lastName | string().trim() | YES | min 1 — "Nom est obligatoire" |
| email | string().email() | NO | "Adresse email invalide" |
| phone | string().nonempty() | YES | "Le téléphone est obligatoire." |
| country | string().min(2) | YES | "Le pays est obligatoire" |
| guestLanguage | string().min(1) | YES | "La langue est obligatoire" |
| guestCount | number().min(1) | YES | "Au moins 1 personne." |
| bookingSource | nativeEnum(BookingSource) | NO | — |
| advancePaymentAmount | number().min(0) | NO | "Le montant ne peut pas être négatif" |

**Submit payload:**
```json
{
  "propertyId": "...",
  "client": { "firstName", "lastName", "email", "phone", "country", "preferredLanguage" },
  "dateRange": { "checkIn": "ISO string", "checkOut": "ISO string" },
  "payment": { "advancePaymentAmount": 0 },
  "guestCount": 2,
  "bookingSource": "MANUAL"
}
```

### 4.6 Step 4 — Success

Title: "Réservation confirmée !"
Description: "La réservation et les informations du client ont été enregistrées avec succès."
Button: "Fermer" (closes drawer)

---

## 5. BOOKING DETAIL DRAWER

### 5.1 Header

```html
<div class="shrink-0 border-b px-6 py-5">
  <!-- Avatar circle: initials (AB), bg-secondary text-primary, h-12 w-12 -->
  <!-- DrawerTitle: "firstName lastName", text-lg font-semibold -->
  <!-- Badge: status label + variant -->
  <!-- Close: button aria-label="Fermer" -->
  
  <!-- Check-in / Nights / Check-out bar -->
  <div class="mt-4 flex items-center gap-3 rounded-lg bg-muted/50 border px-4 py-3">
    <p class="uppercase tracking-wider">Check-in</p>  <dd/MM/yyyy>
    <span class="rounded-full bg-primary/10 border border-primary/20">
      <svg class="lucide moon h-4 w-4"></svg> {nights} nuits
    </span>
    <p class="uppercase tracking-wider">Check-out</p>  <dd/MM/yyyy>
  </div>
</div>
```

### 5.2 Content Sections (scrollable)

1. **Informations client** — Mail, Phone, Pays, Voyageurs, Langue (with flag)
2. **Demandes spéciales** — conditional, whitespace-pre-line
3. **Paiement** — Montant total (MAD), Acompte versé (MAD or "—")
4. **Documents** — Fiche de police (link), Livret d'accueil (link), QR Code
   - QR only for ACTIVE/UPCOMING status
   - UPCOMING: disabled ("Disponible dès le check-in")
   - Copy button + external link
5. **Instructions** — conditional, whitespace-pre-line
6. **Timestamps** — "Créée le {date}" + "Modifiée le {date}"

### 5.3 Footer

```html
<div class="shrink-0 border-t px-6 py-4">
  <button class="w-full">Fermer</button>
</div>
```

---

## 6. ACTIONS

### 6.1 View (Eye icon)
- Tooltip: "Voir les détails"
- Opens: BookingDetailDrawer
- Button: `variant="outline"`, `size="icon"`, `lucide-eye-icon size-4`

### 6.2 Cancel (Ban icon)
- Tooltip: "Annuler la réservation"
- Opens: ConfirmDialog
- Disabled when: status === "CANCELLED"
- Title: "Annuler la réservation"
- Description: "Êtes-vous sûr de vouloir annuler la réservation de **{name}** ? Cette action est irréversible."
- Confirm: "Confirmer l'annulation" (loading: "Annulation...")
- API: `bookingService.cancel(id)` → optimistic `status: "CANCELLED"`
- Toast success: "Réservation annulée avec succès."

### 6.3 Complete INCOMPLETE (AlertTriangle, destructive)
- Only shown for INCOMPLETE status
- Tooltip: "Compléter la réservation"
- Opens: CompleteBookingDialog (separate component)

---

## 7. STEPPER COMPONENT

```html
<div role="tablist" data-slot="stepper" data-orientation="horizontal">
  <div data-slot="stepper-nav">
    <div data-slot="stepper-item" step="1">
      <div data-slot="stepper-trigger"><div data-slot="stepper-indicator" data-state="completed|active">1</div></div>
      <div data-slot="stepper-separator"></div>
    </div>
    <!-- steps 2, 3 -->
  </div>
  <div data-slot="stepper-panel">
    <div data-slot="stepper-content" data-state="1">...</div>
    <div data-slot="stepper-content" data-state="2" hidden>...</div>
    <div data-slot="stepper-content" data-state="3" hidden>...</div>
  </div>
</div>
```

---

## 8. CONFIRM DIALOG

```html
<div data-slot="dialog-content" class="max-h-[85vh] overflow-y-auto sm:max-w-md">
  <div data-slot="dialog-header">
    <h2 data-slot="dialog-title">Annuler la réservation</h2>
  </div>
  <p class="text-sm text-muted-foreground">Description...</p>
  <p class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Error</p>
  <div class="flex gap-3 pt-2">
    <button data-slot="alert-dialog-cancel" variant="outline">Annuler</button>
    <button variant="destructive">Confirmer l'annulation</button>
  </div>
</div>
```

---

## 9. PLAYWRIGHT LOCATORS

```typescript
// Page
const table = page.locator('.rounded-xl.border.bg-card');
const syncBtn = table.locator('button').filter({ has: page.locator('.lucide-refresh-cw') });
const bookingCount = table.locator('.tabular-nums');

// Table
const tableEl = table.locator('table');
const rows = tableEl.locator('tbody tr');
const rowByClient = (name: string) => rows.filter({ hasText: name }).first();
const statusBadge = (row: Locator) => row.locator('[data-slot="badge"]');

// Create Booking Drawer
const drawer = page.locator('[data-vaul-drawer-direction="right"]');
const prevBtn = drawer.getByRole('button', { name: 'Précédent' });
const nextBtn = drawer.getByRole('button', { name: 'Suivant' });
const confirmCreateBtn = drawer.getByRole('button', { name: 'Confirmer la réservation' });

// Step 1
const dateTrigger = drawer.locator('form#property-search-form').getByText('Sélectionner les dates');
const citySelect = drawer.locator('#city');
const guestMinus = drawer.getByRole('button', { name: 'Diminuer' });
const guestPlus = drawer.getByRole('button', { name: 'Augmenter' });
const typeApartment = drawer.locator('#appartement');
const typeVilla = drawer.locator('#villa');

// Step 2
const propertyRadios = drawer.locator('[data-slot="radio-group-item"]');

// Step 3
const firstNameInput = drawer.locator('input[name="firstName"]');
const lastNameInput = drawer.locator('input[name="lastName"]');
const phoneInput = drawer.locator('input[name="phone"]');

// Detail Drawer
const detailTitle = drawer.locator('[data-slot="drawer-title"]');
const closeBtn = drawer.getByRole('button', { name: 'Fermer' });

// Confirm Cancel Dialog
const confirmDialog = page.locator('[data-slot="dialog-content"]');
const confirmTitle = confirmDialog.locator('[data-slot="dialog-title"]');
```
