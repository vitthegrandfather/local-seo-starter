import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const routes = [
  '/',
  '/uslugi/awarie-hydrauliczne',
  '/uslugi/instalacje',
  '/uslugi/udraznianie',
  '/obszar',
  '/kontakt',
  '/polityka-prywatnosci',
] as const;

const demoPayload = {
  name: 'Osoba Testowa',
  phone: '+48 000 000 000',
  email: 'test@example.com',
  district: 'Stare Miasto',
  message: 'Test demonstracyjnego formularza. Nie jest to zlecenie.',
  consent: true,
  website: '',
};

type SchemaNode = Record<string, unknown>;

function schemaNodes(value: unknown): SchemaNode[] {
  if (Array.isArray(value)) return value.flatMap(schemaNodes);
  if (!value || typeof value !== 'object') return [];
  const node = value as SchemaNode;
  return [...(node['@type'] ? [node] : []), ...schemaNodes(node['@graph'])];
}

function rawSchemas(html: string) {
  return [
    ...html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].flatMap((match) => schemaNodes(JSON.parse(match[1])));
}

async function fillValidContact(page: Page) {
  await page.getByLabel('Imię i nazwisko', { exact: true }).fill(demoPayload.name);
  await page.getByLabel('Telefon', { exact: true }).fill(demoPayload.phone);
  await page.getByLabel('Adres e-mail', { exact: true }).fill(demoPayload.email);
  await page.getByLabel('Dzielnica Krakowa', { exact: true }).selectOption(demoPayload.district);
  await page.getByLabel('Co wymaga naprawy?', { exact: true }).fill(demoPayload.message);
  await page.locator('#consent').check();
}

test('all seven pages have unique metadata, one H1 and required structured data', async ({
  page,
}) => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));

  for (const path of routes) {
    await test.step(path, async () => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const title = await page.title();
      expect(title).toContain('AquaFix Pro');
      expect(titles.has(title)).toBe(false);
      titles.add(title);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length).toBeGreaterThan(60);
      expect(descriptions.has(description!)).toBe(false);
      descriptions.add(description!);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(new URL(canonical!).pathname).toBe(path);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', canonical!);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        description!,
      );
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'pl_PL');
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        /\/og-image\.png$/,
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
      await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute('content', title);
      await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
        'content',
        description!,
      );
      await expect(
        page
          .locator('footer')
          .getByText('Demo portfolio project — not a real company.', { exact: true }),
      ).toBeVisible();

      const schemas = (
        await page.locator('script[type="application/ld+json"]').allTextContents()
      ).flatMap((text) => schemaNodes(JSON.parse(text)));
      const types = schemas.flatMap((node) => node['@type']);
      const expected =
        path === '/'
          ? ['Plumber', 'FAQPage']
          : path.startsWith('/uslugi/')
            ? ['Service', 'BreadcrumbList', 'FAQPage']
            : path === '/kontakt'
              ? ['Plumber', 'BreadcrumbList']
              : ['BreadcrumbList'];
      expect(types).toEqual(expect.arrayContaining(expected));
      if (path !== '/') await expect(page.locator('a[href="/"]').first()).toBeVisible();
      await expect(page.locator('a[href="/kontakt"]').first()).toBeVisible();
    });
  }
  expect(titles.size).toBe(7);
  expect(descriptions.size).toBe(7);
  expect(runtimeErrors).toEqual([]);
});

test('sitemap, robots and social preview asset are publicly reachable', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()['content-type']).toContain('xml');
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
  expect(urls.map((url) => url.pathname).sort()).toEqual([...routes].sort());
  expect(new Set(urls.map((url) => url.origin)).size).toBe(1);

  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const rules = await robots.text();
  expect(rules).toMatch(/User-Agent:\s*\*/i);
  expect(rules).toMatch(/Allow:\s*\//i);
  expect(rules).toMatch(/Disallow:\s*\/api\//i);
  expect(rules).toContain(`Sitemap: ${urls[0].origin}/sitemap.xml`);

  const image = await request.get('/og-image.png');
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toContain('image/png');
  expect((await image.body()).byteLength).toBeGreaterThan(1000);
});

test('JSON-LD is present and parseable in the initial HTML source', async ({ request }) => {
  const home = await request.get('/');
  const homeNodes = rawSchemas(await home.text());
  const business = homeNodes.find((node) => node['@type'] === 'Plumber');
  expect(business).toMatchObject({
    name: 'AquaFix Pro',
    telephone: '+48 12 345 67 89',
    address: {
      streetAddress: 'ul. Floriańska 12',
      postalCode: '31-019',
      addressLocality: 'Kraków',
      addressCountry: 'PL',
    },
    geo: { latitude: 50.0614, longitude: 19.9372 },
  });
  expect(business?.description).toMatch(/fikcyjna/i);
  expect(homeNodes.find((node) => node['@type'] === 'FAQPage')).toBeTruthy();

  const service = await request.get('/uslugi/awarie-hydrauliczne');
  const serviceNodes = rawSchemas(await service.text());
  expect(serviceNodes.map((node) => node['@type'])).toEqual(
    expect.arrayContaining(['Service', 'BreadcrumbList', 'FAQPage']),
  );
  const faq = serviceNodes.find((node) => node['@type'] === 'FAQPage');
  expect((faq?.mainEntity as unknown[]).length).toBeGreaterThanOrEqual(4);
  expect((faq?.mainEntity as unknown[]).length).toBeLessThanOrEqual(6);
});

test('unknown pages and unknown service slugs return actual 404 responses', async ({ page }) => {
  for (const path of ['/this-page-does-not-exist', '/uslugi/this-service-does-not-exist']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  }
});

test('form validates required fields, focuses the first error and succeeds honestly in demo mode', async ({
  page,
}) => {
  await page.goto('/kontakt');
  const submit = page.getByRole('button', { name: 'Wyślij zgłoszenie testowe', exact: true });
  await submit.click();
  await expect(page.locator('.form-error-summary')).toBeVisible();
  await expect(page.locator('.form-error-summary li')).toHaveCount(6);
  await expect(page.locator('#name')).toBeFocused();
  await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');

  await fillValidContact(page);
  await page.locator('#phone').fill('123abc');
  await submit.click();
  await expect(page.locator('#phone-error')).toBeVisible();
  await expect(page.locator('#phone')).toBeFocused();
  await page.locator('#phone').fill(demoPayload.phone);

  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/api/contact') && response.request().method() === 'POST',
  );
  await submit.click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ ok: true, mode: 'demo' });
  await expect(page.getByRole('heading', { name: 'Test formularza zakończony' })).toBeVisible();
  await expect(
    page.getByText('To tylko demonstracja. Wiadomość nie została wysłana do hydraulika.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator('.success-panel')).toBeFocused();
  await page.getByRole('button', { name: 'Wyślij kolejny test' }).click();
  await expect(page.locator('#name')).toBeFocused();
  await expect(page.locator('#name')).toHaveValue('');
});

test('network failure keeps entered data and never displays a success state', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.abort('failed'));
  await page.goto('/kontakt');
  await fillValidContact(page);
  await page.getByRole('button', { name: 'Wyślij zgłoszenie testowe', exact: true }).click();
  await expect(page.getByText(/Nie udało się przesłać formularza/)).toBeVisible();
  await expect(page.locator('.success-panel')).toHaveCount(0);
  await expect(page.locator('#message')).toHaveValue(demoPayload.message);
  await expect(page.locator('#email')).toHaveValue(demoPayload.email);
  await expect(
    page.getByRole('button', { name: 'Wyślij zgłoszenie testowe', exact: true }),
  ).toBeEnabled();
});

test('contact API rejects invalid requests and oversized bodies', async ({ request }) => {
  const missing = await request.post('/api/contact', { data: {} });
  expect(missing.status()).toBe(422);
  expect(Object.keys((await missing.json()).errors).sort()).toEqual([
    'consent',
    'district',
    'email',
    'message',
    'name',
    'phone',
  ]);

  const malformed = await request.post('/api/contact', {
    headers: { 'Content-Type': 'application/json' },
    data: Buffer.from('{bad json'),
  });
  expect(malformed.status()).toBe(400);
  const wrongType = await request.post('/api/contact', {
    headers: { 'Content-Type': 'text/plain' },
    data: 'test',
  });
  expect(wrongType.status()).toBe(415);
  const tooBig = await request.post('/api/contact', { data: { message: 'a'.repeat(18_000) } });
  expect(tooBig.status()).toBe(413);
  const wrongOrigin = await request.post('/api/contact', {
    headers: { Origin: 'https://unrelated.example' },
    data: demoPayload,
  });
  expect(wrongOrigin.status()).toBe(403);
  const unrecognizedDistrict = await request.post('/api/contact', {
    data: { ...demoPayload, district: 'Invented district' },
  });
  expect(unrecognizedDistrict.status()).toBe(422);
});

test('honeypot submissions are discarded without reporting webhook delivery', async ({
  request,
}) => {
  const response = await request.post('/api/contact', {
    data: { ...demoPayload, website: 'https://spam.example' },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true, mode: 'demo' });
  expect(response.headers()['cache-control']).toBe('no-store');
});

test('FAQ disclosures open and close with the keyboard', async ({ page }) => {
  await page.goto('/');
  const disclosure = page.locator('details').first();
  const summary = disclosure.locator('summary');
  await summary.focus();
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(disclosure.locator('p')).toBeVisible();
  await page.keyboard.press('Space');
  await expect(disclosure).not.toHaveAttribute('open');
  await expect(disclosure.locator('p')).not.toBeVisible();
});

test('mobile pages fit a 390px viewport and expose the fictional click-to-call CTA', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/uslugi/awarie-hydrauliczne', '/obszar', '/kontakt']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      width: window.innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content, `Horizontal overflow on ${path}`).toBeLessThanOrEqual(
      dimensions.width + 1,
    );
    const call = page.locator('.mobile-call a[href="tel:+48123456789"]');
    await expect(call).toBeVisible();
    await expect(call).toHaveAttribute('title', /fikcyjny/);
    await expect(page.locator('.mobile-call')).toContainText('Numer fikcyjny');
  }
});

test('all pages and mobile home/contact pass automated WCAG A and AA checks', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/kontakt']) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
});
