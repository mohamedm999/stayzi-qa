# Stayzi — Police Forms Page Deep Analysis
## `/concierge/police-forms` — Test Locators, Workflows & Component Structure

---

## 1. PAGE ARCHITECTURE

```
/concierge/police-forms
├── Page Header: h1 "Fiches de police" + subtitle + Refresh button
├── SummaryCards (4 stat cards)
│   ├── Total (FileText icon, blue)
│   ├── En attente (Clock icon, amber)
│   ├── Soumises (CheckCircle2 icon, emerald)
│   └── Non générées (AlertCircle icon, slate)
├── ChartsGrid (2 charts, lg:grid-cols-2)
│   ├── ChartCard: "Taux de soumission" → StayziRadialChart
│   └── ChartCard: "Répartition des fiches" → StayziPieChart
├── Toolbar
│   ├── SearchInput (guest name, phone, ID)
│   └── FiltersButton (Popover with 2 Select dropdowns)
│       ├── Statut du séjour (4 options)
│       └── Statut fiche (4 options)
├── Active Filters Bar (conditional)
│   ├── "{N} résultats sur {M}"
│   └── "Réinitialiser" button
├── Error Banner (conditional)
│   ├── AlertCircle icon + "Erreur de chargement"
│   └── "Réessayer" button
├── Table (7 columns, 10 rows/page)
│   ├── Skeleton rows (loading state)
│   ├── Empty state (InboxIcon + contextual message)
│   └── Data rows (with conditional rendering per status)
├── Pagination (conditional, totalPages > 1)
│   ├── "Page X sur Y"
│   └── Numbered page buttons with ellipsis
├── DocumentPreviewDialog (Dialog, sm:max-w-2xl)
│   ├── Title: "Passeport" or "Carte Nationale"
│   └── Image(s): Recto + Verso (conditional grid)
├── ConfirmActionAlertDialog
│   ├── Title: "Confirmer l'action"
│   ├── Description: varies by action
│   ├── Cancel: "Annuler"
│   └── Confirm: destructive button
└── CopyLinkButton (Tooltip + clipboard API)
```

**Source chunks:**
- `0r4p20ptomh5f.js` (40KB) — Main page: hook, table, charts, filters, dialogs, pagination, download, actions
- `0zah-kv-uu~0k.js` (381KB) — Recharts library (charts rendering)
- `0..~g0hk6~lsu.js` (26KB) — Select component (Radix), ExternalLink icon
- `0h5j1yhpsps2l.js` (32KB) — Process polyfill (Next.js bundling)
- `turbopack-0iedekeijl8yt.js` (11KB) — Turbopack runtime manifest

---

## 2. DATA FLOW

### 2.1 Data Fetching Sequence

```
1. bookingService.getAll()
   → Returns all bookings/stays, sorted by createdAt DESC
   
2. Extract stayFicheId from each stay's documents.fichePolice
   → Collects array of non-null stayFicheIds
   
3. GET /stays/fiche-statuses?ids=id1,id2,id3,...
   → Returns { [stayFicheId]: { status, documentType, documentImageUrl, documentBackImageUrl } }
   
4. Enrich each stay with ficheStatus:
   - If stayFicheId exists AND API returned data:
     - status === "COMPLETED" || status === "REJECTED" → use API status
     - Otherwise → ficheStatus = "PENDING"
   - If stayFicheId exists BUT API returned nothing → ficheStatus = "PENDING"
   - If no stayFicheId → ficheStatus = "NO_FORM"
```

### 2.2 State Variables

| Variable | Type | Initial | Purpose |
|---|---|---|---|
| `stays` | `StayWithFiche[]` | `[]` | All stays enriched with fiche data |
| `loading` | `boolean` | `true` | Data fetch in progress |
| `error` | `string \| null` | `null` | Error message |
| `refreshKey` | `number` | `0` | Triggers re-fetch on increment |
| `searchGuest` | `string` | `""` | Search input value |
| `filterStatus` | `string` | `"ALL"` | Stay status filter |
| `filterFiche` | `string` | `"ALL"` | Fiche status filter |
| `page` | `number` | `1` | Current page |
| `downloading` | `string \| null` | `null` | stayFicheId being downloaded (or null) |
| `confirm` | `ConfirmState` | `{open:false,stayId:"",action:"activate",label:""}` | Confirm dialog state |
| `actionLoading` | `boolean` | `false` | Action in progress |
| `hasActiveFilters` | `boolean` (derived) | — | Any non-default filter active |
| `stats` | `Stats` (derived) | — | {total, pending, submitted, noForm} |

---

## 3. STATUS MAPS

### 3.1 Stay Status Map (Y variable)

| Status | French Label | Badge Variant |
|---|---|---|
| `UPCOMING` | "À venir" | `secondary` |
| `ACTIVE` | "En cours" | `default` |
| `COMPLETED` | "Terminée" | `success-light` |
| `CANCELLED` | "Annulée" | `destructive-light` |

### 3.2 Fiche Status Map (Q variable)

| Status | French Label | Badge Variant | Icon |
|---|---|---|---|
| `COMPLETED` | "Soumise" | `success-light` | CheckCircle2 (size-3) |
| `PENDING` | "En attente" | `warning-light` | Clock (size-3) |
| `REJECTED` | "Rejetée" | `destructive-light` | AlertCircle (size-3) |
| `NO_FORM` | "Non générée" | `secondary` | AlertCircle (size-3) |

### 3.3 Document Type Map ($ variable)

| Type Key | French Label |
|---|---|
| `PASSPORT` | "Passeport" |
| `NATIONAL_ID` | "Carte Nationale" |

---

## 4. API ENDPOINTS

### 4.1 Data Fetching

| Method | Endpoint | Purpose | Params | Response |
|---|---|---|---|---|
| `GET` | `bookingService.getAll()` | Fetch all stays/bookings | — | `{data: Stay[]}` |
| `GET` | `/stays/fiche-statuses` | Batch fetch fiche statuses | `ids: string (comma-separated)` | `{data: { [stayFicheId]: FicheStatus }}` |

### 4.2 Actions

| Method | Endpoint | Purpose | Trigger |
|---|---|---|---|
| `PATCH` | `/stays/${stayId}/activate` | Activate a stay | Confirm dialog → "activate" action |
| `PATCH` | `/stays/${stayId}/complete` | Complete a stay | Confirm dialog → "complete" action |
| `DELETE`/`POST` | `bookingService.cancel(stayId)` | Cancel a stay | Confirm dialog → "cancel" action |

### 4.3 Downloads

| Method | Endpoint | Purpose | Response Type |
|---|---|---|---|
| `GET` | `/fiche-police/download-all?stayFicheId={id}` | Download police form PDF | `arraybuffer` → Blob → `fiche_police_{guestName}.pdf` |

### 4.4 API Base

All API calls route through `q.api` (axios instance) → `api-dev.stayzi.app/api/v1/...`

---

## 5. FILTER SYSTEM

### 5.1 Filter Fields Definition (I variable)

```js
const filterFields = [
  {
    key: "stayStatus",
    label: "Statut du séjour",
    allLabel: "Tous les séjours",
    options: [
      { value: "UPCOMING", label: "À venir" },
      { value: "ACTIVE",   label: "En cours" },
      { value: "COMPLETED", label: "Terminé" },
      { value: "CANCELLED", label: "Annulé" },
    ]
  },
  {
    key: "ficheStatus",
    label: "Statut fiche",
    allLabel: "Toutes les fiches",
    options: [
      { value: "PENDING",   label: "En attente" },
      { value: "COMPLETED", label: "Soumises" },
      { value: "REJECTED",  label: "Rejetées" },
      { value: "NO_FORM",   label: "Non générées" },
    ]
  }
]
```

### 5.2 Search Logic

Searches across 4 fields (case-insensitive):
1. `client?.firstName`
2. `client?.lastName`
3. `client?.phone`
4. `_id` (stay ID)

### 5.3 Filter Pipeline

```
All stays → search filter → stayStatus filter → ficheStatus filter → paginate (10/page)
```

---

## 6. TABLE STRUCTURE

### 6.1 Columns (7 total)

| # | Header | Content | Notes |
|---|---|---|---|
| 1 | "Client" | Guest name (bold) + phone (muted) | `[firstName, lastName].filter(Boolean).join(" ")` or "Client inconnu" |
| 2 | "Pers." | Guest count | Amber circle badge with number, or "—" |
| 3 | "Statut séjour" | Stay status badge | Uses Y map, Badge component |
| 4 | "Statut fiche" | Fiche status badge + icon | Uses Q map, Badge with icon |
| 5 | "Document" | Document thumbnail + type label | Clickable → opens DocumentPreviewDialog |
| 6 | "Lien fiche" | Truncated URL + Copy button | Shows last 20 chars of URL, CopyLinkButton component |
| 7 | "Actions" | Download PDF + External link + Status actions | Right-aligned, button group |

### 6.2 Cell Details

**Column 1 — Client:**
- Name: `<div class="font-medium">{name}</div>`
- Phone: `<div class="text-xs text-muted-foreground">{phone ?? "—"}</div>`

**Column 2 — Pers.:**
- Guest count in amber circle: `<span class="inline-flex size-6 items-center justify-center rounded-full bg-amber text-xs font-semibold text-white">{count}</span>`
- No count: `—`

**Column 5 — Document:**
- Has document type + image: Shows `<img>` thumbnail (size-9, rounded-md, object-cover) + type label
- Has document type, no image: Shows icon (book-user for PASSPORT, id-card for NATIONAL_ID) + type label
- No document type: `—`
- **Entire cell is a `<button>`** → opens DocumentPreviewDialog

**Column 6 — Lien fiche:**
- Has URL: Shows `…{last20chars}` + CopyLinkButton
- No URL: `—`
- CopyLinkButton uses `navigator.clipboard.writeText()` with 2s "Copié !" feedback

**Column 7 — Actions:**
Three possible action buttons (all `size-8`, `variant="outline"`):
1. **Download PDF** (Download icon) — Only if `stayFicheId` exists; disabled while downloading; calls `handleDownload(stayFicheId, guestName)`
2. **External link** (ExternalLink icon) — Only if `documents.fichePolice.url` exists; opens in new tab (`target="_blank"`, `rel="noopener noreferrer"`)
3. **Status action** (context-dependent icon) — Opens ConfirmActionAlertDialog

### 6.3 Action Button per Stay Status

| Stay Status | Action Button | Icon | Confirm Message |
|---|---|---|---|
| `UPCOMING` | Activate | ArrowRight(?) | "Ce séjour passera au statut En cours. Cette action peut être annulée." |
| `ACTIVE` | Complete | Check(?) | "Ce séjour sera marqué comme terminé." |
| `CANCELLED`/`COMPLETED` | (none) | — | — |

---

## 7. DIALOGS

### 7.1 DocumentPreviewDialog (U component)

- **Trigger:** Click on Document cell (Column 5)
- **Size:** `sm:max-w-2xl`
- **Title:** `$[documentType]` → "Passeport" or "Carte Nationale" (fallback: "Document")
- **Content:**
  - Single image: Full width, `rounded-lg border object-contain`
  - Front + Back (if `backImageUrl`): `grid grid-cols-1 gap-4 sm:grid-cols-2`
  - Labels: "Recto" (front) and "Verso" (back)

### 7.2 ConfirmActionAlertDialog

- **Trigger:** Click status action button (Column 7)
- **Title:** "Confirmer l'action"
- **Description (by action):**
  - `activate`: "Ce séjour passera au statut En cours. Cette action peut être annulée."
  - `complete`: "Ce séjour sera marqué comme terminé."
  - `cancel`: "Ce séjour sera annulé. Cette action est difficile à inverser."
- **Footer buttons:**
  - "Annuler" (AlertDialogCancel, disabled during loading)
  - Action label (destructive variant, disabled during loading)
- **On confirm:** Calls `executeAction()` which dispatches to the appropriate API call

### 7.3 FiltersPopover

- **Trigger:** "Filtres" button (outline variant, with active filter count badge)
- **Content:** `PopoverContent` (align end, w-64)
  - Two Select dropdowns (stay status + fiche status)
  - "ALL" option resets to default
  - "Réinitialiser les filtres" ghost button at bottom

---

## 8. CHARTS

### 8.1 Summary Cards (_ component)

| Card | Icon | Color Scheme | Accessor |
|---|---|---|---|
| Total | FileText | blue (bg-500/10, text-600, border-500/20) | `stats.total` |
| En attente | Clock | amber (bg-500/10, text-600, border-500/20) | `stats.pending` |
| Soumises | CheckCircle2 | emerald (bg-500/10, text-600, border-500/20) | `stats.submitted` |
| Non générées | AlertCircle | slate (bg-500/10, text-600, border-500/20) | `stats.noForm` |

Layout: `sm:grid-cols-2 lg:grid-cols-4`

### 8.2 Submission Rate Radial Chart (O component, card 1)

- **Title:** "Taux de soumission"
- **Description:** "{submitted} fiches soumises sur {total} séjours"
- **Type:** StayziRadialChart (gauge/radial)
- **Props:** value=percentage, max=100, label="Fiches soumises", sublabel="{submitted} / {total}", color="#2f855a", height=210, size="lg"

### 8.3 Fiche Distribution Pie Chart (O component, card 2)

- **Title:** "Répartition des fiches"
- **Description:** "Statuts de toutes les fiches de police"
- **Type:** StayziPieChart (donut)
- **Data (filtered to value > 0):**

| Segment | Color | Value |
|---|---|---|
| Soumises | #2f855a (green) | `stats.submitted` |
| En attente | #f59e0b (amber) | `stats.pending` |
| Non générées | #d1d5db (gray) | `stats.noForm` |

- **Props:** height=210, innerRadius=52, outerRadius=82

---

## 9. PAGINATION

### 9.1 Configuration

- **Page size:** 10 rows (hardcoded: `w.slice((page-1)*10, page*10)`)
- **Total pages:** `Math.max(1, Math.ceil(filtered.length / 10))`
- **Visibility:** Hidden when totalPages <= 1

### 9.2 UI Elements

- **Info text:** "Page {current} sur {total}"
- **Prev button:** `ChevronLeft`, disabled on page 1
- **Next button:** `ChevronRight`, disabled on last page
- **Page numbers:** Shows first, last, and ±1 from current; ellipsis for gaps
- **Active page:** `variant="default"`, others `variant="outline"`
- **Button size:** `size-7` (icon buttons)

---

## 10. DOWNLOAD WORKFLOW

### 10.1 PDF Download Flow

```
1. User clicks Download button (Column 7)
2. Sets downloading = stayFicheId (button shows spinner)
3. GET /fiche-police/download-all?stayFicheId={id} (responseType: arraybuffer)
4. Create Blob({type: "application/pdf"})
5. Create object URL → programmatic <a> click
6. Filename: fiche_police_{guestName}.pdf (spaces replaced with _)
7. Revoke object URL
8. Toast success: "PDF téléchargé avec succès"
9. Reset downloading = null
```

### 10.2 Error Handling

- **Download fail:** Toast error "Impossible de télécharger le PDF. La fiche n'a peut-être pas encore été soumise."
- **Data fetch fail:** Sets error state → shows error banner with "Réessayer" button

---

## 11. EMPTY & LOADING STATES

### 11.1 Loading

- 10 skeleton rows, each with 7 skeleton cells (`h-4 w-20`)
- Table header still visible during loading
- Refresh button disabled

### 11.2 Empty States

| Condition | Icon | Message | Action |
|---|---|---|---|
| No data, no filters | InboxIcon (size-12) | "Aucune fiche de police pour le moment." | — |
| No data, has filters | InboxIcon (size-12) | "Aucune fiche ne correspond à vos filtres." | "Effacer les filtres" button |

### 11.3 Error State

- Red-tinted banner: `border-destructive/30 bg-destructive/5`
- AlertCircle icon (size-5, text-destructive)
- "Erreur de chargement" (font-medium, text-destructive)
- Error detail text (text-xs, text-muted-foreground)
- "Réessayer" button (outline, sm, ml-auto) → triggers refresh

---

## 12. TOAST MESSAGES

| Trigger | Type | Message |
|---|---|---|
| Status update success | success | "Statut mis à jour avec succès" |
| Status update error | error | Error message from API or "Erreur lors de la mise à jour du statut" |
| PDF download success | success | "PDF téléchargé avec succès" |
| PDF download error | error | "Impossible de télécharger le PDF. La fiche n'a peut-être pas encore été soumise." |
| Data fetch error | (state) | "Impossible de charger les fiches de police." |

---

## 13. KEY DATA MODEL

### 13.1 Stay Object (enriched)

```typescript
interface StayWithFiche {
  _id: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  guestCount: number | null;
  client: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;
  documents: {
    fichePolice?: {
      stayFicheId?: string;
      url?: string;  // external form URL
    };
  };
  // Enriched fields from fiche-statuses API:
  ficheStatus: 'COMPLETED' | 'PENDING' | 'REJECTED' | 'NO_FORM';
  documentType?: 'PASSPORT' | 'NATIONAL_ID' | null;
  documentImageUrl?: string | null;
  documentBackImageUrl?: string | null;
}
```

### 13.2 Fiche Status Response

```typescript
interface FicheStatusResponse {
  [stayFicheId: string]: {
    status: 'COMPLETED' | 'PENDING' | 'REJECTED';
    documentType?: 'PASSPORT' | 'NATIONAL_ID';
    documentImageUrl?: string;
    documentBackImageUrl?: string;
  };
}
```

### 13.3 Stats Object

```typescript
interface Stats {
  total: number;      // all stays count
  pending: number;    // ficheStatus === 'PENDING'
  submitted: number;  // ficheStatus === 'COMPLETED'
  noForm: number;     // ficheStatus === 'NO_FORM'
}
```

### 13.4 Confirm State

```typescript
interface ConfirmState {
  open: boolean;
  stayId: string;
  action: 'activate' | 'complete' | 'cancel';
  label: string;
}
```

---

## 14. TEST LOCATORS

### 14.1 Page Header

| Element | Locator Strategy | Value |
|---|---|---|
| Page title | `h1` text | "Fiches de police" |
| Page subtitle | `p` text (below h1) | "Suivez et gérez les formulaires de police pour chaque séjour" |
| Refresh button | `button` text | "Actualiser" |
| Table heading | `h3` text | "Fiches de police" |

### 14.2 Search

| Element | Locator Strategy | Value |
|---|---|---|
| Search input | `input[placeholder]` | "Rechercher un invité, téléphone, ID…" |
| Search parent | `div.relative` > `input` | — |

### 14.3 Filters

| Element | Locator Strategy | Value |
|---|---|---|
| Filter trigger button | `button` containing "Filtres" | — |
| Filter badge (count) | `Badge` inside filter button | Shows active filter count |
| Stay status dropdown | Select with label "Statut du séjour" | — |
| Fiche status dropdown | Select with label "Statut fiche" | — |
| "Tous les séjours" option | SelectItem value "ALL" | — |
| "Toutes les fiches" option | SelectItem value "ALL" | — |
| Reset filters | `button` text "Réinitialiser les filtres" | — |
| Active filters bar | `span` text matching "X résultat(s) sur Y" | — |
| Clear filters (inline) | `button` text "Réinitialiser" | — |

### 14.4 Summary Cards

| Element | Locator Strategy | Value |
|---|---|---|
| Total card | Card with label "Total" | — |
| Pending card | Card with label "En attente" | — |
| Submitted card | Card with label "Soumises" | — |
| No form card | Card with label "Non générées" | — |

### 14.5 Charts

| Element | Locator Strategy | Value |
|---|---|---|
| Submission rate card | Card title "Taux de soumission" | — |
| Distribution card | Card title "Répartition des fiches" | — |

### 14.6 Table

| Element | Locator Strategy | Value |
|---|---|---|
| Table | `table` | — |
| Header: Client | `th` text "Client" | — |
| Header: Pers. | `th` text "Pers." | — |
| Header: Statut séjour | `th` text "Statut séjour" | — |
| Header: Statut fiche | `th` text "Statut fiche" | — |
| Header: Document | `th` text "Document" | — |
| Header: Lien fiche | `th` text "Lien fiche" | — |
| Header: Actions | `th` text "Actions" (text-right) | — |
| Guest name cell | `td` > `div.font-medium` | Guest full name |
| Phone cell | `td` > `div.text-xs` | Phone number or "—" |
| Guest count | `td` > `span.rounded-full.bg-amber` | Number |
| Stay status badge | `td` > `Badge` (data-variant) | — |
| Fiche status badge | `td` > `Badge` with icon | — |
| Document thumbnail | `td` > `button` > `img.size-9` | — |
| Copy link button | `button` with tooltip "Copier le lien" | — |
| "Copié !" feedback | Tooltip text after copy | Auto-resets after 2s |

### 14.7 Action Buttons (per row)

| Element | Locator Strategy | Condition |
|---|---|---|
| Download PDF | Tooltip "Télécharger le PDF" | stayFicheId exists |
| External link | Tooltip "Ouvrir le formulaire" | fichePolice.url exists |
| Activate stay | Context-dependent action button | status = UPCOMING |
| Complete stay | Context-dependent action button | status = ACTIVE |

### 14.8 Dialogs

| Element | Locator Strategy | Value |
|---|---|---|
| Document dialog | Dialog title | "Passeport" or "Carte Nationale" |
| Document front label | `p` text | "Recto" |
| Document back label | `p` text | "Verso" |
| Document image | `img[alt="Document d'identité"]` | — |
| Confirm dialog title | AlertDialogTitle | "Confirmer l'action" |
| Confirm dialog desc | AlertDialogDescription | Action-specific text |
| Cancel button | AlertDialogCancel | "Annuler" |
| Confirm button | destructive AlertDialogAction | Action label |

### 14.9 Empty / Error States

| Element | Locator Strategy | Value |
|---|---|---|
| Empty icon | InboxIcon (size-12) | — |
| Empty (no data) | Text | "Aucune fiche de police pour le moment." |
| Empty (filtered) | Text | "Aucune fiche ne correspond à vos filtres." |
| Clear filters button | `button` text | "Effacer les filtres" |
| Error banner | `div.border-destructive` | — |
| Error title | `p.text-destructive` | "Erreur de chargement" |
| Retry button | `button` text | "Réessayer" |

### 14.10 Pagination

| Element | Locator Strategy | Value |
|---|---|---|
| Page info | `span.text-xs` | "Page X sur Y" |
| Prev button | Button with ChevronLeft | Disabled on page 1 |
| Next button | Button with ChevronRight | Disabled on last page |
| Page number | Button variant "default" (active) | — |
| Ellipsis | `span` text "…" | — |

---

## 15. ANIMATIONS

Charts and cards use Framer Motion:
- **Container:** `staggerChildren: 0.12`
- **Item:** Fade-in + slide-up, `duration: 0.45`, `ease: "easeOut"`, `y: 16 → 0`

---

## 16. SECURITY & ROBUSTNESS NOTES

1. **No `data-cy` attributes** — No test IDs on any element; locators must rely on text content, ARIA roles, or CSS class patterns
2. **No rate limiting visible** — Refresh button has no debounce; rapid clicks could trigger multiple API calls
3. **API dependency** — Page fully depends on `api-dev.stayzi.app` being available; no offline mode or caching
4. **No `data-testid`** — Same as above, testing must use text/role-based selectors
5. **External link** — `target="_blank" rel="noopener noreferrer"` properly sanitised
6. **Clipboard API** — CopyLinkButton uses `navigator.clipboard.writeText()` without fallback (will fail on HTTP)
7. **Blob download** — No file size validation before creating Blob; large PDFs could crash the tab
8. **Fiche status enrichment** — Gracefully handles partial API failures (missing stayFicheIds default to PENDING)
9. **Confirm dialog** — Blocks during action execution (actionLoading disables both buttons)
10. **No URL validation** — The external form link (`documents.fichePolice.url`) is rendered as-is without sanitization