import { test, expect } from '@playwright/test';

// Session 2 · Exercises 1 and 2 — a broken suite. See account.spec.ts for the instructions.

let productName: string;

test.describe.fixme('broken suite · search', () => {
  test('searching for pliers lists only pliers', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search').fill('pliers');
    await page.getByPlaceholder('Search').press('Enter');

    // give the results a moment to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    const names = await page.getByTestId('product-name').allTextContents();
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => /pliers/i.test(name))).toBe(true);
  });

  test('searching for hammer lists hammers', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search').fill('hammer');
    await page.getByPlaceholder('Search').press('Enter');

    await expect(page.getByTestId('search-term')).toHaveText('hammer');
    productName = (await page.getByTestId('product-name').first().textContent())!.trim();
  });

  test('the first hammer from the search has its own product page', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search').fill(productName);
    await page.getByPlaceholder('Search').press('Enter');
    await page.getByTestId('product-name').filter({ hasText: productName }).first().click();

    await expect(page.getByTestId('product-name')).toHaveText(productName);
  });
});
