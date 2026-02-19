import type { WorkerInfo } from "@playwright/test";

export interface EmployeeData {
  firstName: string;
  lastName: string;
  fullName: string;
}

/**
 * Generates a UNIQUE employee per parallel worker.
 *
 * Why this works:
 *  - workerIndex  → 0..4, unique per Playwright worker process
 *  - Date.now()   → millisecond timestamp, unique per run
 *
 * Even if 5 workers call this simultaneously, each gets a different
 * workerIndex, so names NEVER collide in the database or search results.
 *
 * Example outputs:
 *  Worker 0 → firstName: "W0Auto", lastName: "Test1718000000000"
 *  Worker 3 → firstName: "W3Auto", lastName: "Test1718000000003"
 */

export function generateEmployee(workerInfo: WorkerInfo): EmployeeData {
    const firstName = `W${workerInfo.workerIndex}Auto`;
    const lastName = `Test${Date.now()}`;
    return {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`
    };
}