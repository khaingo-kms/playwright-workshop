import { test, expect } from '@playwright/test';

// Exercise 3 — Strengthen weak assertions
// These three tests PASS today. But would they fail if the feature broke?
//
// Your job, for each test:
//   1. Break the feature on purpose: comment out the line marked  // ← key action
//   2. Run the test. Still green? Then its assertion can't fail — it checks nothing useful.
//   3. Rewrite the assertion so it checks the OUTCOME the user cares about.
//   4. Prove it: with the key action commented out the test fails; with it back, it passes.
//
// Run: npx playwright test ex3 --headed --project=chromium

test('customer can log in', async ({ page }) => {
  await page.goto('/auth/login');
  await page.getByLabel('Email address').fill('customer@practicesoftwaretesting.com');
  await page.getByLabel('Password').fill('welcome01');
  await page.getByRole('button', { name: 'Login' }).click(); // ← key action

  await expect(page).toHaveURL(/./);
});

test('adding a product updates the cart', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('product-name').filter({ hasText: 'Thor Hammer' }).click();
  await page.getByTestId('add-to-cart').click(); // ← key action

  await expect(page.getByTestId('add-to-cart')).toBeVisible();
});

test('searching for pliers shows pliers', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search').fill('pliers');
  await page.getByPlaceholder('Search').press('Enter'); // ← key action

  await expect(page.getByTestId('product-name').first()).toContainText(/pliers/i);
});
