import { test, expect, type Page } from '@playwright/test';

interface CartItem {
  quantity: number;
  product: { name: string };
}

async function openClawHammer(page: Page) {
  await page.goto('/');
  await page.getByTestId('product-name').filter({ hasText: /^\s*Claw Hammer\s*$/ }).click();
}

test.describe("When there's no element to wait for", () => {
  test('expect.poll — poll the cart API until it holds the added product', async ({ page }) => {
    await openClawHammer(page);

    await page.getByTestId('add-to-cart').click();

    // The cart is created asynchronously, so cart_id and its items may not exist yet on the first poll.
    await expect
      .poll(async () => {
        const cartId = await page.evaluate(() => sessionStorage.getItem('cart_id'));
        if (!cartId) return null;
        const res = await page.request.get(`/api/carts/${cartId}`);
        if (!res.ok()) return res.status();
        const cart = (await res.json()) as { cart_items: CartItem[] };
        return cart.cart_items.map((item) => ({ name: item.product.name, quantity: item.quantity }));
      })
      .toEqual([{ name: 'Claw Hammer', quantity: 1 }]);
  });

  test('toPass — retry a whole search block until it passes', async ({ page }) => {
    await page.goto('/');

    await expect(async () => {
      await page.getByTestId('search-query').fill('chisel');
      await page.getByTestId('search-submit').click();
      // Short inner timeout so one slow attempt doesn't use up the whole toPass budget.
      await expect(page.getByTestId('product-name')).toHaveCount(3, { timeout: 2_000 });
    }).toPass({ timeout: 15_000 });

    await expect(page.getByTestId('search-caption')).toHaveText('Searched for: chisel');
  });
});
