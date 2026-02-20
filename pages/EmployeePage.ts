import { Page, expect, Locator } from '@playwright/test';
import { EmployeeData } from '../utils/testData';

export class EmployeePage {
    private readonly addEmployeeUrl = 'https://opensource-demo.orangehrmlive.com/web/index.php/pim/addEmployee';
    private readonly listUrl = 'https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList';
    constructor(private page: Page) { }


    async addEmployee(employee: EmployeeData) {
        await this.page.goto(this.addEmployeeUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        
        const firstNameInput = this.page.locator('input[name="firstName"]');
        await firstNameInput.waitFor({ state:'visible', timeout: 30_000 });
        await firstNameInput.fill(employee.firstName);
        
        const lastNameInput = this.page.locator('input[name="lastName"]');
        await lastNameInput.waitFor({ state: 'visible', timeout: 30_000 });
        await lastNameInput.clear();
        await lastNameInput.fill(employee.lastName);

        const empIdInput = this.page.locator('.oxd-input-group')
            .filter({ hasText: 'Employee Id' })
            .locator('input.oxd-input');
        await empIdInput.waitFor({ state: 'visible', timeout: 30_000 });
        const empId = await empIdInput.inputValue();

        await expect(firstNameInput).toHaveValue(employee.firstName);
        await expect(lastNameInput).toHaveValue(employee.lastName);

        // ✅ Wait for Save button to be enabled AND stable before clicking
        const saveButton = this.page.locator('button[type="submit"]');
        await saveButton.waitFor({ state: 'visible', timeout: 30_000 });

        // ✅ Ensure button is not disabled
        await expect(saveButton).toBeEnabled({ timeout: 10_000 });

        // ✅ Set up navigation listener BEFORE clicking
        const navigationPromise = this.page.waitForURL(
            '**/pim/viewPersonalDetails/**',
            { waitUntil: 'domcontentloaded', timeout: 60_000 }
        );

        // ✅ Use click with force:false to ensure element is truly interactable
        await saveButton.click({ force: false, timeout: 10_000 });

        // ✅ If navigation doesn't happen, check for validation errors
        await navigationPromise.catch(async () => {
            // Check if there's a form validation error showing
            const hasError = await this.page.locator('.oxd-input-field-error-message').isVisible().catch(() => false);
            if (hasError) {
                const errorText = await this.page.locator('.oxd-input-field-error-message').textContent();
                throw new Error(`Form validation failed: ${errorText}`);
            }
            throw new Error(`Navigation to personalDetails did not happen. Current URL: ${this.page.url()}`);
        });

        const personalDetailsElement = this.page.locator('.orangehrm-edit-employee-name');
        await expect(personalDetailsElement).toBeVisible({ timeout: 30_000 });
        
        console.log('[addEmployee] Successfully created employee, now on:', this.page.url());
        return empId;
    }

    async searchEmployee(employee: EmployeeData): Promise<void> {
        await this.page.goto(this.listUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60_000
        });

        await this.page.waitForSelector('.orangehrm-header-container',
            {
                state: 'visible',
                timeout: 30_000
            });
        
        const nameInput = this.page.locator('.oxd-table-filter input[placeholder="Type for hints..."]').first();
        await nameInput.waitFor({ state: 'visible' , timeout: 30_000});
        await nameInput.fill(employee.fullName);

        // Optional dropdown handling - may not always appear
        try {
            const dropdown = this.page.locator(".oxd-autocomplete-dropdown");
            await dropdown.waitFor({ state: 'visible', timeout: 10_000 });
            
            const option = this.page.locator('.oxd-autocomplete-option')
                .filter({ hasText: employee.firstName })
                .first();

            if (await option.count() > 0) {
                await option.click();
                await dropdown.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
            }
        } catch {
            // Dropdown may not appear on slow networks - that's ok
        }

        // Wait for search API response before verifying results
        const searchResponsePromise = 
            this.page.waitForResponse(
                (resp) =>
                    resp.url().includes('pim/employees') &&
                    resp.status() === 200,
                { timeout: 60_000 }
            );
        
        await this.page.locator('button[type="submit"]').click();
        const searchResponse = await searchResponsePromise;
        expect(searchResponse.ok()).toBeTruthy();
    }

    async verifyEmployeeInTable(employee: EmployeeData,
        employeeId: string):
        Promise<void> {
        // Wait for any loading spinners to disappear
        try {
            await this.page
                .locator(".oxd-loading-spinner")
                .waitFor({ state: 'hidden', timeout: 15_000 });
        } catch {
            // Spinner might not exist, that's ok
        }

        // Ensure table is visible
        const tableBody = this.page.locator(".oxd-table-body");
        await tableBody.waitFor({ state: 'visible', timeout: 30_000 });

        // Find the row by employee last name
        const targetRow = tableBody.locator('.oxd-table-row', {
            hasText: employee.lastName,
        });

        // Verify the row exists and contains correct data
        await expect(targetRow).toBeVisible({ timeout: 30_000 });
        await expect(targetRow).toContainText(employee.firstName);
        await expect(targetRow).toContainText(employee.lastName);

        // Optional: click edit button if needed for further verification
        const editButton = targetRow.locator("button").first();
        if (await editButton.count() > 0) {
            // Don't click for now - just verify presence
            await expect(editButton).toBeVisible({ timeout: 10_000 });
        }
    }
}