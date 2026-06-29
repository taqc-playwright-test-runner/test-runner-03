import { expect, test, type Page } from '@playwright/test';

async function addDrinkToCart(page: Page, drinkName: string) {
  const drink = page.locator(`.cup-body[aria-label="${drinkName}"]`);
  await expect(drink).toBeVisible();
  await drink.click({ button: 'right' });
  await page.locator('dialog').getByRole('button', { name: 'Yes' }).click();
}

test.describe('Coffee Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coffee/');
  });

  test('Smoke: menu loads with drinks list and Total button @smoke', async ({ page }) => {
    await expect(page.locator('.cup-body')).toHaveCount(9);
    await expect(page.locator('.cup-body').first()).toBeVisible();
    await expect(page.getByLabel('Cart page')).toContainText('cart (0)');
    await expect(page.locator('button[data-test="checkout"]')).toHaveText('Total: $0.00');
  });

  test('Adding two different drinks updates the header cart counter and Total', async ({ page }) => {
    await addDrinkToCart(page, 'Espresso');
    await addDrinkToCart(page, 'Mocha');

    await expect(page.getByLabel('Cart page')).toHaveText('cart (2)');
    await expect(page.locator('button[data-test="checkout"]')).toHaveText('Total: $18.00');
  });

  test('Cart page lists exactly the added items', async ({ page }) => {
    await addDrinkToCart(page, 'Espresso');
    await addDrinkToCart(page, 'Mocha');
    await page.getByLabel('Cart page').click();
    await page.waitForURL(/\/coffee\/cart/);

    const rows = page.locator('.list > div > ul > li.list-item');
    await expect(rows).toHaveCount(2);
    await expect(rows.filter({ hasText: 'Espresso' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Mocha' })).toHaveCount(1);
  });

  test('Increasing item quantity on the cart page updates counter and Total', async ({ page }) => {
    await addDrinkToCart(page, 'Espresso');
    await addDrinkToCart(page, 'Mocha');
    await page.getByLabel('Cart page').click();
    await page.waitForURL(/\/coffee\/cart/);

    const espressoRow = page.locator('.list > div > ul > li.list-item').filter({ hasText: 'Espresso' });
    await espressoRow.locator('button[aria-label="Add one Espresso"]').click();

    await expect(page.getByLabel('Cart page')).toHaveText('cart (3)');
    await expect(page.locator('button[data-test="checkout"]')).toHaveText('Total: $28.00');
  });

  test('Empty cart shows no items on a fresh session', async ({ page }) => {
    await page.goto('/coffee/cart');

    await expect(page.locator('.list > div > ul > li.list-item')).toHaveCount(0);
    await expect(page.getByText('No coffee, go add some.')).toBeVisible();
  });

  test('Payment modal shows Name, Email and Submit', async ({ page }) => {
    await addDrinkToCart(page, 'Espresso');
    await page.locator('button[data-test="checkout"]').click();
    await expect(page.locator('.modal')).toBeVisible();

    await expect.soft(page.locator('#name')).toBeVisible();
    await expect.soft(page.locator('#email')).toBeVisible();
    await expect.soft(page.locator('#submit-payment')).toBeVisible();
  });

  test.describe('Optional', () => {
    test('Promo dialog after a 3rd drink is dismissed with No', async () => {
      test.skip(true, 'Optional bonus implemented later if needed.');
    });

    test('Completed payment form shows a success message', async () => {
      test.skip(true, 'Optional bonus implemented later if needed.');
    });

    test('Skipped on a specific browser with a documented reason', async ({ browserName }) => {
      test.skip(
        browserName === 'webkit',
        'webkit project is disabled in playwright.config.ts for this assignment',
      );
      test.skip(true, 'Optional bonus implemented later if needed.');
    });

    test('Annotated with a tracking issue', async () => {
      const issueUrl = 'https://example.com/issues/123';
      test.info().annotations.push({ type: 'issue', description: issueUrl });
      test.skip(true, 'Optional bonus implemented later if needed.');
    });
  });
});
