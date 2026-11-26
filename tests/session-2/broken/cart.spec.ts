import { test, expect } from '@playwright/test';

// Session 2 · Exercises 1 and 2 — a broken suite. See account.spec.ts for the instructions.

test.describe.fixme('broken suite · cart', () => {
  test('adding a product shows a confirmation', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('product-name').filter({ hasText: 'Thor Hammer' }).click();
    await page.getByTestId('add-to-cart').click();

    const confirmations = await page.getByRole('alert').filter({ hasText: 'Product added to shopping cart.' }).count();
    expect(confirmations).toBe(1);
  });
});
