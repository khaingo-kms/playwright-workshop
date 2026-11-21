import { test, expect, type Page } from '@playwright/test';

// Demo — Playwright Assertions on the Toolshop admin area.
// Read-only: nothing here creates, edits or deletes shared data.

const ADMIN = { email: 'admin@practicesoftwaretesting.com', password: 'welcome01' };

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('shows an empty, editable login form', async ({ page }) => {
    const email = page.getByLabel('Email address');
    const password = page.getByRole('textbox', { name: 'Password' });

    await expect(page).toHaveTitle(/Login/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(email).toBeEditable();
    await expect(email).toBeEmpty();
    await expect(email).toHaveAttribute('placeholder', 'Your email');
    await expect(password).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
  });

  test('shows required-field errors when submitted empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByTestId('email-error')).toHaveText('Email is required');
    await expect(page.getByTestId('password-error')).toHaveText('Password is required');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('rejects unknown credentials', async ({ page }) => {
    // Unknown email on purpose: repeated wrong passwords could lock the shared admin account.
    await login(page, 'nobody@example.com', 'wrong-password');

    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByTestId('nav-sign-in')).toBeVisible();
  });
});

test.describe('Admin area', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });

  test('admin lands on the dashboard after login', async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard/);
    await expect(page.getByTestId('page-title')).toHaveText('Sales over the years');
    await expect(page.getByRole('heading', { name: 'Latest orders' })).toBeVisible();
    await expect(page.getByTestId('nav-menu')).toHaveText('John Doe');
    await expect(page.getByTestId('nav-sign-in')).toBeHidden();
  });

  test('user menu lists all admin sections', async ({ page }) => {
    await page.getByTestId('nav-menu').click();

    // Soft assertions report every missing link, not just the first one.
    await expect.soft(page.getByTestId('nav-admin-dashboard')).toBeVisible();
    await expect.soft(page.getByTestId('nav-admin-brands')).toHaveText('Brands');
    await expect.soft(page.getByTestId('nav-admin-categories')).toHaveText('Categories');
    await expect.soft(page.getByTestId('nav-admin-products')).toHaveText('Products');
    await expect.soft(page.getByTestId('nav-admin-orders')).toHaveText('Orders');
    await expect.soft(page.getByTestId('nav-admin-users')).toHaveText('Users');
    await expect.soft(page.getByTestId('nav-admin-products')).toHaveAttribute('href', '/admin/products');
    await expect(page.getByTestId('nav-sign-out')).toBeVisible();
  });

  test('products list shows a paginated table', async ({ page }) => {
    await page.goto('/admin/products');

    await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
    await expect(page.getByRole('columnheader')).toHaveText(['Id', 'Name', 'Stock', 'Price', '']);
    await expect(page.locator('tbody').getByRole('row')).toHaveCount(9);
    await expect(page.getByRole('button', { name: 'Page-1' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Add Product' })).toHaveAttribute('href', '/admin/products/add');
  });

  test('searching products shows only matching rows', async ({ page }) => {
    await page.goto('/admin/products');
    const rows = page.locator('tbody').getByRole('row');

    await page.getByTestId('product-search-query').fill('Pliers');
    await page.getByTestId('product-search-submit').click();

    await expect(rows.filter({ hasNotText: 'Pliers' })).toHaveCount(0);
    await expect(rows).not.toHaveCount(0);
    await expect(rows.first()).toContainText('Pliers');
  });

  test('search with no match shows an empty table, reset restores it', async ({ page }) => {
    await page.goto('/admin/products');
    const search = page.getByTestId('product-search-query');
    const rows = page.locator('tbody').getByRole('row');

    await search.fill('no-such-product-xyz');
    await page.getByTestId('product-search-submit').click();
    await expect(rows).toHaveCount(0);

    await page.getByTestId('product-search-reset').click();
    await expect(search).toHaveValue('');
    await expect(rows).toHaveCount(9);
  });

  test('edit product form is pre-filled with product data', async ({ page }) => {
    await page.goto('/admin/products');
    await page
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: 'Pliers', exact: true }) })
      .getByRole('link', { name: 'Edit' })
      .click();

    await expect(page).toHaveURL(/\/admin\/products\/edit\/\w+$/);
    await expect(page.getByRole('heading', { name: 'Edit Product' })).toBeVisible();
    await expect(page.getByLabel('Id')).not.toBeEmpty();
    await expect(page.getByLabel('Name')).toHaveValue('Pliers');
    await expect(page.getByLabel('Price')).toHaveValue('12.01');
    await expect(page.getByLabel('Description')).toHaveValue(/pliers/i);
    await expect(page.getByLabel('CO₂ Rating')).toHaveValue('D');
    await expect(page.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/admin/products');
  });

  test('sign out ends the session and protects admin pages', async ({ page }) => {
    await page.getByTestId('nav-menu').click();
    await page.getByTestId('nav-sign-out').click();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByTestId('nav-sign-in')).toBeVisible();

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/auth\/login$/);
  });
});
