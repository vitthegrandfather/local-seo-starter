export const ga4Id = /^G-[A-Z0-9]{6,20}$/.test(process.env.NEXT_PUBLIC_GA4_ID ?? '')
  ? process.env.NEXT_PUBLIC_GA4_ID!
  : null;

export const consentStorageKey = 'aquafix-analytics-consent-v1';
export const consentChangeEvent = 'aquafix:analytics-consent';
export type AnalyticsConsent = 'accepted' | 'rejected' | 'unknown';
type AnalyticsEvent = 'generate_lead' | 'click_call';
type Gtag = (command: 'js' | 'config' | 'event', ...values: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    aquaFixAnalyticsConsent?: AnalyticsConsent;
    aquaFixAnalyticsInitialized?: boolean;
  }
}

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const saved = localStorage.getItem(consentStorageKey);
    return saved === 'accepted' || saved === 'rejected'
      ? saved
      : (window.aquaFixAnalyticsConsent ?? 'unknown');
  } catch {
    return window.aquaFixAnalyticsConsent ?? 'unknown';
  }
}

export function saveAnalyticsConsent(consent: 'accepted' | 'rejected') {
  window.aquaFixAnalyticsConsent = consent;
  try {
    localStorage.setItem(consentStorageKey, consent);
  } catch {
    /* Session-only choice when storage is blocked. */
  }
  if (ga4Id) {
    (window as unknown as Record<string, unknown>)[`ga-disable-${ga4Id}`] = consent !== 'accepted';
  }
  window.dispatchEvent(new Event(consentChangeEvent));
}

export function initializeAnalytics() {
  if (
    !ga4Id ||
    typeof window === 'undefined' ||
    readAnalyticsConsent() !== 'accepted' ||
    window.aquaFixAnalyticsInitialized
  )
    return;
  window.dataLayer ??= [];
  window.gtag ??= function () {
    // gtag's command queue uses the Arguments object, matching Google's documented stub.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  window.aquaFixAnalyticsInitialized = true;
  window.gtag('js', new Date());
  window.gtag('config', ga4Id, {
    ...safePageContext(),
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

function safePageContext() {
  return {
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_referrer: '', // Never send query strings, hashes, or external referrer parameters.
  };
}

export function trackPageView() {
  if (!ga4Id || typeof window === 'undefined' || readAnalyticsConsent() !== 'accepted') return;
  initializeAnalytics();
  window.gtag?.('event', 'page_view', { ...safePageContext(), page_title: document.title });
}

/** Only allow fixed UI placements; no names, phone numbers, email, message, or district. */
export function trackEvent(event: AnalyticsEvent, details: { location?: string } = {}) {
  if (!ga4Id || typeof window === 'undefined' || readAnalyticsConsent() !== 'accepted') return;
  initializeAnalytics();
  const placements = ['header', 'hero', 'footer', 'mobile', 'contact', 'service', 'cta', 'form'];
  window.gtag?.('event', event, {
    ...safePageContext(),
    ...(placements.includes(details.location ?? '') ? { link_location: details.location } : {}),
    ...(event === 'generate_lead' ? { method: 'contact_form' } : {}),
  });
}

export function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (name !== '_ga' && !name.startsWith('_ga_')) continue;
    const expired = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = expired;
    const hostnameParts = window.location.hostname.split('.');
    for (let i = 0; i < hostnameParts.length - 1; i++) {
      document.cookie = `${expired}; domain=.${hostnameParts.slice(i).join('.')}`;
    }
  }
}
