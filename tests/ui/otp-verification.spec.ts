import { test, expect } from '@fixtures/test.fixture';
import { MailTmHelper } from '@helpers/mail-tm.helper';

test.describe('OTP Verification', () => {
  let tempMailInstance: MailTmHelper | null = null;

  test.afterEach(async () => {
    if (tempMailInstance) {
      await tempMailInstance.deleteInbox();
      tempMailInstance = null;
    }
  });

  async function signupAndGetToOtpPage(
    signupPage: any,
    verifyOtpPage: any,
    tempMail: MailTmHelper,
    page: any,
    dataGenerator: any,
  ): Promise<string> {
    tempMailInstance = tempMail;
    const inbox = await tempMail.createInbox();
    const user = dataGenerator.user({ email: inbox.address });

    await signupPage.gotoSingup();
    await signupPage.fillSignupForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      password: user.password,
      confirmPassword: user.password,
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });
    await expect(page).toHaveURL(/\/auth\/verify-otp/, { timeout: 20000 });

    return user.email;
  }

  test('@smoke OTP page loads after signup', async ({
    signupPage,
    verifyOtpPage,
    tempMail,
    page,
    dataGenerator,
  }) => {
    await signupAndGetToOtpPage(signupPage, verifyOtpPage, tempMail, page, dataGenerator);
    expect(page.url()).toContain('/auth/verify-otp');
  });

  test('@smoke OTP page displays correct elements', async ({
    signupPage,
    verifyOtpPage,
    tempMail,
    page,
    dataGenerator,
  }) => {
    await signupAndGetToOtpPage(signupPage, verifyOtpPage, tempMail, page, dataGenerator);

    await expect(verifyOtpPage.heading).toBeVisible();
    await expect(verifyOtpPage.subtitle).toBeVisible();
    await expect(verifyOtpPage.submitBtn).toBeVisible();

    const hasInput =
      (await verifyOtpPage.singleOtpInput.count()) > 0 ||
      (await verifyOtpPage.multiOtpInputs.count()) > 0;
    expect(hasInput).toBe(true);
  });

  test('@smoke valid OTP redirects to dashboard', async ({
    signupPage,
    verifyOtpPage,
    tempMail,
    page,
    dataGenerator,
  }) => {
    const email = await signupAndGetToOtpPage(
      signupPage,
      verifyOtpPage,
      tempMail,
      page,
      dataGenerator,
    );

    const otpCode = await tempMail.waitForOtp();
    await verifyOtpPage.verifyOtp(otpCode);

    await expect(page).toHaveURL(/\/concierge\//, { timeout: 20000 });
  });

  test('invalid OTP shows error', async ({
    signupPage,
    verifyOtpPage,
    tempMail,
    page,
    dataGenerator,
  }) => {
    await signupAndGetToOtpPage(signupPage, verifyOtpPage, tempMail, page, dataGenerator);

    await verifyOtpPage.verifyOtp('000000');

    await expect(verifyOtpPage.errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('resend code button is clickable', async ({
    signupPage,
    verifyOtpPage,
    tempMail,
    page,
    dataGenerator,
  }) => {
    await signupAndGetToOtpPage(signupPage, verifyOtpPage, tempMail, page, dataGenerator);

    await expect(verifyOtpPage.resendBtn).toBeVisible();
    await verifyOtpPage.clickResend();

    await expect(page).toHaveURL(/\/auth\/verify-otp/);
  });

  test('back to login link navigates to login', async ({
    signupPage,
    verifyOtpPage,
    tempMail,
    page,
    dataGenerator,
  }) => {
    await signupAndGetToOtpPage(signupPage, verifyOtpPage, tempMail, page, dataGenerator);

    await verifyOtpPage.clickBackToLogin();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('OTP page shows the registered email', async ({
    signupPage,
    verifyOtpPage,
    tempMail,
    page,
    dataGenerator,
  }) => {
    const registeredEmail = await signupAndGetToOtpPage(
      signupPage,
      verifyOtpPage,
      tempMail,
      page,
      dataGenerator,
    );

    const displayedEmail = await verifyOtpPage.getDisplayedEmail();
    expect(displayedEmail.toLowerCase()).toBe(registeredEmail.toLowerCase());
  });
});
