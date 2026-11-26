import { test, expect } from '@playwright/test';

// Session 2 · Exercises 1 and 2 — a broken suite. See account.spec.ts for the instructions.

test.describe.fixme('broken suite · product', () => {
  test('a pliers product can be added to the cart', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search').fill('pliers');
    await page.getByPlaceholder('Search').press('Enter');
    await expect(page.getByTestId('search-term')).toHaveText('pliers');

    // Any pliers will do, so take the third one.
    await page.getByTestId('product-name').nth(2).click();
    await page.getByTestId('add-to-cart').click();

    await expect(page.getByTestId('cart-quantity')).toHaveText('1');
  });
});
