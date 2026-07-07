import { Page, APIRequestContext } from '@playwright/test';
import { ApiHelper } from '@helpers/api.helper';
import { config } from '@utils/config';
import { logger } from '@utils/logger';

interface LoginData {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: {
    sub: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
  };
}

interface LoginResponse {
  data?: LoginData;
  message?: string;
  statusCode?: number;
  success?: boolean;
  token?: string;
  accessToken?: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface AuthState {
  token: string;
  email: string;
  role: string;
  userId: string;
}

export class AuthHelper {
  private api: ApiHelper;
  private token: string | null = null;
  private refreshTokenValue: string | null = null;
  private authState: AuthState | null = null;

  constructor(request: APIRequestContext) {
    this.api = new ApiHelper(request);
  }

  // ─── API Login ───────────────────────────────────────────────

  /**
   * Login via API and store the token
   * Returns the full login response body
   */
  async loginAsGuest(): Promise<LoginResponse> {
    return this.login(config.guestUser.email, config.guestUser.password);
  }

  async loginAsHost(): Promise<LoginResponse> {
    if (!config.hasHostUser()) {
      throw new Error('Host user credentials not configured in .env');
    }
    return this.login(config.hostUser.email, config.hostUser.password);
  }

  async loginAsAdmin(): Promise<LoginResponse> {
    if (!config.hasAdminUser()) {
      throw new Error('Admin credentials not configured in .env');
    }
    return this.login(config.adminUser.email, config.adminUser.password);
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    logger.step(`Logging in via API: ${email}`);

    const response = await this.api.postJson<LoginResponse>('/auth/login', {
      email,
      password,
    });

    if (!response.ok) {
      throw new Error(`Login failed for ${email}. Status: ${response.status}. Body: ${JSON.stringify(response.body)}`);
    }

    const body = response.body;
    const data = body.data;

    if (data) {
      this.token = data.accessToken || body.token || body.accessToken || '';
      this.refreshTokenValue = data.refreshToken || body.refreshToken || '';

      if (data.user) {
        this.authState = {
          token: this.token,
          email: data.user.email,
          role: data.user.roles?.[0] || '',
          userId: data.user.sub,
        };
      }
    } else {
      this.token = body.token || body.accessToken || '';
      this.refreshTokenValue = body.refreshToken || '';
      if (body.user) {
        this.authState = {
          token: this.token,
          email: body.user.email,
          role: body.user.role || '',
          userId: body.user.id || '',
        };
      }
    }

    logger.info(`Login successful: ${email} (role: ${this.authState?.role || 'unknown'})`);
    return body;
  }

  // ─── UI Login ────────────────────────────────────────────────

  /**
   * Login through the browser UI
   * Navigates to login page, fills form, submits, waits for redirect
   */
  async loginViaUI(page: Page, email: string, password: string): Promise<void> {
    logger.step(`Logging in via UI: ${email}`);

    await page.goto(`${config.activeBaseUrl}/login`);
    await page.waitForLoadState('domcontentloaded');

    // Fill login form
    await page.fill('input[type="email"], input[name="email"], [data-testid="email-input"]', email);
    await page.fill('input[type="password"], input[name="password"], [data-testid="password-input"]', password);

    // Submit
    await page.click('button[type="submit"], [data-testid="login-btn"]');

    // Wait for navigation away from login page
    await page.waitForURL('**/login**', { timeout: 15000 }).catch(() => {});
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    logger.info(`UI login successful: ${email}`);
  }

  // ─── Token Management ────────────────────────────────────────

  /**
   * Get the current auth token
   */
  getToken(): string {
    if (!this.token) {
      throw new Error('No auth token available. Call login() first.');
    }
    return this.token;
  }

  /**
   * Get the full auth state
   */
  getState(): AuthState {
    if (!this.authState) {
      throw new Error('No auth state available. Call login() first.');
    }
    return this.authState;
  }

  /**
   * Set token manually (e.g., from storage)
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ─── Session Storage ─────────────────────────────────────────

  /**
   * Inject token into browser storage (localStorage or cookies)
   * So the browser "thinks" the user is already logged in
   */
  async injectAuth(page: Page): Promise<void> {
    if (!this.token) {
      throw new Error('No token to inject. Call login() first.');
    }

    logger.step('Injecting auth token into browser');

    await page.goto('/');
    await page.evaluate(({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }, { accessToken: this.token, refreshToken: this.refreshTokenValue });

    logger.info('Auth token injected');
  }

  /**
   * Clear browser auth (logout via storage)
   */
  async clearAuth(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });
    logger.info('Auth cleared from browser');
  }
}