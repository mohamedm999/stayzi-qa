import { test, expect } from '@fixtures/test.fixture';

test.describe('Police Forms Page — Pagination', () => {
  test.use({ storageState: '.auth/user.json' });

  test('pagination controls should be consistent with page info', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const pageInfoVisible = await policeFormsPage.pageInfo.isVisible().catch(() => false);
    if (pageInfoVisible) {
      const text = await policeFormsPage.getPageInfo();
      const match = text.match(/Page (\d+) sur (\d+)/);
      expect(match).not.toBeNull();
      const currentPage = parseInt(match![1]);
      const totalPages = parseInt(match![2]);
      expect(currentPage).toBeGreaterThanOrEqual(1);
      expect(totalPages).toBeGreaterThanOrEqual(1);
      expect(currentPage).toBeLessThanOrEqual(totalPages);
    }
  });

  test('should show "Page X sur Y" text when pagination is visible', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    test.skip(rowCount <= 10, 'Not enough rows to trigger pagination');

    await expect(policeFormsPage.pageInfo).toBeVisible();
    const text = await policeFormsPage.getPageInfo();
    expect(text).toMatch(/Page \d+ sur \d+/);
  });

  test('should show prev button disabled on page 1', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    test.skip(rowCount <= 10, 'Not enough rows to trigger pagination');

    await expect(policeFormsPage.prevPageBtn).toBeVisible();
    await expect(policeFormsPage.prevPageBtn).toBeDisabled();
  });

  test('should navigate to next page when clicking next button', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    test.skip(rowCount <= 10, 'Not enough rows to trigger pagination');

    const textBefore = await policeFormsPage.getPageInfo();
    const matchBefore = textBefore.match(/Page (\d+) sur (\d+)/);
    expect(matchBefore).not.toBeNull();
    const pageBefore = parseInt(matchBefore![1]);
    const totalPages = parseInt(matchBefore![2]);
    test.skip(totalPages < 2, 'Only one page of data');

    await policeFormsPage.nextPageBtn.click();
    await policeFormsPage.pageInfo.waitFor({ state: 'visible', timeout: 5000 });

    const textAfter = await policeFormsPage.getPageInfo();
    const matchAfter = textAfter.match(/Page (\d+) sur (\d+)/);
    expect(matchAfter).not.toBeNull();
    const pageAfter = parseInt(matchAfter![1]);
    expect(pageAfter).toBe(pageBefore + 1);
  });

  test('should navigate back to page 1 when clicking prev button', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    test.skip(rowCount <= 10, 'Not enough rows to trigger pagination');

    const textInitial = await policeFormsPage.getPageInfo();
    const matchInitial = textInitial.match(/Page (\d+) sur (\d+)/);
    expect(matchInitial).not.toBeNull();
    const totalPages = parseInt(matchInitial![2]);
    test.skip(totalPages < 2, 'Only one page of data');

    await policeFormsPage.nextPageBtn.click();
    await policeFormsPage.pageInfo.waitFor({ state: 'visible', timeout: 5000 });

    const textPage2 = await policeFormsPage.getPageInfo();
    expect(textPage2).toMatch(/Page 2 sur/);

    await policeFormsPage.prevPageBtn.click();
    await policeFormsPage.pageInfo.waitFor({ state: 'visible', timeout: 5000 });

    const textBack = await policeFormsPage.getPageInfo();
    expect(textBack).toMatch(/Page 1 sur/);
  });

  test('should show page number buttons', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    test.skip(rowCount <= 10, 'Not enough rows to trigger pagination');

    await expect(policeFormsPage.pageInfo).toBeVisible();
    const text = await policeFormsPage.getPageInfo();
    const match = text.match(/Page (\d+) sur (\d+)/);
    expect(match).not.toBeNull();
    const totalPages = parseInt(match![2]);

    const pageButtons = policeFormsPage.pageInfo.locator('~ button');
    const count = await pageButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const hasEllipsis = await policeFormsPage.page.locator('span').filter({ hasText: '…' }).count();
    if (totalPages > 5) {
      expect(hasEllipsis).toBeGreaterThan(0);
    }
  });

  test('page size should be 10 rows max per page', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    expect(rowCount).toBeLessThanOrEqual(10);
  });

  test('next button should be disabled on last page', async ({ policeFormsPage }) => {
    await policeFormsPage.goto();
    const rowCount = await policeFormsPage.getRowCount();
    test.skip(rowCount <= 10, 'Not enough rows to trigger pagination');

    const text = await policeFormsPage.getPageInfo();
    const match = text.match(/Page (\d+) sur (\d+)/);
    expect(match).not.toBeNull();
    const currentPage = parseInt(match![1]);
    const totalPages = parseInt(match![2]);

    if (currentPage === totalPages) {
      await expect(policeFormsPage.nextPageBtn).toBeDisabled();
    } else {
      while (currentPage < totalPages) {
        await policeFormsPage.nextPageBtn.click();
        await policeFormsPage.pageInfo.waitFor({ state: 'visible', timeout: 5000 });

        const newText = await policeFormsPage.getPageInfo();
        const newMatch = newText.match(/Page (\d+) sur (\d+)/);
        if (newMatch && parseInt(newMatch[1]) === totalPages) {
          await expect(policeFormsPage.nextPageBtn).toBeDisabled();
          return;
        }
      }
    }
  });
});
