import { chromium } from 'playwright';
import { config } from '../utils/config';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ storageState: '.auth/user.json' });

  const page = await ctx.newPage();
  await page.goto(`${config.devBaseUrl}/concierge/clients`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log(`URL: ${page.url()}`);
  console.log(`Title: ${await page.title()}`);

  // Find all buttons
  const buttons = await page.locator('button').all();
  console.log(`\nTotal buttons: ${buttons.length}`);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const aria = await buttons[i].getAttribute('aria-label');
    const visible = await buttons[i].isVisible().catch(() => false);
    if (visible && text?.trim()) console.log(`  Button ${i}: "${text.trim().substring(0, 60)}" aria="${aria}"`);
  }

  // Check for table structure
  const tableInfo = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    const info = [];
    tables.forEach((table) => {
      const rows = table.querySelectorAll('tbody tr');
      info.push({
        rows: rows.length,
        firstRowHTML: rows[0]?.innerHTML?.substring(0, 500) || 'none',
      });
    });
    return info;
  });
  console.log('\nTables:', JSON.stringify(tableInfo, null, 2));

  // Find all clickable/trash/delete icons
  const trashElements = await page.evaluate(() => {
    const results = [];
    const allEls = document.querySelectorAll('button, a, [role=button]');
    allEls.forEach(el => {
      const svg = el.querySelector('svg');
      const ariaLabel = el.getAttribute('aria-label') || '';
      const text = el.textContent?.trim() || '';
      const classes = el.className?.toString() || '';
      if (svg || ariaLabel.includes('delete') || ariaLabel.includes('supprim') || ariaLabel.includes('action') || classes.includes('icon')) {
        results.push({
          tag: el.tagName,
          text: text.substring(0, 50),
          aria: ariaLabel,
          classes: classes.substring(0, 80),
          hasSvg: !!svg,
          visible: el.offsetParent !== null,
        });
      }
    });
    return results;
  });
  console.log('\nIcon buttons:', JSON.stringify(trashElements.filter(e => e.hasSvg || e.aria), null, 2));

  // Look for three-dot menus or action buttons on rows
  const rowActions = await page.evaluate(() => {
    const rows = document.querySelectorAll('tr, [data-slot="table-row"]');
    return Array.from(rows).map((row, i) => ({
      row: i,
      innerHTML: row.innerHTML.substring(0, 300),
    }));
  });
  console.log('\nRow HTML samples:', JSON.stringify(rowActions.slice(0, 2), null, 2));

  await browser.close();
})();
