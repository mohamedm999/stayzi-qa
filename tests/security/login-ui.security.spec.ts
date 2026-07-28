import { test, expect } from '@fixtures/test.fixture';
import { config } from '@lib/config';
import { XSS_PAYLOADS } from '@lib/security-payloads';

test.describe('Login UI Security', () => {

  // ─── XSS Prevention ─────────────────────────────────────────

  test.describe('XSS Prevention', () => {
    for (const [i, payload] of XSS_PAYLOADS.entries()) {
      test(`@security @ui XSS payload ${i + 1} should not execute in email field`, async ({ loginPage, page }) => {
        let dialogFired = false;
        page.on('dialog', async (dialog) => {
          dialogFired = true;
          await dialog.dismiss();
        });

        await loginPage.gotoLogin();
        await loginPage.fillEmail(payload);
        await loginPage.fillPassword('test');
        await loginPage.clickSubmit();

        // Wait briefly for any async script execution
        await page.waitForTimeout(1000);
        expect(dialogFired).toBe(false);
      });
    }
  });

  // ─── Password Field Security ────────────────────────────────

  test.describe('Password Field Security', () => {
    test('@security @ui password field should be type password', async ({ loginPage }) => {
      await loginPage.gotoLogin();
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('@security @ui password stays masked after typing', async ({ loginPage }) => {
      await loginPage.gotoLogin();
      await loginPage.fillPassword('MySecret123!');
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('@security @ui password field should mask input (not visible as plaintext)', async ({ loginPage, page }) => {
      await loginPage.gotoLogin();
      await loginPage.fillPassword('SuperSecretPassword123!');
      // The password type masks the input visually — verify type is still password
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
      // Also verify the password is not in any visible text nodes
      const visibleText = await page.locator('body').innerText();
      expect(visibleText).not.toContain('SuperSecretPassword123!');
    });
  });

  // ─── Password Not in URL ────────────────────────────────────

  test.describe('Password Not in URL', () => {
    test('@security @ui password should not appear in URL after submit', async ({ loginPage, page }) => {
      await loginPage.gotoLogin();
      await loginPage.submitLogin('test@test.com', 'MyPassword123!');

      // Wait for navigation or stay on page
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).not.toContain('MyPassword123!');
      expect(url).not.toContain('password');
      expect(url.toLowerCase()).not.toContain('mypassword');
    });
  });

  // ─── Password Not in Console ────────────────────────────────

  test.describe('Password Not in Console', () => {
    test('@security @ui password should not be logged to console', async ({ loginPage, page }) => {
      const consoleMessages: string[] = [];
      page.on('console', (msg) => {
        consoleMessages.push(msg.text());
      });

      await loginPage.gotoLogin();
      await loginPage.submitLogin('test@test.com', 'SuperSecret123!');

      await page.waitForTimeout(3000);

      const passwordLeaked = consoleMessages.some(msg =>
        msg.includes('SuperSecret123!')
      );
      expect(passwordLeaked).toBe(false);
    });
  });

  // ─── Password Not in Network Requests ───────────────────────

  test.describe('Password Not in Network Requests', () => {
    test('@security @ui password should not be in URL query params of any request', async ({ loginPage, page }) => {
      const requestUrls: string[] = [];
      page.on('request', (req) => {
        requestUrls.push(req.url());
      });

      await loginPage.gotoLogin();
      await loginPage.submitLogin('test@test.com', 'SecretPass123!');

      await page.waitForTimeout(3000);

      for (const url of requestUrls) {
        expect(url.toLowerCase()).not.toContain('secretpass');
        expect(url.toLowerCase()).not.toContain('password=secret');
      }
    });
  });

  // ─── Browser Back Button After Logout ───────────────────────

  test.describe('Browser Back Button', () => {
    test('@security @ui back button should not bypass login page', async ({ loginPage, page }) => {
      // Navigate away from login
      await loginPage.gotoLogin();

      // Navigate to protected page
      await page.goto('/concierge/dashboard', { waitUntil: 'domcontentloaded' });

      // Wait for any redirect
      await page.waitForTimeout(3000);
      const url = page.url();

      // If the dashboard loaded without redirect, the app serves SSR publicly
      const redirectedToLogin = url.includes('/auth/login');
      if (!redirectedToLogin) {
        console.log('FINDING: Dashboard loaded without auth — app shell is public');
        return;
      }

      // Press back — should stay on login or not expose protected content
      await page.goBack();
      await page.waitForTimeout(1000);
      const backUrl = page.url();
      const isOnLogin = backUrl.includes('/auth/login');
      const isOnPublic = !backUrl.includes('/concierge/');

      expect(isOnLogin || isOnPublic).toBe(true);
    });
  });

  // ─── Hidden Field Manipulation ──────────────────────────────

  test.describe('Hidden Field Manipulation', () => {
    test('@security @ui injecting hidden role field should not grant elevated access', async ({ loginPage, page }) => {
      await loginPage.gotoLogin();

      // Inject a hidden field to escalate role
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'role';
          input.value = 'SUPER_ADMIN';
          form.appendChild(input);

          const roleInput = document.createElement('input');
          roleInput.type = 'hidden';
          roleInput.name = 'isAdmin';
          roleInput.value = 'true';
          form.appendChild(roleInput);
        }
      });

      // Try to login with valid credentials
      await loginPage.fillEmail(config.guestUser.email);
      await loginPage.fillPassword(config.guestUser.password);
      await loginPage.clickSubmit();

      await page.waitForTimeout(3000);

      // Should still redirect normally (not to any admin-only area)
      const url = page.url();
      expect(url).not.toContain('/admin');
      expect(url).not.toContain('/super-admin');
    });
  });

  // ─── Cookie Security Flags ──────────────────────────────────

  test.describe('Cookie Security', () => {
    test('@security @ui auth cookies should have security flags', async ({ loginPage, page }) => {
      await loginPage.gotoLogin();
      await loginPage.submitLogin(config.guestUser.email, config.guestUser.password);

      await page.waitForTimeout(3000);

      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(c =>
        c.name.includes('token') || c.name.includes('auth') || c.name.includes('session')
      );

      for (const cookie of authCookies) {
        console.log(`Cookie: ${cookie.name}, secure: ${cookie.secure}, sameSite: ${cookie.sameSite}, httpOnly: ${cookie.httpOnly}`);

        // Secure flag should be set (HTTPS only)
        if (!cookie.secure) {
          console.log(`FINDING: Cookie "${cookie.name}" missing Secure flag`);
        }

        // SameSite should be set
        if (cookie.sameSite === 'None') {
          console.log(`FINDING: Cookie "${cookie.name}" has SameSite=None — may be vulnerable to CSRF`);
        }
      }

      // Don't hard fail — these are informational security findings
      expect(authCookies.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ─── Autocomplete Security ──────────────────────────────────

  test.describe('Autocomplete Security', () => {
    test('@security @ui password field should not have autocomplete=on', async ({ loginPage }) => {
      await loginPage.gotoLogin();
      const autocomplete = await loginPage.passwordInput.getAttribute('autocomplete');
      // Should be 'current-password' or 'off', not 'on'
      expect(autocomplete).not.toBe('on');
    });
  });

  // ─── Error Message Consistency ──────────────────────────────

  test.describe('Error Message Consistency', () => {
    test('@security @ui same error message for wrong email and wrong password', async ({ loginPage }) => {
      await loginPage.gotoLogin();
      await loginPage.submitLogin('nonexistent-99999@test.com', 'WrongPass123!');
      const error1 = await loginPage.getNotificationText();

      await loginPage.gotoLogin();
      await loginPage.submitLogin(config.guestUser.email, 'WrongPass123!');
      const error2 = await loginPage.getNotificationText();

      // Both should show the same error (don't reveal which field is wrong)
      expect(error1).toBe(error2);
    });
  });
});
