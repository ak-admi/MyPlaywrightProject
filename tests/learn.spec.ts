import { test, expect } from '@playwright/test';

const BASE = 'https://www.saucedemo.com';

test.describe('SauceDemo E2E', () => {
  test('valid login shows inventory', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await expect(page).toHaveURL(/inventory.html/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('invalid login shows error', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('#user-name', 'locked_out_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');
    await expect(page.locator('[data-test="error"]')).toContainText('locked out');
  });

  test('add 3 items -> verify cart count', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');

    const items = page.locator('.inventory_item');
    await items.nth(0).getByRole('button', { name: 'Add to cart' }).click();
    await items.nth(1).getByRole('button', { name: 'Add to cart' }).click();
    await items.nth(2).getByRole('button', { name: 'Add to cart' }).click();

    await expect(page.locator('.shopping_cart_badge')).toHaveText('3');
  });

  test('remove item -> verify update', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');

    const items = page.locator('.inventory_item');
    await items.nth(0).getByRole('button', { name: 'Add to cart' }).click();
    await items.nth(1).getByRole('button', { name: 'Add to cart' }).click();
    await items.nth(2).getByRole('button', { name: 'Add to cart' }).click();

    await page.click('.shopping_cart_link');
    // remove first cart item
    await page.locator('.cart_item').first().getByRole('button', { name: 'Remove' }).click();
    // cart badge should update to 2
    await expect(page.locator('.shopping_cart_badge')).toHaveText('2');
  });

  test('complete checkout -> assert confirmation message', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('#user-name', 'standard_user');
    await page.fill('#password', 'secret_sauce');
    await page.click('#login-button');

    // add one item
    await page.locator('.inventory_item').first().getByRole('button', { name: 'Add to cart' }).click();
    await page.click('.shopping_cart_link');

    await page.click('[data-test="checkout"]');
    await page.fill('#first-name', 'Test');
    await page.fill('#last-name', 'User');
    await page.fill('#postal-code', '12345');
    await page.click('[data-test="continue"]');
    await page.click('[data-test="finish"]');

    await expect(page.locator('.complete-header')).toHaveText('Thank you for your order!');
  });
});
