import { FullConfig, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  const apiUrl = process.env.API_URL || 'https://api-dev.stayzi.app/api/v1';
  const baseUrl = process.env.BASE_URL || 'https://dev.stayzi.app';
  const email = process.env.TEST_USER_EMAIL || '';
  const password = process.env.TEST_USER_PASSWORD || '';

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env');
  }

  console.log(`[globalSetup] Logging in as ${email}...`);

  const loginRes = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!loginRes.ok) {
    throw new Error(`API login failed: ${loginRes.status}`);
  }

  const { data } = await loginRes.json();
  const { accessToken, refreshToken } = data;

  if (!accessToken) {
    throw new Error('No accessToken in login response');
  }

  console.log('[globalSetup] Got tokens from API');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = new URL(baseUrl);
  await context.addCookies([
    {
      name: 'access_token',
      value: accessToken,
      domain: url.hostname,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
    {
      name: 'refresh_token',
      value: refreshToken || '',
      domain: url.hostname,
      path: '/',
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ]);

  console.log('[globalSetup] Cookies injected, performing browser login...');

  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' });

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();

  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const curUrl = page.url();
    if (curUrl.includes('/concierge/')) {
      console.log(`[globalSetup] Login successful, at: ${curUrl}`);
      break;
    }
    await page.waitForTimeout(1000);
  }

  if (!page.url().includes('/concierge/')) {
    throw new Error(`Login redirect failed. Current URL: ${page.url()}`);
  }

  await page.waitForLoadState('networkidle');

  const authDir = path.resolve(process.cwd(), '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const statePath = path.resolve(authDir, 'user.json');
  const state = await context.storageState();
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

  const cookies = state.cookies.map(c => `${c.name}@${c.domain}`);
  console.log(`[globalSetup] Cookies saved: ${cookies.join(', ') || 'none'}`);
  console.log(`[globalSetup] Auth state saved to ${statePath}`);

  await browser.close();
}

export default globalSetup;
