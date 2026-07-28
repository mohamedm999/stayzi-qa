import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/login.page';
import { SignupPage } from '@pages/signup.page';
import { DashboardPage } from '@pages/dashboard.page';
import { ClientsPage } from '@pages/clients.page';
import { PropertiesPage } from '@pages/properties.page';
import { BookingsPage } from '@pages/bookings.page';
import { PoliceFormsPage } from '@pages/police-forms.page';
import { VerifyOtpPage } from '@pages/verify-otp.page';
import { CollaboratorsPage } from '@pages/collaborators.page';
import { MailTmHelper } from '@lib/mail-tm.helper';
import { ApiHelper } from '@lib/api.helper';
import { AuthHelper } from '@lib/auth.helper';
import { DataGenerator } from '@lib/data.generator';
import { SidebarComponent } from '@fragments/sidebar.component';
import { HeaderComponent } from '@fragments/header.component';

interface TestFixtures {
  loginPage: LoginPage;
  signupPage: SignupPage;
  dashboardPage: DashboardPage;
  clientsPage: ClientsPage;
  propertiesPage: PropertiesPage;
  bookingsPage: BookingsPage;
  policeFormsPage: PoliceFormsPage;
  sidebar: SidebarComponent;
  header: HeaderComponent;
  apiHelper: ApiHelper;
  authHelper: AuthHelper;
  dataGenerator: typeof DataGenerator;
  verifyOtpPage: VerifyOtpPage;
  tempMail: MailTmHelper;
  collaboratorsPage: CollaboratorsPage;
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

  clientsPage: async ({ page }, use) => {
    const clientsPage = new ClientsPage(page);
    await use(clientsPage);
  },

  propertiesPage: async ({ page }, use) => {
    const propertiesPage = new PropertiesPage(page);
    await use(propertiesPage);
  },

  bookingsPage: async ({ page }, use) => {
    const bookingsPage = new BookingsPage(page);
    await use(bookingsPage);
  },

  policeFormsPage: async ({ page }, use) => {
    const policeFormsPage = new PoliceFormsPage(page);
    await use(policeFormsPage);
  },

  sidebar: async ({ page }, use) => {
    const sidebar = new SidebarComponent(page);
    await use(sidebar);
  },

  header: async ({ page }, use) => {
    const header = new HeaderComponent(page);
    await use(header);
  },

  apiHelper: async ({ request }, use) => {
    const api = new ApiHelper(request);
    await use(api);
  },

  authHelper: async ({ request }, use) => {
    const auth = new AuthHelper(request);
    await use(auth);
  },

  dataGenerator: async ({}, use) => {
    await use(DataGenerator);
  },

  verifyOtpPage: async ({ page }, use) => {
    const verifyOtpPage = new VerifyOtpPage(page);
    await use(verifyOtpPage);
  },

  tempMail: async ({ request }, use) => {
    const tempMail = new MailTmHelper(request);
    await use(tempMail);
  },

  collaboratorsPage: async ({ page }, use) => {
    const collaboratorsPage = new CollaboratorsPage(page);
    await use(collaboratorsPage);
  },
});

export { expect } from '@playwright/test';
