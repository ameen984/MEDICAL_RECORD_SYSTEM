import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    let logs = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            logs.push(`[Console Error] ${msg.text()}`);
        }
    });
    page.on('pageerror', error => {
        logs.push(`[Page Error] ${error.message}\n${error.stack}`);
    });

    console.log("Navigating to login...");
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
        console.log("Logging in...");
        await page.fill('input[type="email"]', 'mongo@example.com');
        await page.fill('input[type="password"]', 'mongo123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1500);
    }

    console.log("Testing dashboard reachability...");
    await page.goto('http://localhost:5173/users');
    await page.waitForTimeout(2000);

    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    if (!bodyContent.includes('Edit')) {
        console.log("No Edit text found on page! The API might be failing or we are not logged in.");
        console.log("Current URL:", page.url());
        console.log("DOM dump:", bodyContent.slice(0, 1000));
    } else {
        console.log("Clicking the first Edit button found by matching its class or text...");
        // the button is something like: <button class="text-primary-600 hover:text-primary-900 transition-colors">Edit</button>
        const editButtons = await page.$$('button:has-text("Edit")');
        if (editButtons.length > 0) {
            await editButtons[0].click();
            await page.waitForTimeout(1000);
            
            const html = await page.evaluate(() => document.body.innerHTML);
            console.log("\n--- RESULTING DOM AFTER EDIT CLICK ---");
            console.log(html);
            console.log("\n--- LOGS ---");
            console.log(logs.join('\n'));
        }
    }
    
    await browser.close();
})();
