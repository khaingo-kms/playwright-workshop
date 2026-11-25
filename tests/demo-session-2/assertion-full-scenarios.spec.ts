import {
  test,
  expect as baseExpect,
  mergeExpects,
  type APIRequestContext,
  type ExpectMatcherState,
  type Locator,
} from '@playwright/test';

// Full tour of https://playwright.dev/docs/test-assertions — one test per assertion type.
// Read-only against the shared Toolshop: no data is created, changed or deleted.

// ---------------------------------------------------------------------------
// Custom matchers (expect.extend + generic matcher + mergeExpects)
// ---------------------------------------------------------------------------

const priceExpect = baseExpect.extend({
  async toHavePrice(locator: Locator, expected: number, options?: { timeout?: number }) {
    const assertionName = 'toHavePrice';
    let pass: boolean;
    let matcherResult: { actual?: unknown } | undefined;
    try {
      // eslint-disable-next-line playwright/valid-expect -- matcher is called on the next line
      const expectation = this.isNot ? baseExpect(locator).not : baseExpect(locator);
      await expectation.toHaveText(`$${expected.toFixed(2)}`, options);
      pass = true;
    } catch (e) {
      matcherResult = (e as { matcherResult?: { actual?: unknown } }).matcherResult;
      pass = false;
    }
    if (this.isNot) pass = !pass;

    const message = () =>
      this.utils.matcherHint(assertionName, undefined, undefined, { isNot: this.isNot }) +
      '\n\n' +
      `Locator: ${locator}\n` +
      `Expected: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(expected)}\n` +
      (matcherResult ? `Received: ${this.utils.printReceived(matcherResult.actual)}` : '');

    return { message, pass, name: assertionName, expected, actual: matcherResult?.actual };
  },
});

const genericExpect = baseExpect.extend({
  toSatisfy<T>(this: ExpectMatcherState, received: T, predicate: (value: T) => boolean) {
    const pass = predicate(received);
    return {
      message: () => `expected ${this.utils.printReceived(received)} to satisfy the predicate`,
      pass,
    };
  },
});

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toSatisfy(predicate: (value: T) => boolean): R;
    }
  }
}

const expect = mergeExpects(priceExpect, genericExpect);

// ---------------------------------------------------------------------------
// API data used by the non-retrying / asymmetric examples
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  is_rental: boolean;
  in_stock: boolean;
  co2_rating: string;
  product_image: { file_name: string; title: string };
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string };
}

interface ProductPage {
  current_page: number;
  data: Product[];
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

async function getProducts(request: APIRequestContext): Promise<ProductPage> {
  const response = await request.get('/api/products?page=1');
  await expect(response).toBeOK();
  return (await response.json()) as ProductPage;
}

// ===========================================================================
// 1. Auto-retrying assertions — Locator
// ===========================================================================

test.describe('Auto-retrying: locator assertions', () => {
  test('toBeAttached — error message is added to the DOM only after a failed login', async ({ page }) => {
    await page.goto('/auth/login');
    const loginError = page.getByTestId('login-error');
    await expect(loginError).not.toBeAttached();

    await page.getByLabel('Email address').fill('nobody@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrong-password');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(loginError).toBeAttached();
  });

  test('toBeChecked — category filter checkbox', async ({ page }) => {
    await page.goto('/');
    const handTools = page.getByRole('checkbox', { name: 'Hand Tools', exact: true });
    await expect(handTools).not.toBeChecked();

    await handTools.check();

    await expect(handTools).toBeChecked();
  });

  test('toBeDisabled — out-of-stock product cannot be added to cart', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('product-name').filter({ hasText: 'Long Nose Pliers' }).click();

    await expect(page.getByTestId('add-to-cart')).toBeDisabled();
    await expect(page.getByTestId('quantity')).toBeDisabled();
  });

  test('toBeEditable — login email field', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email address')).toBeEditable();
  });

  test('toBeEmpty — login email field starts empty', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email address')).toBeEmpty();
  });

  test('toBeEnabled — login button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
  });

  test('toBeFocused — clicking and tabbing move focus', async ({ page }) => {
    await page.goto('/auth/login');
    const email = page.getByLabel('Email address');
    const password = page.getByRole('textbox', { name: 'Password' });

    await email.click();
    await expect(email).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();
  });

  test('toBeHidden — validation errors are hidden before submit', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('email-error')).toBeHidden();
    await expect(page.getByTestId('password-error')).toBeHidden();
  });

  test('toBeInViewport — footer only enters the viewport after scrolling', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');
    await expect(page.getByTestId('product-name').first()).toBeVisible();
    await expect(footer).not.toBeInViewport();

    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeInViewport();
  });

  test('toBeVisible — login heading', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('toContainText — product card contains its name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('product-name').first()).toContainText('Pliers');
  });

  test('toContainClass — contact email field has Bootstrap and Angular classes', async ({ page }) => {
    await page.goto('/contact');
    const email = page.getByTestId('email');
    await expect(email).toContainClass('form-control ng-invalid');

    await email.fill('qa@example.com');

    await expect(email).toContainClass('ng-valid');
  });

  test('toHaveAccessibleDescription — register field is described by its error', async ({ page }) => {
    await page.goto('/auth/register');
    await page.getByTestId('register-submit').click();

    await expect(page.getByTestId('first-name')).toHaveAccessibleDescription('First name is required');
  });

  test('toHaveAccessibleErrorMessage — field linked via aria-errormessage', async ({ page }) => {
    // Toolshop uses aria-describedby, not aria-errormessage, so this one runs on inline HTML.
    await page.setContent(`
      <label for="qty">Quantity</label>
      <input id="qty" aria-invalid="true" aria-errormessage="qty-error" />
      <div id="qty-error">Quantity must be at least 1</div>
    `);

    await expect(page.getByLabel('Quantity')).toHaveAccessibleErrorMessage('Quantity must be at least 1');
  });

  test('toHaveAccessibleName — icon-only quantity buttons', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('product-name').filter({ hasText: 'Combination Pliers' }).click();

    await expect(page.getByTestId('increase-quantity')).toHaveAccessibleName('Increase quantity');
    await expect(page.getByTestId('decrease-quantity')).toHaveAccessibleName('Decrease quantity');
  });

  test('toHaveAttribute — placeholder and link target', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email address')).toHaveAttribute('placeholder', 'Your email');
    await expect(page.getByRole('link', { name: 'Register your account' })).toHaveAttribute('href', '/auth/register');
  });

  test('toHaveClass — full class attribute of the sort dropdown', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('sort')).toHaveClass(/form-select/);
  });

  test('toHaveCount — home page shows 9 products', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('product-name')).toHaveCount(9);
  });

  test('toHaveCSS — submit button cursor', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Login' })).toHaveCSS('cursor', 'pointer');
  });

  test('toHaveId — login email field', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email address')).toHaveId('email');
  });

  test('toHaveJSProperty — checkbox "checked" DOM property', async ({ page }) => {
    await page.goto('/');
    const handTools = page.getByRole('checkbox', { name: 'Hand Tools', exact: true });

    await handTools.check();

    await expect(handTools).toHaveJSProperty('checked', true);
  });

  test('toHaveRole — <input type="submit"> is exposed as a button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('login-submit')).toHaveRole('button');
    await expect(page.getByLabel('Email address')).toHaveRole('textbox');
  });

  test('toHaveText — exact text, and a list of texts', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('nav-contact')).toHaveText('Contact');
    await expect(page.getByTestId('sort').locator('option')).toHaveText([
      '',
      'Name (A - Z)',
      'Name (Z - A)',
      'Price (High - Low)',
      'Price (Low - High)',
      'CO₂ Rating (A - E)',
      'CO₂ Rating (E - A)',
    ]);
  });

  test('toHaveValue — search box and sort dropdown', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('search-query').fill('hammer');
    await page.getByTestId('sort').selectOption('price,asc');

    await expect(page.getByTestId('search-query')).toHaveValue('hammer');
    await expect(page.getByTestId('sort')).toHaveValue('price,asc');
  });

  test('toHaveValues — multi-select keeps all chosen options', async ({ page }) => {
    // Toolshop has no <select multiple>, so this one runs on inline HTML.
    await page.setContent(`
      <label for="tools">Tools</label>
      <select id="tools" multiple>
        <option value="hammer">Hammer</option>
        <option value="saw">Saw</option>
        <option value="drill">Drill</option>
      </select>
    `);
    const tools = page.getByLabel('Tools');

    await tools.selectOption(['hammer', 'drill']);

    await expect(tools).toHaveValues(['hammer', 'drill']);
    await expect(tools).toHaveValues([/ham/, /dri/]);
  });

  test('toMatchAriaSnapshot (locator) — login form structure', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByTestId('login-form')).toMatchAriaSnapshot(`
      - text: Email address *
      - textbox "Email address *"
      - text: Password *
      - textbox "Password *"
      - button "Login"
    `);
  });

  test('toHaveScreenshot (locator) — login heading', async ({ page }) => {
    // First run creates the baseline: npx playwright test --update-snapshots
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toHaveScreenshot('login-heading.png');
  });
});

// ===========================================================================
// 2. Auto-retrying assertions — Page and APIResponse
// ===========================================================================

test.describe('Auto-retrying: page and response assertions', () => {
  test('toHaveTitle — page <title>', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/^Login - Practice Software Testing/);
  });

  test('toHaveURL — navigating to Contact', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-contact').click();

    await expect(page).toHaveURL('/contact');
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('toMatchAriaSnapshot (page) — login page has a heading and a Google button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page).toMatchAriaSnapshot(`
      - heading "Login" [level=3]
      - button "Sign in with Google"
    `);
  });

  test('toHaveScreenshot (page) — login page', async ({ page }) => {
    // First run creates the baseline: npx playwright test --update-snapshots
    await page.goto('/auth/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page).toHaveScreenshot('login-page.png', {
      mask: [page.getByRole('contentinfo')],
      maxDiffPixelRatio: 0.01,
    });
  });

  test('toBeOK — products API returns 2xx', async ({ request }) => {
    // toBeOK works on APIResponse (request fixture), not on page Response objects.
    await expect(await request.get('/api/products')).toBeOK();
    await expect(await request.get('/api/products/does-not-exist')).not.toBeOK();
  });
});

// ===========================================================================
// 3. Non-retrying assertions (generic matchers on plain values)
// ===========================================================================

test.describe('Non-retrying: generic matchers', () => {
  test('toBe — current page number', async ({ request }) => {
    const products = await getProducts(request);
    expect(products.current_page).toBe(1);
  });

  test('toBeCloseTo — price arithmetic with floating point', async ({ request }) => {
    const { data } = await getProducts(request);
    const threePliers = data[0].price * 3;
    expect(threePliers).toBeCloseTo(42.45, 2);
  });

  test('toBeDefined — product has an image', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0].product_image).toBeDefined();
  });

  test('toBeFalsy — product is not a rental', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0].is_rental).toBeFalsy();
  });

  test('toBeGreaterThan — catalogue is not empty', async ({ request }) => {
    const { total } = await getProducts(request);
    expect(total).toBeGreaterThan(0);
  });

  test('toBeGreaterThanOrEqual — at least one page', async ({ request }) => {
    const { last_page } = await getProducts(request);
    expect(last_page).toBeGreaterThanOrEqual(1);
  });

  test('toBeInstanceOf — data is an Array', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data).toBeInstanceOf(Array);
  });

  test('toBeLessThan — page size is smaller than total', async ({ request }) => {
    const { per_page, total } = await getProducts(request);
    expect(per_page).toBeLessThan(total);
  });

  test('toBeLessThanOrEqual — page never exceeds page size', async ({ request }) => {
    const { data, per_page } = await getProducts(request);
    expect(data.length).toBeLessThanOrEqual(per_page);
  });

  test('toBeNaN — a product name is not a number', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(Number(data[0].name)).toBeNaN();
  });

  test('toBeNull — missing query parameter', async ({ request }) => {
    const response = await request.get('/api/products?page=1');
    expect(new URL(response.url()).searchParams.get('by_category')).toBeNull();
  });

  test('toBeTruthy — product is in stock', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0].in_stock).toBeTruthy();
  });

  test('toBeUndefined — searching for a product that does not exist', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data.find((p) => p.name === 'Golden Hammer')).toBeUndefined();
  });

  test('toContain — substring in a string, item in an array', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0].description).toContain('wire');
    expect(data.map((p) => p.name)).toContain('Pliers');
  });

  test('toContainEqual — array contains an equal object', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data.map((p) => p.category)).toContainEqual({
      id: expect.any(String),
      name: 'Pliers',
      slug: 'pliers',
    });
  });

  test('toEqual — deep equality of pagination meta', async ({ request }) => {
    const { current_page, from, per_page } = await getProducts(request);
    expect({ current_page, from, per_page }).toEqual({ current_page: 1, from: 1, per_page: 9 });
  });

  test('toHaveLength — one page has 9 products', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data).toHaveLength(9);
  });

  test('toHaveProperty — nested property path', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0]).toHaveProperty('brand.name', 'ForgeFlex Tools');
    expect(data[0]).toHaveProperty(['category', 'slug']);
  });

  test('toMatch — product id is a ULID', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0].id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  test('toMatchObject — product contains a subset of fields', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0]).toMatchObject({
      name: 'Combination Pliers',
      co2_rating: 'D',
      category: { name: 'Pliers' },
    });
  });

  test('toStrictEqual — also compares undefined properties and types', async ({ request }) => {
    const { data } = await getProducts(request);
    const category = data[0].category;

    expect(category).toStrictEqual({ id: category.id, name: 'Pliers', slug: 'pliers' });
    // toEqual ignores the extra undefined key, toStrictEqual does not.
    expect({ ...category, parent_id: undefined }).toEqual(category);
    expect({ ...category, parent_id: undefined }).not.toStrictEqual(category);
  });

  test('toThrow — invalid JSON from the server would throw', () => {
    expect(() => JSON.parse('<html>502 Bad Gateway</html>')).toThrow(SyntaxError);
    expect(() => JSON.parse('<html>502 Bad Gateway</html>')).toThrow(/JSON/);
  });
});

// ===========================================================================
// 4. Asymmetric matchers
// ===========================================================================

test.describe('Asymmetric matchers', () => {
  test('expect.any — value of a given type', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0]).toMatchObject({ id: expect.any(String), price: expect.any(Number) });
  });

  test('expect.anything — any value except null/undefined', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0]).toMatchObject({ description: expect.anything() });
  });

  test('expect.arrayContaining — names include a subset', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data.map((p) => p.name)).toEqual(expect.arrayContaining(['Pliers', 'Bolt Cutters']));
  });

  test('expect.arrayOf — every item matches', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data).toEqual(expect.arrayOf(expect.objectContaining({ id: expect.any(String) })));
  });

  test('expect.closeTo — float inside an object', async ({ request }) => {
    const { data } = await getProducts(request);
    expect({ total: data[0].price * 3 }).toEqual({ total: expect.closeTo(42.45, 2) });
  });

  test('expect.objectContaining — partial nested object', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0]).toEqual(
      expect.objectContaining({ category: expect.objectContaining({ slug: 'pliers' }) }),
    );
  });

  test('expect.stringContaining — partial string', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0]).toMatchObject({ product_image: { file_name: expect.stringContaining('pliers') } });
  });

  test('expect.stringMatching — string matches a regex', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0]).toMatchObject({ product_image: { file_name: expect.stringMatching(/\.avif$/) } });
  });
});

// ===========================================================================
// 5. Negating, soft, custom message, configure, poll, toPass, extend
// ===========================================================================

test.describe('Assertion features', () => {
  test('.not — negating matchers', async ({ page, request }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email address')).not.toHaveValue('admin@practicesoftwaretesting.com');
    await expect(page.getByRole('heading', { name: 'Login' })).not.toContainText('Register');

    const { total } = await getProducts(request);
    expect(total).not.toEqual(0);
  });

  test('expect.soft — keep going after a failure, then stop if any failed', async ({ page }) => {
    await page.goto('/auth/login');
    await expect.soft(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect.soft(page.getByRole('link', { name: 'Register your account' })).toBeVisible();
    await expect.soft(page.getByRole('link', { name: 'Forgot your Password?' })).toBeVisible();
    expect.soft(page.url(), 'my soft assertion').toContain('/auth/login');

    // Avoid running further if there were soft assertion failures.
    expect(test.info().errors).toHaveLength(0);

    await page.getByRole('link', { name: 'Register your account' }).click();
    await expect(page).toHaveURL('/auth/register');
  });

  test('custom expect message — shown in the report', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByRole('button', { name: 'Login' }), 'login button should be ready').toBeEnabled();
  });

  test('expect.configure — custom timeout and always-soft instances', async ({ page }) => {
    const slowExpect = expect.configure({ timeout: 10_000 });
    const softExpect = expect.configure({ soft: true });

    await page.goto('/');
    await slowExpect(page.getByTestId('product-name')).toHaveCount(9);
    await softExpect(page.getByTestId('nav-contact')).toHaveText('Contact');
  });

  test('expect.poll — poll a function until it returns the expected value', async ({ request }) => {
    await expect
      .poll(
        async () => {
          const response = await request.get('/api/products');
          return response.status();
        },
        {
          message: 'make sure the products API eventually succeeds',
          intervals: [1_000, 2_000, 5_000],
          timeout: 15_000,
        },
      )
      .toBe(200);

    await expect.soft.poll(async () => (await getProducts(request)).total).toBeGreaterThan(0);
  });

  test('expect.toPass — retry a whole block until it passes', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sort').selectOption('price,asc');

    await expect(async () => {
      const prices = (await page.getByTestId('product-price').allTextContents()).map((t) =>
        Number(t.replace('$', '')),
      );
      expect(prices).toHaveLength(9);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    }).toPass({ intervals: [500, 1_000, 2_000], timeout: 15_000 });
  });

  test('expect.extend — custom async locator matcher toHavePrice', async ({ page }) => {
    await page.goto('/');
    const pliers = page.getByTestId('product-name').filter({ hasText: /^\s*Pliers\s*$/ });
    const card = page.locator('a.card').filter({ has: pliers });

    await expect(card.getByTestId('product-price')).toHavePrice(12.01);
    await expect(card.getByTestId('product-price')).not.toHavePrice(99.99);
  });

  test('expect.extend — generic matcher toSatisfy', async ({ request }) => {
    const { data } = await getProducts(request);
    expect(data[0].name).toSatisfy((name) => name.endsWith('Pliers'));
    expect(data[0].price).toSatisfy((price) => price > 0 && price < 100);
  });
});
