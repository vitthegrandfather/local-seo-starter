'use client';

import Link from 'next/link';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { analyticsCopy } from '@/content/form';
import {
  clearAnalyticsCookies,
  consentChangeEvent,
  ga4Id,
  initializeAnalytics,
  readAnalyticsConsent,
  saveAnalyticsConsent,
  trackPageView,
} from '@/lib/analytics';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(consentChangeEvent, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(consentChangeEvent, callback);
  };
}

export function Analytics() {
  const consent = useSyncExternalStore(subscribe, readAnalyticsConsent, () => 'unknown');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!ga4Id) return;
    if (consent === 'accepted') {
      trackPageView();
    } else if (window.aquaFixAnalyticsInitialized) {
      // A withdrawal from another tab must also stop this tab's loaded runtime.
      (window as unknown as Record<string, unknown>)[`ga-disable-${ga4Id}`] = true;
      clearAnalyticsCookies();
      window.location.reload();
    }
  }, [consent, pathname]);

  if (!ga4Id) return null;

  function choose(value: 'accepted' | 'rejected') {
    const wasAccepted = consent === 'accepted';
    saveAnalyticsConsent(value);
    setSettingsOpen(false);
    if (value === 'accepted') initializeAnalytics();
    if (wasAccepted && value === 'rejected') {
      clearAnalyticsCookies();
      // Remove the already-loaded third-party runtime and its listeners after withdrawal.
      window.location.reload();
    }
  }

  return (
    <>
      {consent === 'accepted' && (
        <Script
          id="aquafix-ga4"
          src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
          strategy="afterInteractive"
        />
      )}
      <div className="analytics-consent">
        {consent === 'unknown' || settingsOpen ? (
          <section className="analytics-panel" aria-labelledby="analytics-title">
            <h2 id="analytics-title">{analyticsCopy.title}</h2>
            <p>
              {analyticsCopy.description}{' '}
              <Link href="/polityka-prywatnosci">{analyticsCopy.privacy}</Link>
            </p>
            <div className="button-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => choose('rejected')}
              >
                {analyticsCopy.reject}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => choose('accepted')}
              >
                {analyticsCopy.accept}
              </button>
              {settingsOpen && (
                <button className="text-link" type="button" onClick={() => setSettingsOpen(false)}>
                  {analyticsCopy.close}
                </button>
              )}
            </div>
          </section>
        ) : (
          <button
            className="text-link analytics-settings"
            type="button"
            onClick={() => setSettingsOpen(true)}
          >
            {analyticsCopy.settings}
          </button>
        )}
      </div>
    </>
  );
}
