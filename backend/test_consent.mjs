import { chromium } from 'playwright';

(async () => {
  console.log("Starting Playwright...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('requestfailed', request => console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText));
  page.on('response', response => {
    if (response.url().includes('/api/patients') || response.url().includes('/api/')) {
        if(response.request().method() !== 'OPTIONS' && response.request().method() !== 'GET') {
            console.log('RESPONSE:', response.request().method(), response.url(), response.status());
            response.text().then(text => console.log('RESPONSE BODY:', text)).catch(() => {});
        }
    }
  });

  try {
      console.log("Navigating to login...");
      await page.goto('http://localhost:3000/login');
      
      console.log("Logging in as patient@example.com (or checking system)...");
      await page.fill('input[type="email"]', 'patient@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);
      
      console.log("Navigating to profile...");
      await page.goto('http://localhost:3000/patient/profile');

      await page.waitForTimeout(3000);

      const editButtons = await page.$$('button[title^="Edit"]');
      console.log("Found edit buttons:", editButtons.length);
      
      let clicked = false;
      for (const btn of editButtons) {
          const title = await btn.getAttribute('title');
          if (title && title.includes('Data Privacy')) {
              await btn.click();
              console.log("Clicked edit on Data Privacy");
              clicked = true;
              break;
          }
      }

      if (!clicked) {
          console.log("Could not find the Edit button for Consent!");
      }

      await page.waitForTimeout(1000);

      const explicitRadio = await page.$('input[value="explicit"]');
      if (explicitRadio) {
          await explicitRadio.click();
          console.log("Clicked 'explicit' radio button.");
      }
      
      await page.waitForTimeout(500);

      const saveBtn = await page.$('button[form="form-consent"][type="submit"]');
      if (saveBtn) {
          await saveBtn.click();
          console.log("Clicked SAVE button!");
      } else {
          console.log("Could not find SAVE button!");
          
          // Let's check what buttons exist
          const allBtns = await page.$$('button');
          for(const b of allBtns) {
               console.log("Button:", await b.evaluate(node => node.outerHTML));
          }
      }

      await page.waitForTimeout(3000);
  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
  }
})();
