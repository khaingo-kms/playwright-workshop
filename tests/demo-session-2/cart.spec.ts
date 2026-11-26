import { test, expect } from '@playwright/test';

test('adding a product updates the cart', async ({ page }) => {
  await page.goto('/');
  // Exact match: "Claw Hammer with Shock Reduction Grip" is also on the page.
  await page.getByTestId('product-name').filter({ hasText: /^\s*Claw Hammer\s*$/ }).click();
  await page.getByTestId('add-to-cart').click();

  await expect(page.getByRole('alert')).toContainText('Product added'); // feedback shown
  await expect(page.getByTestId('cart-quantity')).toHaveText('1'); // cart updated
  await page.getByTestId('nav-cart').click();
  await expect(page.getByTestId('product-title')).toHaveText(['Claw Hammer###']);
});
