import { FullConfig } from '@playwright/test';
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

  const response = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const body = await response.json();
  const { accessToken, refreshToken } = body.data;

  if (!accessToken) {
    throw new Error('No accessToken in login response');
  }

  const authDir = path.resolve(process.cwd(), '.auth');
  fs.mkdirSync(authDir, { recursive: true });

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: baseUrl,
        localStorage: [
          { name: 'accessToken', value: accessToken },
          { name: 'refreshToken', value: refreshToken },
        ],
      },
    ],
  };

  const statePath = path.resolve(authDir, 'user.json');
  fs.writeFileSync(statePath, JSON.stringify(storageState, null, 2));
  console.log(`[globalSetup] Auth state saved to ${statePath}`);
}

export default globalSetup;
