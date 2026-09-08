import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Analytics } from '@/components/analytics';
import { siteUrl, isNoindex } from '@/lib/seo';
import './globals.css';
const manrope = localFont({
  src: '../public/fonts/manrope-latin-wght-normal.woff2',
  variable: '--font-manrope',
  display: 'swap',
  weight: '200 800',
  fallback: [],
  adjustFontFallback: false,
  preload: true,
});
const manropeExt = localFont({
  src: '../public/fonts/manrope-latin-ext-wght-normal.woff2',
  variable: '--font-manrope-ext',
  display: 'swap',
  weight: '200 800',
  fallback: [],
  adjustFontFallback: false,
  preload: true,
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'LocalSEO Starter — AquaFix Pro Demo',
  robots: { index: !isNoindex, follow: true },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
  icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" className={`${manrope.variable} ${manropeExt.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Przejdź do treści
        </a>
        <SiteHeader />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}
