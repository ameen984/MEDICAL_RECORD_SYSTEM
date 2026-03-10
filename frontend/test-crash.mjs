import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    // We create a persistent context or just inject credentials
    const context = await browser.newContext();
    const page = await context.newPage();

    let errorLogs = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errorLogs.push(`[Console Error] ${msg.text()}`);
        }
    });
    page.on('pageerror', error => {
        errorLogs.push(`[React Crash] ${error.message}\n${error.stack}`);
    });

    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    const emailField = await page.$('input[type="email"]');
    if (emailField) {
        console.log("Logging in using generic admin (mongo@)...");
        await page.fill('input[type="email"]', 'mongo@example.com');
        await page.fill('input[type="password"]', 'mongo123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard');
    }

    console.log("Go to users page...");
    await page.goto('http://localhost:5173/users');
    await page.waitForLoadState('networkidle');

    console.log("Looking for Edit buttons...");
    const buttons = await page.locator('button:has-text("Edit")');
    const count = await buttons.count();
    
    if (count > 0) {
        console.log(`Found ${count} Edit buttons. Clicking first one...`);
        await buttons.first().click();
        
        // Wait briefly for react to crash or modal to appear
        await page.waitForTimeout(2000);
        
        console.log("\n--- React Crash Logs ---");
        if (errorLogs.length === 0) {
             console.log("NO REACT ERRORS FOUND.");
        }
        errorLogs.forEach(e => console.log(e));
        
        console.log("\n--- Resulting DOM ---");
        const bodyContent = await page.evaluate(() => document.documentElement.innerHTML);
        if (bodyContent.length < 2000 || bodyContent.includes('vite-error-overlay')) {
             console.log("DOM CRASH HAS BEEN DETECTED.");
        } else {
             console.log("App rendered perfectly! No blank page.");
        }
    } else {
        console.log("Could not find Edit buttons. Is the table empty? (You shouldn't see bugs if you can't click edit)");
        console.log("HTML:", await page.innerHTML('body'));
    }

    await browser.close();
})();
