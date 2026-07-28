import { test, expect } from '@fixtures/test.fixture';

test.describe('Collaborators Page', () => {
  test.use({ storageState: '.auth/user.json' });

  test('@smoke page loads with correct title and URL', async ({ collaboratorsPage, page }) => {
    await collaboratorsPage.goto();
    await expect(collaboratorsPage.heading).toBeVisible();
    expect(page.url()).toContain('/concierge/collaborators');
  });

  test('@smoke page displays description', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await expect(collaboratorsPage.description).toBeVisible();
  });

  test('@smoke invite button is visible and clickable', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await expect(collaboratorsPage.inviteBtn).toBeVisible();
  });

  test('@smoke displays 4 stat cards with labels', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();

    await expect(collaboratorsPage.statTotal).toBeVisible();
    await expect(collaboratorsPage.statActifs).toBeVisible();
    await expect(collaboratorsPage.statEnAttente).toBeVisible();
    await expect(collaboratorsPage.statSuspendus).toBeVisible();
  });

  test('@smoke stat cards show zero values when no collaborators', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();

    // Each stat card should show a value
    for (const stat of [collaboratorsPage.statTotal, collaboratorsPage.statActifs,
      collaboratorsPage.statEnAttente, collaboratorsPage.statSuspendus]) {
      const value = await collaboratorsPage.getStatValue(stat);
      expect(value).toBe('0');
    }
  });

  test('@ui displays chart sections', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();

    await expect(collaboratorsPage.chartRepartition).toBeVisible();
    await expect(collaboratorsPage.chartCategorie).toBeVisible();
  });

  test('@ui displays collaborator category labels', async ({ collaboratorsPage, page }) => {
    await collaboratorsPage.goto();

    // The category names are rendered as chart axis labels (inside SVG)
    await expect(collaboratorsPage.chartCategorie).toBeVisible();

    // Verify category labels exist in the chart section
    const section = page.getByText('Collaborateurs par catégorie').locator('..');
    await expect(section).toContainText('Jardinier');
  });

  test('@ui search input is visible', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await expect(collaboratorsPage.searchInput).toBeVisible();
  });

  test('@ui filter button is visible', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await expect(collaboratorsPage.filterBtn).toBeVisible();
  });

  test('@ui displays empty state when no collaborators', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();

    await expect(collaboratorsPage.emptyState).toBeVisible();
    await expect(collaboratorsPage.emptyStateMessage).toBeVisible();
  });

  test('@ui displays total collaborator count', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();

    const count = await collaboratorsPage.getTotalCount();
    expect(count).toContain('0 collaborateur');
  });

  test('@ui clicking invite opens drawer with correct title', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await collaboratorsPage.clickInvite();

    await expect(collaboratorsPage.inviteDrawerTitle).toContainText('Inviter un collaborateur');
  });

  test('@ui invite drawer has all form fields', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await collaboratorsPage.clickInvite();

    await expect(collaboratorsPage.inviteFirstName).toBeVisible();
    await expect(collaboratorsPage.inviteLastName).toBeVisible();
    await expect(collaboratorsPage.invitePhone).toBeVisible();
    await expect(collaboratorsPage.inviteType).toBeVisible();
  });

  test('@ui invite drawer has cancel and submit buttons', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await collaboratorsPage.clickInvite();

    await expect(collaboratorsPage.inviteCancelBtn).toBeVisible();
    await expect(collaboratorsPage.inviteSubmitBtn).toBeVisible();
  });

  test('@ui cancel button closes the invite drawer', async ({ collaboratorsPage }) => {
    await collaboratorsPage.goto();
    await collaboratorsPage.clickInvite();

    await expect(collaboratorsPage.inviteDrawer).toBeVisible();
    await collaboratorsPage.cancelInvite();
    await expect(collaboratorsPage.inviteDrawer).not.toBeVisible({ timeout: 5000 });
  });

  test('@regression invite form can be filled with collaborator data', async ({ collaboratorsPage, dataGenerator }) => {
    await collaboratorsPage.goto();
    await collaboratorsPage.clickInvite();

    const user = dataGenerator.user();
    await collaboratorsPage.fillInviteForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      type: 'Jardinier',
    });

    // Verify fields were filled
    await expect(collaboratorsPage.inviteFirstName).toHaveValue(user.firstName);
    await expect(collaboratorsPage.inviteLastName).toHaveValue(user.lastName);
    await expect(collaboratorsPage.invitePhone).toHaveValue(user.phone);
    // Select value is uppercase in the DOM
    await expect(collaboratorsPage.inviteType).toHaveValue('JARDINIER');
  });
});
