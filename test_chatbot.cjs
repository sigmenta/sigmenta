const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('BROWSER PAGEERROR:', err));

    await page.goto('https://womensfavorite.web.app', { waitUntil: 'networkidle2' });

    const chatBtn = await page.waitForSelector('button[aria-label="কাস্টমার সাপোর্ট চ্যাটবট"]', { timeout: 10000 });
    await chatBtn.click();
    await new Promise(r => setTimeout(r, 800));

    // Test 1: Click "সেরা অফার"
    console.log('--- Testing "সেরা অফার" chip ---');
    const buttons1 = await page.$$('button');
    for (const b of buttons1) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('সেরা অফার')) {
        await b.click();
        console.log('Clicked সেরা অফার!');
        break;
      }
    }
    await new Promise(r => setTimeout(r, 4000));

    // Extract all chat messages
    const messages = await page.evaluate(() => {
      const items = document.querySelectorAll('.whitespace-pre-line');
      return Array.from(items).map(el => el.textContent);
    });

    console.log('ALL MESSAGES AFTER SERA OFFER:', JSON.stringify(messages, null, 2));

    await page.screenshot({ path: 'chatbot_test_sera_offer.png' });
    console.log('Saved chatbot_test_sera_offer.png');

    await browser.close();
  } catch (e) {
    console.error('Test error:', e);
  }
})();
