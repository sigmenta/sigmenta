const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER PAGEERROR:', err));

  console.log('Navigating to https://womensfavorite.web.app...');
  await page.goto('https://womensfavorite.web.app', { waitUntil: 'networkidle2' });

  console.log('Page loaded. Looking for chatbot button...');
  const chatBtn = await page.waitForSelector('button[aria-label="কাস্টমার সাপোর্ট চ্যাটবট"]', { timeout: 10000 });
  await chatBtn.click();
  console.log('Chatbot button clicked!');

  await new Promise(r => setTimeout(r, 1000));

  console.log('Looking for delivery charge chip...');
  const buttons = await page.$$('button');
  let deliveryChip = null;
  for (const b of buttons) {
    const text = await page.evaluate(el => el.textContent, b);
    if (text && text.includes('ডেলিভারি চার্জ')) {
      deliveryChip = b;
      console.log('Found chip:', text);
      break;
    }
  }

  if (deliveryChip) {
    await deliveryChip.click();
    console.log('Clicked delivery chip! Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));
  } else {
    console.log('Delivery chip not found!');
  }

  // Extract all chat messages
  const messages = await page.evaluate(() => {
    const els = document.querySelectorAll('.whitespace-pre-line');
    return Array.from(els).map(el => el.textContent);
  });

  console.log('Messages in chat:', JSON.stringify(messages, null, 2));

  // Let's also take a screenshot of the chat window
  await page.screenshot({ path: 'chatbot_test_result.png' });
  console.log('Screenshot saved to chatbot_test_result.png');

  await browser.close();
})();
