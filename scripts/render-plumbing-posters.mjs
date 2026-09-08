import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { resolve } from 'node:path';

// Render the same real geometry as the live hero. No external image service.
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 2200, height: 1800 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  await page.goto(process.argv[2] || 'http://localhost:3000/', { waitUntil: 'networkidle' });
  const art = page.getByTestId('interactive-plumbing');
  const control = art.getByRole('slider', { name: 'Otwarcie zaworu', exact: true });
  await control.focus();
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="interactive-plumbing"]').dataset.renderer === 'webgl',
  );
  await page.addStyleTag({
    content:
      'html, body, .hero { background: transparent !important; } [data-testid="interactive-plumbing"] [role="slider"] { outline: none !important; } [data-testid="plumbing-scene"] { width: 900px !important; height: 900px !important; }',
  });
  await page.waitForFunction(() => document.querySelector('canvas').width === 900);
  const renderedFrame = () =>
    page.evaluate(
      () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
    );
  for (const state of ['closed', 'open']) {
    if (state === 'open') await control.press('End');
    await renderedFrame();
    const png = await art.locator('canvas').screenshot({ omitBackground: true });
    const destination = resolve(`public/images/plumbing-3d-${state}.webp`);
    const image = await sharp(png).webp({ quality: 92, effort: 6 }).toFile(destination);
    console.log(`${destination}: ${image.width} × ${image.height}, ${image.size} bytes`);
  }
} finally {
  await browser.close();
}
