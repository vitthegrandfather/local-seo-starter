/**
 * Focused regression tests of the actual TypeScript modules, without a second
 * production build, browser, GA request, or real webhook. The installed TS
 * compiler removes types in memory; application source is not copied here.
 * Run: node --test scripts/test-logic.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const envKeys = ['FORM_ENDPOINT', 'FORM_ENDPOINT_TOKEN', 'NEXT_PUBLIC_GA4_ID'];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
const originalGlobals = Object.fromEntries(
  ['window', 'document', 'localStorage', 'fetch'].map((key) => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ]),
);
const originalInfo = console.info;

function loadModule(name) {
  const source = readFileSync(resolve(appRoot, `${name}.ts`), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const sourceModule = { exports: {} };
  const resolveImport = (id) => (id.startsWith('@/') ? loadModule(id.slice(2)) : require(id));
  new Function('require', 'module', 'exports', outputText)(
    resolveImport,
    sourceModule,
    sourceModule.exports,
  );
  return sourceModule.exports;
}

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  for (const [key, descriptor] of Object.entries(originalGlobals)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
  console.info = originalInfo;
});

const validPayload = {
  name: 'Osoba Testowa',
  phone: '+48 (000) 000-000',
  email: 'test@example.com',
  district: 'Stare Miasto',
  message: 'Test demonstracyjnego formularza. Nie jest to zlecenie.',
  consent: true,
  website: '',
};

function makeRequest(body, headers = {}) {
  return new Request('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function blockNetwork() {
  const calls = [];
  setGlobal('fetch', async (...args) => {
    calls.push(args);
    throw new Error('Network is disabled by the test harness');
  });
  return calls;
}

function fakeBrowser({ savedConsent, storageBlocked = false } = {}) {
  const storage = new Map();
  if (savedConsent) storage.set('aquafix-analytics-consent-v1', savedConsent);
  const events = [];
  const cookieWrites = [];
  const document = { title: 'Kontakt | AquaFix Pro' };
  Object.defineProperty(document, 'cookie', {
    get: () => '_ga=test-cookie; _ga_TEST=test-cookie; essential=keep',
    set: (value) => cookieWrites.push(value),
  });
  setGlobal('document', document);
  setGlobal('localStorage', {
    getItem(key) {
      if (storageBlocked) throw new Error('Storage blocked');
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      if (storageBlocked) throw new Error('Storage blocked');
      storage.set(key, value);
    },
  });
  setGlobal('window', {
    location: {
      origin: 'https://demo.example.com',
      hostname: 'demo.example.com',
      pathname: '/kontakt',
      search: '?email=private@example.com',
      hash: '#private-name',
    },
    dispatchEvent: (event) => events.push(event.type),
  });
  return { storage, events, cookieWrites };
}

function commands() {
  return (globalThis.window.dataLayer ?? []).map((entry) => Array.from(entry));
}

test('shared validation rejects missing, malformed and excessive inputs', () => {
  const { validateContact } = loadModule('lib/contact-validation');
  assert.equal(validateContact(validPayload).valid, true);
  for (const field of ['name', 'phone', 'email', 'district', 'message', 'consent']) {
    const result = validateContact({ ...validPayload, [field]: field === 'consent' ? false : '' });
    assert.equal(result.valid, false, field);
    assert.ok(result.errors[field], field);
  }
  for (const override of [
    { name: 'a'.repeat(101) },
    { name: 'A\nB' },
    { phone: '123abc789' },
    { phone: '12345678' },
    { email: 'invalid@email' },
    { email: `a${'b'.repeat(250)}@example.com` },
    { district: 'Invented district' },
    { message: 'a'.repeat(2001) },
    { consent: 'true' },
  ])
    assert.equal(validateContact({ ...validPayload, ...override }).valid, false);
  for (const input of [null, [], 'text', 42]) assert.equal(validateContact(input).valid, false);
});

test('demo submissions succeed locally with redacted logs and zero network calls', async () => {
  const calls = blockNetwork();
  delete process.env.FORM_ENDPOINT;
  const logs = [];
  console.info = (...args) => logs.push(args);
  const { POST } = loadModule('app/api/contact/route');
  const response = await POST(makeRequest(validPayload));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, mode: 'demo' });
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(calls.length, 0);
  assert.equal(logs.length, 1);
  const serialized = JSON.stringify(logs);
  for (const field of ['name', 'phone', 'email', 'district', 'message']) {
    assert.equal(
      serialized.includes(validPayload[field]),
      false,
      `${field} must not appear in logs`,
    );
  }
  assert.equal(logs[0][1].messageLength, validPayload.message.length);
});

test('API rejects invalid JSON, wrong types/origin, and oversized actual body', async () => {
  const calls = blockNetwork();
  const { POST } = loadModule('app/api/contact/route');
  const cases = [
    [makeRequest({}), 422],
    [makeRequest('{bad json'), 400],
    [makeRequest(validPayload, { 'Content-Type': 'text/plain' }), 415],
    [makeRequest(validPayload, { Origin: 'https://unrelated.example' }), 403],
    [makeRequest(validPayload, { 'Content-Length': '18000' }), 413],
    [makeRequest({ message: 'a'.repeat(18000) }), 413],
  ];
  for (const [request, status] of cases) assert.equal((await POST(request)).status, status);
  assert.equal(calls.length, 0);
});

test('honeypot prevents webhook execution even with a configured HTTPS receiver', async () => {
  const calls = blockNetwork();
  process.env.FORM_ENDPOINT = 'https://webhook.invalid/contact';
  const { POST } = loadModule('app/api/contact/route');
  const response = await POST(makeRequest({ ...validPayload, website: 'https://spam.invalid' }));
  assert.deepEqual(await response.json(), { ok: true, mode: 'demo' });
  assert.equal(calls.length, 0);
});

test('HTTPS webhook delivers only allowlisted payload, with timeout and redirects disabled', async () => {
  process.env.FORM_ENDPOINT = 'https://webhook.invalid/contact';
  process.env.FORM_ENDPOINT_TOKEN = 'test-token-never-a-real-secret';
  const calls = [];
  setGlobal('fetch', async (url, options) => {
    calls.push({ url: String(url), options });
    return new Response(null, { status: 204 });
  });
  const { POST } = loadModule('app/api/contact/route');
  const response = await POST(makeRequest({ ...validPayload, extraUntrustedField: 'discard-me' }));
  assert.deepEqual(await response.json(), { ok: true, mode: 'delivered' });
  assert.equal(calls.length, 1);
  const { url, options } = calls[0];
  assert.equal(url, process.env.FORM_ENDPOINT);
  assert.equal(options.headers.Authorization, `Bearer ${process.env.FORM_ENDPOINT_TOKEN}`);
  assert.equal(options.redirect, 'error');
  assert.equal(options.cache, 'no-store');
  assert.ok(options.signal instanceof AbortSignal);
  const { website, ...expected } = validPayload;
  assert.equal(website, '');
  assert.deepEqual(JSON.parse(options.body), { ...expected, source: 'aquafix-pro-demo' });
});

test('invalid endpoints fail before network access', async () => {
  const calls = blockNetwork();
  const { POST } = loadModule('app/api/contact/route');
  for (const endpoint of [
    'http://webhook.invalid',
    'not-a-url',
    'https://user:password@webhook.invalid',
  ]) {
    process.env.FORM_ENDPOINT = endpoint;
    assert.equal((await POST(makeRequest(validPayload))).status, 503);
  }
  assert.equal(calls.length, 0);
});

test('upstream failure, network error and timeout never produce success', async () => {
  process.env.FORM_ENDPOINT = 'https://webhook.invalid/contact';
  const { POST } = loadModule('app/api/contact/route');
  const failures = [
    async () => new Response(null, { status: 400 }),
    async () => new Response(null, { status: 503 }),
    async () => {
      throw new Error('mock network error');
    },
    async () => {
      throw new DOMException('mock timeout', 'TimeoutError');
    },
  ];
  for (const failure of failures) {
    setGlobal('fetch', failure);
    const response = await POST(makeRequest(validPayload));
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), { ok: false, error: 'upstream_unavailable' });
  }
});

test('absent or invalid GA IDs are no-ops, including without browser globals', () => {
  delete globalThis.window;
  for (const id of [undefined, '', 'UA-123', 'G-<script>', 'not-a-ga-id']) {
    if (id === undefined) delete process.env.NEXT_PUBLIC_GA4_ID;
    else process.env.NEXT_PUBLIC_GA4_ID = id;
    const analytics = loadModule('lib/analytics');
    assert.equal(analytics.ga4Id, null);
    assert.equal(analytics.readAnalyticsConsent(), 'unknown');
    assert.doesNotThrow(() => {
      analytics.initializeAnalytics();
      analytics.trackPageView();
      analytics.trackEvent('click_call');
    });
  }
});

test('valid GA with unknown or rejected consent never initializes a queue', () => {
  process.env.NEXT_PUBLIC_GA4_ID = 'G-TEST123456';
  const { events, storage } = fakeBrowser();
  const analytics = loadModule('lib/analytics');
  analytics.initializeAnalytics();
  analytics.trackPageView();
  analytics.trackEvent('click_call');
  assert.equal(window.dataLayer, undefined);
  assert.equal(window.gtag, undefined);
  analytics.saveAnalyticsConsent('rejected');
  analytics.trackEvent('generate_lead');
  assert.equal(window.dataLayer, undefined);
  assert.equal(window['ga-disable-G-TEST123456'], true);
  assert.equal(storage.get(analytics.consentStorageKey), 'rejected');
  assert.deepEqual(events, [analytics.consentChangeEvent]);
});

test('accepted GA tracks only explicit events with safe fields and sanitized URLs', () => {
  process.env.NEXT_PUBLIC_GA4_ID = 'G-TEST123456';
  fakeBrowser();
  const analytics = loadModule('lib/analytics');
  analytics.saveAnalyticsConsent('accepted');
  analytics.initializeAnalytics();
  analytics.initializeAnalytics();
  analytics.trackPageView();
  analytics.trackEvent('click_call', { location: 'header', ...validPayload });
  analytics.trackEvent('generate_lead', { location: 'form', ...validPayload });
  analytics.trackEvent('click_call', { location: 'private@example.com' });
  const queue = commands();
  assert.equal(queue.filter(([command]) => command === 'config').length, 1);
  const config = queue.find(([command]) => command === 'config')[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.equal(config.page_location, 'https://demo.example.com/kontakt');
  const events = queue.filter(([command]) => command === 'event');
  assert.deepEqual(
    events.map(([, name]) => name),
    ['page_view', 'click_call', 'generate_lead', 'click_call'],
  );
  assert.equal(events[1][2].link_location, 'header');
  assert.equal(events[2][2].method, 'contact_form');
  assert.equal(events[3][2].link_location, undefined);
  for (const [, , parameters] of events) {
    assert.equal(parameters.page_location, 'https://demo.example.com/kontakt');
    assert.equal(parameters.page_referrer, '');
    for (const field of ['name', 'phone', 'email', 'district', 'message', 'consent', 'website']) {
      assert.equal(field in parameters, false, `PII field ${field} must be omitted`);
    }
  }
  assert.equal(JSON.stringify(queue).includes('private@example.com'), false);
  assert.equal(JSON.stringify(queue).includes('#private-name'), false);
});

test('stored acceptance resumes, withdrawal stops events, and reacceptance resumes safely', () => {
  process.env.NEXT_PUBLIC_GA4_ID = 'G-TEST123456';
  fakeBrowser({ savedConsent: 'accepted' });
  const analytics = loadModule('lib/analytics');
  assert.equal(analytics.readAnalyticsConsent(), 'accepted');
  analytics.trackEvent('click_call');
  const acceptedCount = commands().length;
  analytics.saveAnalyticsConsent('rejected');
  analytics.trackPageView();
  analytics.trackEvent('generate_lead');
  assert.equal(commands().length, acceptedCount);
  assert.equal(window['ga-disable-G-TEST123456'], true);
  analytics.saveAnalyticsConsent('accepted');
  analytics.trackEvent('click_call');
  assert.equal(window['ga-disable-G-TEST123456'], false);
  assert.equal(commands().length, acceptedCount + 1);
  assert.equal(commands().filter(([command]) => command === 'config').length, 1);
});

test('blocked storage uses session consent; withdrawal clears only analytics cookies', () => {
  process.env.NEXT_PUBLIC_GA4_ID = 'G-TEST123456';
  const { cookieWrites } = fakeBrowser({ storageBlocked: true });
  const analytics = loadModule('lib/analytics');
  analytics.saveAnalyticsConsent('accepted');
  assert.equal(analytics.readAnalyticsConsent(), 'accepted');
  analytics.trackEvent('click_call');
  assert.ok(commands().length > 0);
  analytics.saveAnalyticsConsent('rejected');
  assert.equal(analytics.readAnalyticsConsent(), 'rejected');
  analytics.clearAnalyticsCookies();
  assert.ok(cookieWrites.some((cookie) => cookie.startsWith('_ga=;')));
  assert.ok(cookieWrites.some((cookie) => cookie.startsWith('_ga_TEST=;')));
  assert.ok(cookieWrites.every((cookie) => cookie.includes('Max-Age=0')));
  assert.ok(cookieWrites.every((cookie) => !cookie.startsWith('essential=')));
});
