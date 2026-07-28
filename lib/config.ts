import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface TestUser {
  email: string;
  password: string;
}

interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

interface Timeouts {
  default: number;
  api: number;
  navigation: number;
}

interface MediaConfig {
  screenshotOnFailure: boolean;
  videoOnFailure: 'off' | 'on' | 'retain-on-failure';
  videoOnSuccess: 'off' | 'on' | 'retain-on-failure';
}

class Config {
  // Environment
  readonly nodeEnv: string;

  // URLs
  readonly devBaseUrl: string;
  readonly stagingBaseUrl: string;
  readonly activeBaseUrl: string;
  readonly apiUrl: string;

  // Test Users
  readonly guestUser: TestUser;
  readonly hostUser: TestUser;
  readonly adminUser: TestUser;

  // Database
  readonly database: DatabaseConfig;

  // Timeouts
  readonly timeouts: Timeouts;

  // Media
  readonly media: MediaConfig;

  // Reporter
  readonly reporter: string;

  constructor() {
    this.nodeEnv = process.env.NODE_ENV || 'development';

    // URLs
    this.devBaseUrl = this.required('DEV_BASE_URL');
    this.stagingBaseUrl = this.required('STAGING_BASE_URL');
    this.apiUrl = this.required('API_URL');

    // Determine active base URL from PLAYWRIGHT_PROJECT or default to dev
    const project = process.env.PLAYWRIGHT_PROJECT || 'dev';
    this.activeBaseUrl = project === 'staging' ? this.stagingBaseUrl : this.devBaseUrl;

    // Test Users
    this.guestUser = {
      email: this.required('TEST_USER_EMAIL'),
      password: this.required('TEST_USER_PASSWORD'),
    };

    this.hostUser = {
      email: process.env.TEST_HOST_EMAIL || '',
      password: process.env.TEST_HOST_PASSWORD || '',
    };

    this.adminUser = {
      email: process.env.ADMIN_EMAIL || '',
      password: process.env.ADMIN_PASSWORD || '',
    };

    // Database
    this.database = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      name: process.env.DB_NAME || 'stayzi_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

    // Timeouts
    this.timeouts = {
      default: parseInt(process.env.DEFAULT_TIMEOUT || '30000', 10),
      api: parseInt(process.env.API_TIMEOUT || '15000', 10),
      navigation: parseInt(process.env.NAVIGATION_TIMEOUT || '60000', 10),
    };

    // Media
    this.media = {
      screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
      videoOnFailure: (process.env.VIDEO_ON_FAILURE as MediaConfig['videoOnFailure']) || 'retain-on-failure',
      videoOnSuccess: (process.env.VIDEO_ON_SUCCESS as MediaConfig['videoOnSuccess']) || 'off',
    };

    // Reporter
    this.reporter = process.env.REPORTER || 'html';
  }

  /**
   * Get required env variable — throws if missing
   */
  private required(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  /**
   * Check if a test user account is configured
   */
  hasHostUser(): boolean {
    return !!(this.hostUser.email && this.hostUser.password);
  }

  hasAdminUser(): boolean {
    return !!(this.adminUser.email && this.adminUser.password);
  }

  /**
   * Get the current environment name
   */
  get environment(): string {
    const project = process.env.PLAYWRIGHT_PROJECT || 'dev';
    return project;
  }
}

// Singleton — import this everywhere
export const config = new Config();