import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Let Playwright launch Chrome: chrome-launcher's direct Windows spawn is unreliable
// on some Node releases. Lighthouse attaches through the local debugging port.
const server = createServer();
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const port = server.address().port;
await new Promise((done) => server.close(done));
const browser = await chromium.launch({
  headless: true,
  args: [`--remote-debugging-port=${port}`],
});
try {
  const url = process.argv[2] || 'http://localhost:3000';
  const directory = resolve(process.argv[3] || '.lighthouse');
  const result = await lighthouse(url, {
    port,
    output: ['json', 'html'],
    logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  if (!result || result.lhr.runtimeError)
    throw new Error(result?.lhr.runtimeError?.message || 'No report');
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'mobile.json'), result.report[0]);
  await writeFile(resolve(directory, 'mobile.html'), result.report[1]);
  console.log(
    JSON.stringify(
      {
        url: result.lhr.finalDisplayedUrl,
        fetchTime: result.lhr.fetchTime,
        scores: Object.fromEntries(
          Object.entries(result.lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
        metrics: Object.fromEntries(
          [
            'first-contentful-paint',
            'largest-contentful-paint',
            'total-blocking-time',
            'cumulative-layout-shift',
            'speed-index',
          ].map((key) => [key, result.lhr.audits[key].displayValue]),
        ),
        reports: directory,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
