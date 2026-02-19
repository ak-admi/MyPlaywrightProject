import {Page,expect, Locator} from '@playwright/test';
import { EmployeeData } from '../utils/testData';

export class EmployeePage {
    private readonly addEmployeeUrl= 'https://opensource-demo.orangehrmlive.com/web/index.php/pim/addEmployee';
    private readonly listUrl='https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewEmployeeList';
    constructor(private page:Page){}
    async addEmployee(employee:EmployeeData) {
        await this.page.goto(this.addEmployeeUrl);
        const firstNameInput = this.page.locator('input[name="firstName"]');
        await firstNameInput.waitFor({ state: 'visible' });
        await firstNameInput.fill(employee.firstName);
        await this.page.locator('input[name="lastName"]').fill(employee.lastName);
        const empIdInput=this.page.locator('input[name="employeeId"]');
        await empIdInput.waitFor({ state: 'visible' });
        const empId=await empIdInput.inputValue();
        await Promise.all([
            this.page.waitForURL('https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewPersonalDetails**', { timeout: 30_000 }),
             this.page.locator('button[type="submit"]').click(),
        ]);
        await expect(this.page.locator('.orangehrm-edit-employee-name')).toBeVisible();
        return empId;
    }

    async searchEmployee(employee:EmployeeData):Promise<void> {
        await this.page.goto(this.listUrl);

        await this.page.waitForSelector('.orangehrm-header-container', { state: 'visible' });
        const nameInput=this.page.locator('.oxd-table-filter input[placeholder="Type for hints..."]').first();
        await nameInput.waitFor({ state: 'visible' });
        await nameInput.fill(employee.firstName);

        const dropdown=this.page.locator(".oxd-autocomplete-dropdown");
        await dropdown.waitFor({state:'visible',timeout:8_000}).catch((()=>{}));

        const option =this.page.locator('.oxd-autocomplete-option',{ hasText: employee.firstName }).first();

        if(await option.isVisible()){
            await option.click();
        }

        const [searchResponse] =await Promise.all([
            this.page.waitForResponse(
                (resp)=>
                    resp.url().includes('pim/searchEmployeeList') &&
                resp.status()===200,
                {timeout: 20_000}
            ),
            this.page.locator('button[type="submit"]').click(),
        ]);
        expect(searchResponse.ok()).toBeTruthy();
    }

    async verifyEmployeeInTable(employee:EmployeeData,
        employeeId:string):
        Promise<void>{
            await this.page
            .locator(".oxd-loading-spinner")
            .waitFor({state:'hidden',timeout:15_000})
            .catch((()=>{}));

            const tableBody=this.page.locator(".oxd-table-body");
            await tableBody.waitFor({state:'visible'});

            const targetRow=tableBody.locator('.oxd-table-row',{
                hasText: employee.lastName,
            });

            await expect(targetRow).toBeVisible();
            await expect(targetRow).toContainText(employee.firstName);
            await expect(targetRow).toContainText(employee.lastName);

            const editButton =targetRow.locator("button").first();
            await editButton.click();

            await this.page.waitForURL(
                "https://opensource-demo.orangehrmlive.com/web/index.php/pim/viewPersonalDetails**",
                {timeout: 20_000}
            );

            await expect(this.page.locator('input[name="employeeId"]')).toHaveValue(employeeId);
        }
}