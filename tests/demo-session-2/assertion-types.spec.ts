import { test, expect, type Page } from '@playwright/test';

// Demo — 7 core assertion types on the Toolshop storefront, one test each.
// Only the browser's own cart is touched; no shared data is created, changed or deleted.

const CUSTOMER = { email: 'customer@practicesoftwaretesting.com', password: 'welcome01' };

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

async function searchProducts(page: Page, query: string) {
  await page.goto('/');
  await page.getByTestId('search-query').fill(query);
  await page.getByTestId('search-submit').click();
}

async function openProduct(page: Page, name: string) {
  await page.goto('/');
  await page.getByTestId('product-name').filter({ hasText: name }).click();
}

test.describe('Core assertion types', () => {
  test('toBeVisible / toBeHidden — validation errors appear only after an empty submit', async ({ page }) => {
    await page.goto('/auth/login');
    const emailError = page.getByTestId('email-error');

    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(emailError).toBeHidden();

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(emailError).toBeVisible();
  });

  test('toHaveText / toContainText — search caption and results', async ({ page }) => {
    await searchProducts(page, 'chisel');

    await expect(page.getByTestId('search-caption')).toHaveText('Searched for: chisel');
    await expect(page.getByTestId('product-name').first()).toContainText('Chisel');
  });

  test('toHaveURL — customer lands on /account after login', async ({ page }) => {
    await login(page, CUSTOMER.email, CUSTOMER.password);

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
  });

  test('toHaveCount — searching "chisel" returns 3 products', async ({ page }) => {
    await searchProducts(page, 'chisel');

    await expect(page.getByTestId('product-name')).toHaveCount(3);
  });

  test('toHaveValue — quantity becomes 5 after 4 increments', async ({ page }) => {
    await openProduct(page, 'Combination Pliers');
    const quantity = page.getByTestId('quantity');
    await expect(quantity).toHaveValue('1');

    for (let i = 0; i < 4; i++) {
      await page.getByTestId('increase-quantity').click();
    }

    await expect(quantity).toHaveValue('5');
  });

  test('toBeChecked / toBeEnabled — category filter checkbox', async ({ page }) => {
    await page.goto('/');
    const handTools = page.getByRole('checkbox', { name: 'Hand Tools', exact: true });

    await expect(handTools).toBeEnabled();
    await expect(handTools).not.toBeChecked();

    await handTools.check();

    await expect(handTools).toBeChecked();
  });

  test('toHaveAttribute — cart link points to the checkout page', async ({ page }) => {
    // Toolshop's cart lives at /checkout (not /cart), and the link only renders once the cart has items.
    await openProduct(page, 'Combination Pliers');
    await page.getByTestId('add-to-cart').click();

    const cart = page.getByTestId('nav-cart');
    await expect(cart).toHaveAttribute('href', '/checkout');
    await expect(page.getByTestId('cart-quantity')).toHaveText('1');
  });
});
