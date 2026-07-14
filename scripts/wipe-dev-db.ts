import { chromium } from '@playwright/test';

const BASE = 'https://dev.stayzi.app';
const API = 'https://api-dev.stayzi.app/api/v1';

async function getToken() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ahmed.benjelloun@conciergerie-marrakech.ma',
      password: 'Admin@Marrakech2024!',
    }),
  });
  const data = await res.json();
  return data.data.accessToken;
}

async function main() {
  const token = await getToken();
  console.log('Token obtained');

  const headers = { Authorization: `Bearer ${token}` };

  // 1. Delete all properties via API
  const propsRes = await fetch(`${API}/properties`, { headers });
  const props = await propsRes.json();
  for (const p of props.data.data) {
    await fetch(`${API}/properties/${p.id}`, { method: 'DELETE', headers });
    console.log(`Deleted property: ${p.name}`);
  }

  // 2. Delete all clients via browser (no API DELETE)
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  // Inject auth cookies
  const cookieRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'ahmed.benjelloun@conciergerie-marrakech.ma',
      password: 'Admin@Marrakech2024!',
    }),
  });
  const cookieData = await cookieRes.json();
  const accessToken = cookieData.data.accessToken;
  const refreshToken = cookieData.data.refreshToken;

  await context.addCookies([
    { name: 'access_token', value: accessToken, domain: 'dev.stayzi.app', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
    { name: 'refresh_token', value: refreshToken, domain: 'dev.stayzi.app', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
    { name: 'access_token', value: accessToken, domain: 'api-dev.stayzi.app', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
    { name: 'refresh_token', value: refreshToken, domain: 'api-dev.stayzi.app', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
  ]);

  const page = await context.newPage();
  await page.goto(`${BASE}/concierge/clients`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log(`Page title: ${title}`);
  console.log(`URL: ${page.url()}`);

  // Screenshot for debugging
  await page.screenshot({ path: 'scripts/clients-page.png', fullPage: true });

  // Find and click delete buttons for each client
  let deletedCount = 0;
  while (true) {
    // Look for delete buttons (trash icons, delete buttons, etc.)
    const deleteButtons = await page.locator('button:has-text("Supprimer"), button:has-text("Delete"), [data-testid*="delete"], button[aria-label*="delete"], button[aria-label*="supprimer"], button:has(svg.lucide-trash)').all();

    if (deleteButtons.length === 0) {
      console.log('No more delete buttons found');
      break;
    }

    console.log(`Found ${deleteButtons.length} delete button(s)`);

    // Click first one
    try {
      await deleteButtons[0].click();
      await page.waitForTimeout(1000);

      // Check for confirmation dialog
      const confirmBtn = page.locator('button:has-text("Confirmer"), button:has-text("Confirm"), button:has-text("Oui"), button:has-text("Yes"), button:has-text("OK")');
      if (await confirmBtn.count() > 0) {
        await confirmBtn.first().click();
        await page.waitForTimeout(2000);
        deletedCount++;
        console.log(`Deleted client #${deletedCount}`);
      } else {
        console.log('No confirmation dialog found');
        await page.screenshot({ path: `scripts/delete-dialog-${deletedCount}.png` });
        break;
      }
    } catch (e) {
      console.log(`Error deleting: ${(e as Error).message}`);
      break;
    }
  }

  // Final screenshot
  await page.screenshot({ path: 'scripts/clients-after-delete.png', fullPage: true });

  // Verify via API
  const verifyRes = await fetch(`${API}/clients`, { headers });
  const verify = await verifyRes.json();
  console.log(`\nClients remaining: ${verify.data.totalItems}`);
  for (const c of verify.data.data) {
    console.log(`  ${c.firstName} ${c.lastName} - ${c.email}`);
  }

  const propsVerify = await fetch(`${API}/properties`, { headers });
  const propsV = await propsVerify.json();
  console.log(`Properties remaining: ${propsV.data.totalItems}`);

  await browser.close();
}

main().catch(console.error);
