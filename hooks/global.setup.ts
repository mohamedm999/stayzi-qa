import { FullConfig, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

async function globalSetup(config: FullConfig) {
  const apiUrl = process.env.API_URL || 'https://api-dev.stayzi.app/api/v1';
  const baseUrl = process.env.BASE_URL || 'https://dev.stayzi.app';
  const email = process.env.TEST_USER_EMAIL || '';
  const password = process.env.TEST_USER_PASSWORD || '';

  if (!email || !password) {
    throw new Error('TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env');
  }

  const authDir = path.resolve(process.cwd(), '.auth');
  const statePath = path.resolve(authDir, 'user.json');

  // Skip browser login if auth state is fresh (< 30 min old)
  if (fs.existsSync(statePath)) {
    const age = Date.now() - fs.statSync(statePath).mtimeMs;
    if (age < 30 * 60 * 1000) {
      logger.info('Auth state is fresh, skipping browser login');
      return;
    }
  }

  logger.step(`Logging in as ${email}...`);

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

  logger.success('Got tokens from API');

  const apiDomain = new URL(apiUrl).hostname;
  const frontDomain = new URL(baseUrl).hostname;

  // Disable PWDEBUG for global setup — inspector interferes with automated login
  const savedPwDebug = process.env.PWDEBUG;
  delete process.env.PWDEBUG;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Set cookies on BOTH frontend and API domains
    await context.addCookies([
      {
        name: 'access_token',
        value: accessToken,
        domain: frontDomain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
      {
        name: 'refresh_token',
        value: refreshToken || '',
        domain: frontDomain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
      {
        name: 'access_token',
        value: accessToken,
        domain: apiDomain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
      {
        name: 'refresh_token',
        value: refreshToken || '',
        domain: apiDomain,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ]);

    logger.step('Cookies injected, performing browser login...');

    // Navigate directly to dashboard — cookies should authenticate
    await page.goto(`${baseUrl}/concierge/dashboard`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // If cookies worked, we're on the dashboard
    if (page.url().includes('/concierge/')) {
      logger.success(`Login successful, at: ${page.url()}`);
    } else {
      // Fallback: fill the login form
      logger.step('Cookie auth did not redirect, trying form login...');

      try {
        await page.locator('#email').fill(email, { timeout: 5000 });
        await page.locator('#password').fill(password, { timeout: 5000 });
        await page.getByRole('button', { name: 'Se connecter' }).click({ timeout: 5000 });

        await page.waitForURL('**/concierge/**', { timeout: 30000 });
        logger.success(`Login successful, at: ${page.url()}`);
      } catch {
        // Take screenshot for diagnosis
        const screenshotPath = path.resolve(authDir, 'login-failure.png');
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        logger.warn(`Login form failed. Screenshot: ${screenshotPath}`);
        logger.warn(`Current URL: ${page.url()}`);
        logger.info('Saving auth state from API tokens only');
      }
    }

    await page.waitForLoadState('networkidle').catch(() => {});

    fs.mkdirSync(authDir, { recursive: true });

    const state = await context.storageState();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

    const cookies = state.cookies.map((c) => `${c.name}@${c.domain}`);
    logger.info(`Cookies saved: ${cookies.join(', ') || 'none'}`);
    logger.info(`Auth state saved to ${statePath}`);
  } finally {
    if (savedPwDebug) process.env.PWDEBUG = savedPwDebug;
    await browser.close();
  }
}

export default globalSetup;
