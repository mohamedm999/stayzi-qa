import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { SignupPage } from '@pages/signup.page';
import { DashboardPage } from '@pages/dashboard.page';
import { ApiHelper } from '@helpers/api.helper';
import { AuthHelper } from '@helpers/auth.helper';

interface TestFixtures {
  loginPage: LoginPage;
  signupPage: SignupPage;
  dashboardPage: DashboardPage;
  apiHelper: ApiHelper;
  authHelper: AuthHelper;
}

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  signupPage: async ({ page }, use) => {
    const signupPage = new SignupPage(page);
    await use(signupPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  apiHelper: async ({ request }, use) => {
    const api = new ApiHelper(request);
    await use(api);
  },

  authHelper: async ({ request }, use) => {
    const auth = new AuthHelper(request);
    await use(auth);
  },
});

export { expect } from '@playwright/test';
