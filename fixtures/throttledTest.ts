import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

type ThrottleFixtures = {
    /**
   * A page with CDP-level network throttling applied.
   * Simulates a real-world slow/corporate network (1.5 Mbps, 150ms latency).
   * This is the environment that exposes race conditions and timing bugs.
   *
   * Using CDP (Chrome DevTools Protocol) means:
   * - The throttle is applied at the network layer, not via JS hacks
   * - It affects XHR, fetch, resource loading — everything
   * - No waitForTimeout needed; the smart waits handle the slowness
   */
    throttledPage: Page;
};

export const test = base.extend<ThrottleFixtures>({
    throttledPage: async ({ browser, context }, use) => {
        // Create a new page in the provided context
        const page = await context.newPage();
        try {
            const cdp = await context.newCDPSession(page);
            await cdp.send('Network.enable');
            await cdp.send('Network.emulateNetworkConditions', {
                offline: false,
                downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps in bytes/s
                uploadThroughput: 1.5 * 1024 * 1024 / 8, // same for upload
                latency: 150, // 150ms latency
            });
            console.log('[throttledPage] CDP network throttling enabled');
        } catch (error) {
            console.log('[throttledPage] CDP not available - running without throttle');
            console.log('[throttledPage] Error:', error instanceof Error ? error.message : String(error));
        }
        
        // Use the page for the test
        await use(page);

        // Context cleanup is handled by Playwright automatically
    },
});

export { expect } from '@playwright/test';
