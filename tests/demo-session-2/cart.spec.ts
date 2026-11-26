import { test, expect } from '@playwright/test';

const ADMIN = { email: 'admin@practicesoftwaretesting.com', password: 'welcome01' };

test('adding a product updates the cart', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill(ADMIN.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(ADMIN.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/admin\/dashboard$/);

  await page.goto('/');
  // Exact match: "Claw Hammer with Shock Reduction Grip" is also on the page.
  await page.getByTestId('product-name').filter({ hasText: /^\s*Claw Hammer\s*$/ }).click();
  await page.getByTestId('add-to-cart').click();

  await expect(page.getByRole('alert')).toContainText('Product added'); // feedback shown
  await expect(page.getByTestId('cart-quantity')).toHaveText('1'); // cart updated
  await page.getByTestId('nav-cart').click();
  await expect(page.getByTestId('product-title')).toHaveText(['Claw Hammer']);
});
