import { expect, test, type Page } from '@playwright/test';

async function addDrinkToCart(page: Page, drinkName: string) {
  const drink = page.locator(`.cup-body[aria-label="${drinkName}"]`);
  await expect(drink).toBeVisible();
  await drink.click({ button: 'right' });
  await page.getByRole('dialog').getByRole('button', { name: 'Yes' }).click();
}

test.describe('Coffee Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coffee/');
  });

  test('Smoke: menu loads with drinks list and Total button @smoke', async ({ page }) => {
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(page.locator('.cup-body')).toHaveCount(9);
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(page.locator('.cup-body').first()).toBeVisible();
    await expect(page.getByLabel('Cart page')).toContainText('cart (0)');
    await expect(page.getByRole('button').filter({ hasText: 'Total:' })).toHaveText('Total: $0.00');
  });

  test('Adding two different drinks updates the header cart counter and Total', async ({ page }) => {
    await addDrinkToCart(page, 'Espresso');
    await addDrinkToCart(page, 'Mocha');

    await expect(page.getByLabel('Cart page')).toHaveText('cart (2)');
    await expect(page.getByRole('button').filter({ hasText: 'Total:' })).toHaveText('Total: $18.00');
  });

  test('Cart page lists exactly the added items', async ({ page }) => {
    await addDrinkToCart(page, 'Espresso');
    await addDrinkToCart(page, 'Mocha');
    await page.getByLabel('Cart page').click();
    await page.waitForURL(/\/coffee\/cart/);

    // eslint-disable-next-line playwright/no-raw-locators
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

    await page.getByRole('button', { name: 'Add one Espresso' }).click();
    await expect(page.getByLabel('Cart page')).toHaveText('cart (3)');
    await expect(page.getByRole('button').filter({ hasText: 'Total:' })).toHaveText('Total: $28.00');
  });

  test('Empty cart shows no items on a fresh session', async ({ page }) => {
    await page.goto('/coffee/cart');

    // eslint-disable-next-line playwright/no-raw-locators
    await expect(page.locator('.list > div > ul > li.list-item')).toHaveCount(0);
    await expect(page.getByText('No coffee, go add some.')).toBeVisible();
  });

  test('Payment modal shows Name, Email and Submit', async ({ page }) => {
    await addDrinkToCart(page, 'Espresso');
    await page.getByRole('button').filter({ hasText: 'Total:' }).click();
    // eslint-disable-next-line playwright/no-raw-locators
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  test.describe('Optional', () => {
    test('Promo dialog after a 3rd drink is dismissed with No', async ({ page }) => {
      await addDrinkToCart(page, 'Espresso');
      await addDrinkToCart(page, 'Mocha');

      // eslint-disable-next-line playwright/no-raw-locators
      const thirdDrink = page.locator('.cup-body[aria-label="Americano"]');
      await expect(thirdDrink).toBeVisible();
      await thirdDrink.click({ button: 'right' });
      await expect(page.getByRole('dialog')).toContainText('Add Americano to the cart?');
      await page.getByRole('dialog').getByRole('button', { name: 'No' }).click();

      await expect(page.getByLabel('Cart page')).toHaveText('cart (2)');
      await expect(page.getByRole('button').filter({ hasText: 'Total:' })).toHaveText('Total: $18.00');
    });

    test('Completed payment form shows a success message', async ({ page }) => {
      await addDrinkToCart(page, 'Espresso');
      await page.getByRole('button').filter({ hasText: 'Total:' }).click();
      // eslint-disable-next-line playwright/no-raw-locators
      await expect(page.locator('.modal')).toBeVisible();

      await page.getByLabel('Name').fill('Test User');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByRole('button', { name: 'Submit' }).click();

      await expect(page.getByText('Thanks for your purchase. Please check your email for payment.')).toBeVisible();
    });

    test('Skipped on a specific browser with a documented reason', async ({ browserName, page }) => {
      // eslint-disable-next-line playwright/no-skipped-test
      test.skip(
        browserName === 'webkit',
        'webkit project is disabled in playwright.config.ts for this assignment',
      );

      await addDrinkToCart(page, 'Espresso');
      await expect(page.getByLabel('Cart page')).toHaveText('cart (1)');
    });

    test('Annotated with a tracking issue', async ({ page }) => {
      const issueUrl = 'https://example.com/issues/123';
      test.info().annotations.push({ type: 'issue', description: issueUrl });

      await addDrinkToCart(page, 'Espresso');
      expect(test.info().annotations.some((annotation) => annotation.type === 'issue' && annotation.description === issueUrl)).toBeTruthy();
    });
  });
});
