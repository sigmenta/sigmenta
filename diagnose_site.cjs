const puppeteer = require('puppeteer');

(async () => {
  const consoleErrors = [];
  const networkErrors = [];

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push({ type: msg.type(), text: msg.text() });
      }
      console.log('BROWSER:', msg.type(), msg.text().substring(0, 200));
    });
    page.on('pageerror', err => {
      consoleErrors.push({ type: 'pageerror', text: err.message });
      console.error('PAGEERROR:', err.message.substring(0, 300));
    });
    page.on('requestfailed', req => {
      networkErrors.push({ url: req.url(), reason: req.failure()?.errorText });
      console.log('REQUEST FAILED:', req.url().substring(0, 150), req.failure()?.errorText);
    });

    console.log('=== Loading homepage ===');
    const t0 = Date.now();
    await page.goto('https://womensfavorite.web.app', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`Homepage loaded in ${Date.now() - t0}ms`);

    // Check if main content rendered
    const hasContent = await page.evaluate(() => {
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const root = document.querySelector('#root');
      return {
        hasHeader: !!header,
        hasMain: !!main,
        rootChildren: root?.children.length ?? 0,
        bodyText: document.body.innerText.substring(0, 200),
        title: document.title,
      };
    });
    console.log('Page content:', JSON.stringify(hasContent, null, 2));

    await page.screenshot({ path: 'homepage_test.png', fullPage: false });

    // Now test /products page
    console.log('\n=== Loading /products page ===');
    const t1 = Date.now();
    await page.goto('https://womensfavorite.web.app/products', { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`Products page loaded in ${Date.now() - t1}ms`);

    const productsContent = await page.evaluate(() => ({
      bodyText: document.body.innerText.substring(0, 300),
      loadingSpinners: document.querySelectorAll('.animate-spin').length,
      productCards: document.querySelectorAll('[class*="product"]').length,
    }));
    console.log('Products content:', JSON.stringify(productsContent, null, 2));

    await page.screenshot({ path: 'products_test.png', fullPage: false });

    // Test cart page
    console.log('\n=== Loading /cart page ===');
    await page.goto('https://womensfavorite.web.app/cart', { waitUntil: 'networkidle2', timeout: 15000 });
    const cartContent = await page.evaluate(() => ({
      bodyText: document.body.innerText.substring(0, 200),
    }));
    console.log('Cart content:', JSON.stringify(cartContent));

    console.log('\n=== ERRORS SUMMARY ===');
    console.log('Console errors:', JSON.stringify(consoleErrors.slice(0, 10), null, 2));
    console.log('Network errors:', JSON.stringify(networkErrors.slice(0, 10), null, 2));

    await browser.close();
  } catch (e) {
    console.error('Test error:', e.message);
    console.log('Console errors so far:', JSON.stringify(consoleErrors.slice(0, 10), null, 2));
    console.log('Network errors so far:', JSON.stringify(networkErrors.slice(0, 10), null, 2));
  }
})();
