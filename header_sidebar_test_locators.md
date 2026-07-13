# Stayzi — Header & Sidebar Component Test Locators

## Architecture Overview

```
<html lang="fr">
  <body class="antialiased">
    <ProtectedRoute allowedRoles={["ADMIN_CONCIERGERIE"]}>
      <SidebarProvider defaultOpen={true} collapsible="icon">
        <ConciergeSidebar />          ← LEFT SIDEBAR
        <SidebarInset>                ← MAIN CONTENT AREA
          <header>                     ← TOP HEADER BAR
            <SidebarTrigger />
          </header>
          <div>                        ← PAGE CONTENT (flex-1)
            <ParallelRouter />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  </body>
</html>
```

**Source chunks:**
- Sidebar primitives: `04zne6xibfhlz.js` (module 530909)
- ConciergeSidebar + navItems: `0ctytw3yom5~2.js` (module 440132)
- ProtectedRoute: `04zne6xibfhlz.js` (module 45350)
- DropdownMenu wrappers: `04zne6xibfhlz.js` (local functions tu/tc/tp/tg/th/tf/tm)

---

## 1. HEADER COMPONENT

### 1.1 Header Element

The header is **server-rendered** in the layout RSC tree. It is extremely minimal — only contains a `SidebarTrigger` button.

**Rendered HTML:**
```html
<header class="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 bg-background px-4 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
  <!-- SidebarTrigger button -->
</header>
```

### 1.2 SidebarTrigger Button

Renders as a shadcn `<Button>` with `variant="ghost"` and `size="icon-sm"`.

**Rendered HTML:**
```html
<button
  type="button"
  data-slot="sidebar-trigger"
  data-sidebar="trigger"
  data-slot="button"
  data-size="icon-sm"
  class="inline-flex items-center justify-center size-7 rounded-[var(--radius-md),12px] ..."
  aria-label="Toggle Sidebar"
>
  <!-- When sidebar EXPANDED: PanelLeftClose icon (panels with left arrow) -->
  <!-- When sidebar COLLAPSED: PanelLeftOpen icon (panels with right arrow) -->
  <span class="sr-only">Toggle Sidebar</span>
</button>
```

**Note:** The Button component adds `data-slot="button"`. The SidebarTrigger adds `data-slot="sidebar-trigger"` and `data-sidebar="trigger"`. The `icon-sm` size maps to `size-7` class.

| Locator Strategy | Selector | Notes |
|---|---|---|
| `data-slot` | `[data-slot="sidebar-trigger"]` | ✅ **RECOMMENDED** — Most stable |
| `data-sidebar` | `[data-sidebar="trigger"]` | ✅ Good alternative |
| `aria-label` | `button[aria-label="Toggle Sidebar"]` | ✅ Good |
| `role` + text | `getByRole("button", { name: "Toggle Sidebar" })` | ✅ Playwright recommended |
| Icon (expanded) | `svg.lucide-panel-left-close` | For state assertion |
| Icon (collapsed) | `svg.lucide-panel-left-open` | For state assertion |

### 1.3 SidebarToggle Keyboard Shortcut

The `SidebarProvider` registers a global keyboard listener:
- **Ctrl+B** (or **Cmd+B** on Mac) toggles the sidebar.

### 1.4 Header Test Scenarios

```typescript
// Toggle sidebar
await page.getByLabel('Toggle Sidebar').click();

// Assert sidebar state
const wrapper = page.locator('[data-slot="sidebar-wrapper"]');
await expect(wrapper).toHaveAttribute('data-state', 'expanded'); // or 'collapsed'

// Keyboard shortcut
await page.keyboard.press('Control+b');
```

---

## 2. SIDEBAR COMPONENT (ConciergeSidebar)

### 2.1 Sidebar Structure

```
Sidebar (collapsible="icon", variant="sidebar")
├── SidebarHeader
│   └── SidebarMenuButton (size="lg") → Logo + "Stayzi" / "Entreprise"
├── SidebarContent
│   └── NavMain (navItems)
│       └── SidebarGroup
│           └── SidebarMenu (gap-1)
│               ├── SidebarMenuItem → "Dashboard"     [/concierge/dashboard]
│               ├── SidebarMenuItem → "Clients"       [/concierge/clients]
│               ├── SidebarMenuItem → "Biens"         [/concierge/properties]
│               ├── SidebarMenuItem → "Réservations"  [/concierge/bookings]
│               ├── SidebarMenuItem → "Fiche de police" [/concierge/police-forms]
│               ├── SidebarMenuItem → "Livrets d'accueil" [/concierge/livret]
│               ├── SidebarMenuItem → "Messages"      [/concierge/messages]
│               ├── SidebarMenuItem → "Collaborateurs" [/concierge/collaborators]
│               ├── SidebarMenuItem → "Proprietaires" [/concierge/owners] ⚠️ DISABLED
│               └── SidebarMenuItem → "Suivi financièrs" [/concierge/finances] ⚠️ DISABLED
├── SidebarFooter
│   └── NavUser (user dropdown)
└── SidebarRail (invisible drag handle, left edge)
```

### 2.2 Sidebar Wrapper

```html
<div
  data-slot="sidebar-wrapper"
  style="--sidebar-width: 16rem; --sidebar-width-icon: 3rem"
  class="group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar"
  data-state="expanded"           ← "expanded" | "collapsed"
  data-collapsible="icon"          ← always "icon" for this app
  data-variant="sidebar"
  data-side="left"
>
```

### 2.3 Sidebar Container (Desktop)

```html
<div
  data-slot="sidebar-container"
  data-side="left"
  class="fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) ... md:flex
         group-data-[side=left]:border-r
         group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
>
  <div data-sidebar="sidebar" data-slot="sidebar-inner"
       class="flex size-full flex-col bg-sidebar ...">
    <!-- SidebarHeader + SidebarContent + SidebarFooter -->
  </div>
</div>
```

### 2.4 Sidebar (Mobile — Drawer)

On mobile (`< 768px`), the sidebar renders as a **Vaul Drawer** (sheet from left):

```html
<dialog
  data-vaul-drawer-overlay=""
  data-state="open"           ← or "closed"
  class="fixed inset-0 z-50 bg-black/80 ..."
></dialog>
<div
  data-vaul-drawer
  data-vaul-drawer-direction="left"
  data-state="open"           ← or "closed"
  class="fixed inset-y-0 left-0 z-50 h-full w-3/4 max-w-sm ..."
>
  <div data-sidebar="sidebar" data-slot="sidebar" data-mobile="true"
       class="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
       style="--sidebar-width: 18rem">
    <!-- Same inner content -->
  </div>
</div>
```

**Key difference on mobile:** `[&>button]:hidden` hides the close button inside the drawer.

---

## 3. SIDEBAR HEADER (Logo Area)

### 3.1 Structure

```html
<div data-slot="sidebar-header" data-sidebar="header" class="flex flex-col gap-2 p-2">
  <button
    data-slot="sidebar-menu-button"
    data-sidebar="menu-button"
    data-size="lg"
    class="... group/menu-button relative flex w-full items-center rounded-md ..."
  >
    <div class="flex aspect-square size-8 items-center justify-center">
      <img src="/stayzi-logo.png" alt="Stayzi" width="32" height="32" class="object-contain" />
    </div>
    <div class="grid flex-1 text-left text-sm leading-tight">
      <span class="truncate font-medium">Stayzi</span>
      <span class="truncate text-xs">Entreprise</span>
    </div>
  </button>
</div>
```

**Note:** This is NOT a link — it's a `SidebarMenuButton` without `asChild`, so it renders as a `<button>`. It does NOT navigate anywhere.

### 3.2 Locators

| Locator | Selector | Notes |
|---|---|---|
| Logo image | `img[alt="Stayzi"]` | ✅ Stable |
| Brand name | `sidebar >> text="Stayzi"` | ✅ |
| Subtitle | `sidebar >> text="Entreprise"` | ✅ |
| Header button | `[data-slot="sidebar-header"] [data-slot="sidebar-menu-button"]` | ✅ |

---

## 4. SIDEBAR NAVIGATION (NavMain)

### 4.1 Nav Items Data

```javascript
const navItems = [
  { title: "Dashboard",       url: "/concierge/dashboard",     icon: LayoutDashboard, disabled: false },
  { title: "Clients",         url: "/concierge/clients",       icon: Users2,          disabled: false },
  { title: "Biens",           url: "/concierge/properties",    icon: Building2,        disabled: false },
  { title: "Réservations",    url: "/concierge/bookings",      icon: CalendarDays,     disabled: false },
  { title: "Fiche de police", url: "/concierge/police-forms",  icon: FileText,         disabled: false },
  { title: "Livrets d'accueil", url: "/concierge/livret",      icon: BookOpen,         disabled: false },
  { title: "Messages",        url: "/concierge/messages",      icon: MessageSquare,    disabled: false },
  { title: "Collaborateurs",  url: "/concierge/collaborators", icon: Briefcase,        disabled: false },
  { title: "Proprietaires",   url: "/concierge/owners",        icon: Home,             disabled: true  },
  { title: "Suivi financièrs", url: "/concierge/finances",     icon: TrendingUp,       disabled: true  },
];
```

### 4.2 Active State Logic

```javascript
const pathname = usePathname();
const isActive = pathname === item.url;
```

**Active item classes:** `data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:hover:bg-primary/90!`

### 4.3 Enabled Item Rendered HTML

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
  <a data-slot="sidebar-menu-button" data-sidebar="menu-button"
     data-size="default" data-active="true"        ← boolean string when active
     href="/concierge/dashboard"
     class="... hover:bg-sidebar-accent ... data-[active=true]:bg-primary data-[active=true]:text-white ..."
     data-radix-tooltip-content-trigger=""           ← tooltip trigger
  >
    <svg class="lucide layout-dashboard ..."><!-- icon --></svg>
    <span>Dashboard</span>
  </a>
</li>
```

**Note:** Enabled items use `asChild: true` → renders as `<a>` (Link component).

### 4.4 Disabled Item Rendered HTML

```html
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
  <button
    data-slot="sidebar-menu-button"
    data-sidebar="menu-button"
    data-size="default"
    class="cursor-not-allowed opacity-45 ..."
    disabled
  >
    <svg class="lucide home ..."><!-- icon --></svg>
    <span class="flex-1">Proprietaires</span>
    <svg class="lucide hard-hat ml-auto size-3.5 shrink-0"><!-- hard-hat icon --></svg>
  </button>
</li>
```

**Disabled items:** Render as `<button disabled>` with `cursor-not-allowed opacity-45`. Show a **hard-hat icon** (construction) as suffix with tooltip `"Proprietaires — bientôt disponible"`.

### 4.5 Collapsed State (icon-only)

When sidebar is collapsed (`data-state="collapsed"`), the sidebar shrinks to `--sidebar-width-icon: 3rem`. Nav item text is hidden, only icons are visible. Hovering shows a **tooltip** with the nav item title.

### 4.6 Navigation Locators

| What | Locator | Notes |
|---|---|---|
| Nav menu | `[data-slot="sidebar-menu"]` | ✅ Container for all items |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Dashboard" })` | ✅ **RECOMMENDED** |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Clients" })` | ✅ |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Biens" })` | ✅ |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Réservations" })` | ✅ |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Fiche de police" })` | ✅ |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Livrets d'accueil" })` | ✅ |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Messages" })` | ✅ |
| Nav item (by text) | `sidebar >> getByRole("link", { name: "Collaborateurs" })` | ✅ |
| Disabled item | `sidebar >> getByRole("button", { name: "Proprietaires" })` | ✅ Disabled = button, not link |
| Disabled item | `sidebar >> getByRole("button", { name: "Suivi financièrs" })` | ✅ |
| Active indicator | `[data-slot="sidebar-menu-button"][data-active="true"]` | ✅ |
| Active item | `getByRole("link").filter({ has: page.locator('[data-active="true"]') })` | ✅ |
| Hard-hat icon (disabled) | `svg.lucide-hard-hat` | Only on disabled items |
| By href | `a[href="/concierge/dashboard"]` | ✅ Stable |

### 4.7 Tooltip (collapsed state)

When sidebar is collapsed, hovering a nav item shows a Radix tooltip:

```html
<div
  data-radix-popper-content-wrapper=""
  style="transform-origin: var(--radix-tooltip-content-transform-origin) ..."
>
  <div
    role="tooltip"
    data-state="delayed-open"
    class="z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 ..."
    data-side="right" data-align="center"
  >
    Dashboard
  </div>
</div>
```

---

## 5. SIDEBAR FOOTER — NavUser (User Menu)

### 5.1 Structure

```html
<div data-slot="sidebar-footer" data-sidebar="footer" class="flex flex-col gap-2 p-2">
  <ul data-slot="sidebar-menu" data-sidebar="menu">
    <li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
      <!-- DropdownMenu wrapper -->
      <div data-slot="dropdown-menu">
        <!-- Trigger -->
        <button
          type="button"
          data-slot="dropdown-menu-trigger"
          data-slot="sidebar-menu-button"
          data-sidebar="menu-button"
          data-size="lg"
          class="... data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ..."
          aria-haspopup="menu"
          aria-expanded="false"      ← "true" when open
          data-state="closed"        ← "open" when dropdown is open
        >
          <!-- Avatar with initials -->
          <div class="relative flex size-8 shrink-0 rounded-full select-none ...">
            <div data-slot="avatar-fallback"
                 class="flex size-full items-center justify-center rounded-full bg-primary text-white text-sm ..."
            >AB</div>   ← First letter of firstName + lastName, UPPERcased
          </div>
          <!-- User info -->
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">Ahmed Benjelloun</span>
            <span class="truncate text-xs">ahmed.benjelloun@conciergerie-marrakech.ma</span>
          </div>
          <!-- ChevronDown icon -->
          <svg class="lucide chevron-down ml-auto size-4">...</svg>
        </button>

        <!-- Dropdown Content (hidden by default) -->
        <div data-slot="dropdown-menu-content"
             class="z-50 min-w-56 rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ..."
             data-side="right" data-align="end"
             style="--radix-dropdown-menu-content-available-height: ..."
        >
          <!-- User Label (non-interactive) -->
          <div data-slot="dropdown-menu-label" class="p-0 font-normal text-forground">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <div class="relative flex size-8 rounded-lg ...">
                <div data-slot="avatar-fallback" class="... bg-primary text-white ...">AB</div>
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">Ahmed Benjelloun</span>
                <span class="truncate text-xs">ahmed...@conciergerie-marrakech.ma</span>
              </div>
            </div>
          </div>

          <!-- Separator -->
          <div data-slot="dropdown-menu-separator" class="-mx-1 my-1 h-px bg-border" role="separator"></div>

          <!-- Upgrade to Pro -->
          <div data-slot="dropdown-menu-group">
            <div data-slot="dropdown-menu-item" class="...">
              <svg class="lucide sparkles ...">...</svg>
              Upgrade to Pro
            </div>
          </div>

          <!-- Separator -->
          <div data-slot="dropdown-menu-separator" ...></div>

          <!-- Account / Billing / Notifications -->
          <div data-slot="dropdown-menu-group">
            <div data-slot="dropdown-menu-item" ...>
              <svg class="lucide badge-check ...">...</svg>
              Account
            </div>
            <div data-slot="dropdown-menu-item" ...>
              <svg class="lucide credit-card ...">...</svg>
              Billing
            </div>
            <div data-slot="dropdown-menu-item" ...>
              <svg class="lucide bell ...">...</svg>
              Notifications
            </div>
          </div>

          <!-- Separator -->
          <div data-slot="dropdown-menu-separator" ...></div>

          <!-- Log out (destructive variant) -->
          <div data-slot="dropdown-menu-item" data-variant="destructive" class="... text-destructive ...">
            <svg class="lucide log-out ...">...</svg>
            Log out
          </div>
        </div>
      </div>

      <!-- Logout Confirmation AlertDialog -->
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent size="default" class="... sm:max-w-sm">
          <div class="flex flex-col items-center justify-center gap-2 p-8">
            <AlertDialogMedia class="rounded-full size-14 bg-violet-50 text-violet-500 ...">
              <svg class="lucide log-out size-8">...</svg>
            </AlertDialogMedia>
            <AlertDialogTitle class="text-center text-base font-semibold">
              Confirmer la déconnexion ?
            </AlertDialogTitle>
            <AlertDialogDescription class="text-center text-sm font-medium">
              Vous allez être déconnecté de votre session.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter class="grid grid-cols-2 gap-0 divide-x border-t pt-0">
            <AlertDialogCancel variant="outline" class="h-12 flex-1 rounded-none border-0 ...">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction variant="outline" class="h-12 flex-1 rounded-none border-0 ..." onClick={handleLogout}>
              Oui, déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  </ul>
</div>
```

### 5.2 User Menu Dropdown Locators

| What | Locator | Notes |
|---|---|---|
| User menu trigger | `[data-slot="dropdown-menu-trigger"]` within sidebar | ✅ Opens dropdown |
| User menu trigger | `getByRole("button", { name: /Ahmed Benjelloun/ })` | ✅ By user name |
| Avatar initials | `[data-slot="avatar-fallback"]` | Shows "AB" format |
| User name in trigger | `[data-slot="sidebar-footer"] >> text="Ahmed Benjelloun"` | ✅ |
| User email in trigger | `[data-slot="sidebar-footer"] >> text="ahmed...@conciergegerie-marrakech.ma"` | ✅ Partial match OK |
| Chevron icon | `[data-slot="sidebar-footer"] svg.lucide-chevron-down` | ✅ |
| Dropdown open state | `[data-slot="dropdown-menu-trigger"][data-state="open"]` | ✅ |
| Dropdown content | `[data-slot="dropdown-menu-content"]` | ✅ Visible when open |

### 5.3 Dropdown Menu Items

| Menu Item | Locator | Icon | Action |
|---|---|---|---|
| "Upgrade to Pro" | `[data-slot="dropdown-menu-content"] >> getByText("Upgrade to Pro")` | `lucide-sparkles` | Opens upgrade |
| "Account" | `[data-slot="dropdown-menu-content"] >> getByText("Account")` | `lucide-badge-check` | Opens account |
| "Billing" | `[data-slot="dropdown-menu-content"] >> getByText("Billing")` | `lucide-credit-card` | Opens billing |
| "Notifications" | `[data-slot="dropdown-menu-content"] >> getByText("Notifications")` | `lucide-bell` | Opens notifications |
| "Log out" | `[data-slot="dropdown-menu-content"] >> getByText("Log out")` | `lucide-log-out` | Opens confirm dialog |

**Note:** "Log out" has `data-variant="destructive"` and `text-destructive` styling.

### 5.4 Logout Confirmation Dialog Locators

| What | Locator | Notes |
|---|---|---|
| Dialog | `[data-slot="alert-dialog-content"]` | ✅ |
| Title | `[data-slot="alert-dialog-title"]` | Text: "Confirmer la déconnexion ?" |
| Description | `[data-slot="alert-dialog-description"]` | Text: "Vous allez être déconnecté de votre session." |
| Cancel button | `[data-slot="alert-dialog-cancel"]` | Text: "Annuler" |
| Confirm button | `[data-slot="alert-dialog-action"]` | Text: "Oui, déconnecter" |
| LogOut icon | `[data-slot="alert-dialog-media"] svg.lucide-log-out` | Violet circle background |

### 5.5 Logout Flow

1. Click "Log out" menu item → sets `showConfirmDialog = true`
2. AlertDialog appears with confirmation
3. Click "Annuler" → closes dialog, stays on page
4. Click "Oui, déconnecter" → calls `authService.logout()` → `router.push("/auth/login")` → toast "Déconnexion réussie"

---

## 6. SIDEBAR RAIL (Collapse Handle)

```html
<button
  data-sidebar="rail"
  data-slot="sidebar-rail"
  aria-label="Toggle Sidebar"
  tabindex="-1"
  title="Toggle Sidebar"
  class="absolute inset-y-0 z-20 hidden w-4 transition-all ... sm:flex"
></button>
```

An invisible 4px-wide button on the left edge of the main content. Only visible on `sm:` breakpoint and above.

---

## 7. SIDEBAR STATE MANAGEMENT

### 7.1 Cookie Persistence

```javascript
// On toggle:
document.cookie = `sidebar_state=${isOpen}; path=/; max-age=604800`;
```

The sidebar state is persisted as a cookie `sidebar_state` with 7-day expiry.

### 7.2 Mobile Detection

```javascript
const isMobile = window.innerWidth < 768;
```

### 7.3 Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `< 768px` (mobile) | Sidebar hidden, opens as Vaul drawer from left (`--sidebar-width: 18rem`) |
| `>= 768px` (desktop) | Sidebar fixed, collapsible to icon-only mode (`--sidebar-width: 16rem` → `3rem`) |

### 7.4 State Attributes

| Attribute | Values | Location |
|---|---|---|
| `data-state` | `"expanded"` / `"collapsed"` | `[data-slot="sidebar-wrapper"]` |
| `data-collapsible` | `"icon"` | `[data-slot="sidebar-wrapper"]` |
| `data-variant` | `"sidebar"` | `[data-slot="sidebar-wrapper"]` |
| `data-side` | `"left"` | `[data-slot="sidebar-wrapper"]`, `[data-slot="sidebar-container"]` |
| `data-active` | `"true"` (string) | Active nav item's `[data-slot="sidebar-menu-button"]` |
| `data-mobile` | (presence = true) | Mobile drawer's `[data-slot="sidebar"]` |
| `data-state` | `"open"` / `"closed"` | Mobile drawer, dropdown menu, dialog |

---

## 8. COMPLETE PLAYWRIGHT TEST EXAMPLES

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation', () => {

  test('should display all 10 nav items', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    const sidebar = page.locator('[data-slot="sidebar"]');

    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Clients')).toBeVisible();
    await expect(sidebar.getByText('Biens')).toBeVisible();
    await expect(sidebar.getByText('Réservations')).toBeVisible();
    await expect(sidebar.getByText('Fiche de police')).toBeVisible();
    await expect(sidebar.getByText("Livrets d'accueil")).toBeVisible();
    await expect(sidebar.getByText('Messages')).toBeVisible();
    await expect(sidebar.getByText('Collaborateurs')).toBeVisible();
    await expect(sidebar.getByText('Proprietaires')).toBeVisible();
    await expect(sidebar.getByText('Suivi financièrs')).toBeVisible();
  });

  test('should highlight active nav item based on current route', async ({ page }) => {
    await page.goto('/concierge/clients');
    const activeItem = page.locator('[data-slot="sidebar-menu-button"][data-active="true"]');
    await expect(activeItem).toHaveText('Clients');
  });

  test('should navigate to Clients page via sidebar', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    await page.getByRole('link', { name: 'Clients' }).click();
    await expect(page).toHaveURL('/concierge/clients');
  });

  test('disabled nav items should not be clickable links', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    // Disabled items render as <button disabled>, not <a>
    const proprietaires = page.getByRole('button', { name: 'Proprietaires' });
    await expect(proprietaires).toBeDisabled();
    // Hard-hat icon visible on disabled items
    await expect(proprietaires.locator('svg.lucide-hard-hat')).toBeVisible();
  });

  test('should collapse/expand sidebar via trigger button', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    const wrapper = page.locator('[data-slot="sidebar-wrapper"]');

    // Initially expanded
    await expect(wrapper).toHaveAttribute('data-state', 'expanded');

    // Click toggle
    await page.getByLabel('Toggle Sidebar').click();

    // Now collapsed
    await expect(wrapper).toHaveAttribute('data-state', 'collapsed');
  });

  test('should collapse/expand sidebar via Ctrl+B', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    const wrapper = page.locator('[data-slot="sidebar-wrapper"]');

    await page.keyboard.press('Control+b');
    await expect(wrapper).toHaveAttribute('data-state', 'collapsed');

    await page.keyboard.press('Control+b');
    await expect(wrapper).toHaveAttribute('data-state', 'expanded');
  });

  test('should show tooltip on collapsed sidebar nav items', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    // Collapse sidebar first
    await page.getByLabel('Toggle Sidebar').click();
    await expect(page.locator('[data-slot="sidebar-wrapper"]')).toHaveAttribute('data-state', 'collapsed');

    // Hover over a nav item
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    await dashboardLink.hover();

    // Tooltip should appear
    const tooltip = page.getByRole('tooltip', { name: 'Dashboard' });
    await expect(tooltip).toBeVisible();
  });
});

test.describe('Header', () => {

  test('should render sticky header with sidebar trigger', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header).toHaveClass(/sticky/);

    const trigger = page.locator('[data-slot="sidebar-trigger"]');
    await expect(trigger).toBeVisible();
  });

  test('sidebar trigger should have sr-only text', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    const trigger = page.getByRole('button', { name: 'Toggle Sidebar' });
    await expect(trigger).toBeVisible();
  });
});

test.describe('NavUser (User Menu)', () => {

  test('should display user name and email in sidebar footer', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    const footer = page.locator('[data-slot="sidebar-footer"]');

    await expect(footer.getByText(/Ahmed\s+Benjelloun/i)).toBeVisible();
    await expect(footer.getByText(/ahmed\.benjelloun@/i)).toBeVisible();
  });

  test('should open user dropdown menu', async ({ page }) => {
    await page.goto('/concierge/dashboard');

    // Click user trigger
    await page.locator('[data-slot="dropdown-menu-trigger"]').click();

    // Dropdown content should appear
    const content = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(content).toBeVisible();

    // Verify menu items
    await expect(content.getByText('Upgrade to Pro')).toBeVisible();
    await expect(content.getByText('Account')).toBeVisible();
    await expect(content.getByText('Billing')).toBeVisible();
    await expect(content.getByText('Notifications')).toBeVisible();
    await expect(content.getByText('Log out')).toBeVisible();
  });

  test('should show logout confirmation dialog', async ({ page }) => {
    await page.goto('/concierge/dashboard');

    // Open dropdown and click Log out
    await page.locator('[data-slot="dropdown-menu-trigger"]').click();
    await page.locator('[data-slot="dropdown-menu-content"]').getByText('Log out').click();

    // AlertDialog should appear
    const dialog = page.locator('[data-slot="alert-dialog-content"]');
    await expect(dialog).toBeVisible();
    await expect(page.locator('[data-slot="alert-dialog-title"]')).toHaveText(
      'Confirmer la déconnexion ?'
    );
    await expect(page.locator('[data-slot="alert-dialog-description"]')).toHaveText(
      'Vous allez être déconnecté de votre session.'
    );
    await expect(page.locator('[data-slot="alert-dialog-cancel"]')).toHaveText('Annuler');
    await expect(page.locator('[data-slot="alert-dialog-action"]')).toHaveText('Oui, déconnecter');
  });

  test('should cancel logout and stay on page', async ({ page }) => {
    await page.goto('/concierge/dashboard');

    await page.locator('[data-slot="dropdown-menu-trigger"]').click();
    await page.locator('[data-slot="dropdown-menu-content"]').getByText('Log out').click();

    await page.locator('[data-slot="alert-dialog-cancel"]').click();

    // Dialog should close, stay on dashboard
    await expect(page.locator('[data-slot="alert-dialog-content"]')).not.toBeVisible();
    await expect(page).toHaveURL('/concierge/dashboard');
  });

  test('should logout and redirect to login', async ({ page }) => {
    await page.goto('/concierge/dashboard');

    await page.locator('[data-slot="dropdown-menu-trigger"]').click();
    await page.locator('[data-slot="dropdown-menu-content"]').getByText('Log out').click();
    await page.locator('[data-slot="alert-dialog-action"]').click();

    // Should redirect to login (API is down so may fail, but test the intent)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('avatar should show user initials', async ({ page }) => {
    await page.goto('/concierge/dashboard');
    const avatar = page.locator('[data-slot="sidebar-footer"] [data-slot="avatar-fallback"]');
    await expect(avatar).toHaveText('AB');  // Ahmed Benjelloun → AB
  });
});

test.describe('Sidebar Responsive (Mobile)', () => {

  test('should open sidebar as drawer on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto('/concierge/dashboard');

    // Sidebar should be hidden initially on mobile
    const drawer = page.locator('[data-vaul-drawer]');
    await expect(drawer).toHaveAttribute('data-state', 'closed');

    // Open via trigger
    await page.getByLabel('Toggle Sidebar').click();
    await expect(drawer).toHaveAttribute('data-state', 'open');

    await context.close();
  });
});
```

---

## 9. QUICK REFERENCE — ALL `data-slot` ATTRIBUTES

| Component | `data-slot` | HTML Element | `data-sidebar` |
|---|---|---|---|
| Sidebar wrapper | `sidebar-wrapper` | `<div>` | — |
| Sidebar container | `sidebar-container` | `<div>` | — |
| Sidebar inner | `sidebar-inner` | `<div>` | `sidebar` |
| Sidebar header | `sidebar-header` | `<div>` | `header` |
| Sidebar content | `sidebar-content` | `<div>` | `content` |
| Sidebar footer | `sidebar-footer` | `<div>` | `footer` |
| Sidebar group | `sidebar-group` | `<div>` | `group` |
| Sidebar menu | `sidebar-menu` | `<ul>` | `menu` |
| Sidebar menu item | `sidebar-menu-item` | `<li>` | `menu-item` |
| Sidebar menu button | `sidebar-menu-button` | `<a>` or `<button>` | `menu-button` |
| Sidebar rail | `sidebar-rail` | `<button>` | `rail` |
| Sidebar inset (main) | `sidebar-inset` | `<main>` | — |
| Sidebar trigger | `sidebar-trigger` | `<button>` | `trigger` |
| Dropdown menu | `dropdown-menu` | `<div>` | — |
| Dropdown trigger | `dropdown-menu-trigger` | `<button>` | — |
| Dropdown content | `dropdown-menu-content` | `<div>` | — |
| Dropdown label | `dropdown-menu-label` | `<div>` | — |
| Dropdown separator | `dropdown-menu-separator` | `<div>` | — |
| Dropdown group | `dropdown-menu-group` | `<div>` | — |
| Dropdown item | `dropdown-menu-item` | `<div>` | — |
| Avatar | `avatar` | `<span>` | — |
| Avatar fallback | `avatar-fallback` | `<span>` | — |
| Alert dialog content | `alert-dialog-content` | `<div>` | — |
| Alert dialog title | `alert-dialog-title` | `<h2>` | — |
| Alert dialog description | `alert-dialog-description` | `<p>` | — |
| Alert dialog cancel | `alert-dialog-cancel` | `<button>` | — |
| Alert dialog action | `alert-dialog-action` | `<button>` | — |
| Alert dialog media | `alert-dialog-media` | `<div>` | — |
| Separator | `separator` | `<div>` | — |
| Button | `button` | `<button>` | — |