import { Page, expect } from '@playwright/test';

export class LoginPage {
    constructor(private page: Page) { }
    async login(username = 'Admin', password = 'admin123') {
        await this.page.goto("https://opensource-demo.orangehrmlive.com/web/index.php/auth/login",
            { waitUntil: 'domcontentloaded', timeout: 60_000 }
        );

        const usernameInput = this.page.locator('input[name="username"]');
        await usernameInput.waitFor({ state: 'visible' });
        await usernameInput.fill(username);
        await this.page.locator('input[name="password"]').fill(password);

        await Promise.all([
            this.page.waitForURL("https://opensource-demo.orangehrmlive.com/web/index.php/dashboard**", { timeout: 60_000 }),
            this.page.locator('button[type="submit"]').click(),
        ]);

        await expect(
            this.page.locator('.oxd-topbar-header-breadcrumb')
        ).toBeVisible();
    }
}