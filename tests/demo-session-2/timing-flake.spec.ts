import { test, expect, type Page } from '@playwright/test';

async function openClawHammer(page: Page) {
  await page.goto('/');
  await page.getByTestId('product-name').filter({ hasText: /^\s*Claw Hammer\s*$/ }).click();
}

test.describe('A timing flake and its fix', () => {
  test('flaky — reads the cart badge once, right after the click', async ({ page }) => {
    await openClawHammer(page);

    await page.getByTestId('add-to-cart').click();
    const qty = await page.getByTestId('cart-quantity').textContent();
    expect(qty).toBe('1');
  });

  test('fixed — web-first assertion retries until the badge shows 1', async ({ page }) => {
    await openClawHammer(page);

    await page.getByTestId('add-to-cart').click();
    // Timing: the badge updates only after the add-to-cart API responds, so retry instead of reading once.
    await expect(page.getByTestId('cart-quantity')).toHaveText('1');
  });
});
