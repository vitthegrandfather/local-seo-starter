import type { Metadata } from 'next';
import { site, type FAQ } from '@/content/site';
import type { Service } from '@/content/services';

function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  const candidate = configured || (vercelHost ? `https://${vercelHost}` : 'http://localhost:3000');
  const url = new URL(candidate);

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('NEXT_PUBLIC_SITE_URL must be a public HTTP(S) origin without credentials.');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL must be an origin, for example https://your-project.vercel.app.',
    );
  }

  return url.origin;
}

export const siteUrl = resolveSiteUrl();
export const isNoindex = process.env.NEXT_PUBLIC_NOINDEX === 'true';

export function absoluteUrl(path: string = '/'): string {
  return new URL(path, `${siteUrl}/`).toString();
}

type PageMetadata = {
  title: string;
  description: string;
  path: string;
};

/** Pass a page-specific title without the brand suffix. */
export function makeMetadata({ title, description, path }: PageMetadata): Metadata {
  const pageTitle = `${title} | ${site.name}`;
  const url = absoluteUrl(path);
  const image = {
    url: absoluteUrl('/og-image.png'),
    width: 1200,
    height: 630,
    alt: `${site.name} — hydraulik w Krakowie. Projekt demonstracyjny.`,
  };

  return {
    metadataBase: new URL(siteUrl),
    title: { absolute: pageTitle },
    description,
    applicationName: 'LocalSEO Starter',
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'pl_PL',
      siteName: site.name,
      title: pageTitle,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image],
    },
    robots: {
      index: !isNoindex,
      follow: true,
      googleBot: {
        index: !isNoindex,
        follow: true,
        'max-image-preview': 'large',
      },
    },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

const regularHours = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '08:00',
    closes: '20:00',
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Saturday',
    opens: '09:00',
    closes: '14:00',
  },
];

const emergencyHours = {
  '@type': 'OpeningHoursSpecification',
  dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  opens: '00:00',
  closes: '23:59',
};

const areaServed = {
  '@type': 'City',
  name: 'Kraków',
};

export function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Plumber',
    '@id': absoluteUrl('/#business'),
    name: site.name,
    description:
      'Fikcyjna firma hydrauliczna w Krakowie, stworzona wyłącznie na potrzeby demonstracyjnego projektu portfolio LocalSEO Starter. Dane kontaktowe, adres i oferta są przykładowe; firma nie przyjmuje rzeczywistych zleceń.',
    url: absoluteUrl('/'),
    image: absoluteUrl('/og-image.png'),
    telephone: site.phone,
    email: site.email,
    address: {
      '@type': 'PostalAddress',
      ...site.address,
    },
    geo: {
      '@type': 'GeoCoordinates',
      ...site.geo,
    },
    areaServed,
    openingHoursSpecification: regularHours,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Dyżur awaryjny — fikcyjna oferta demo',
      telephone: site.phone,
      availableLanguage: 'pl',
      areaServed,
      hoursAvailable: emergencyHours,
    },
  };
}

export function serviceSchema(service: Service) {
  const url = absoluteUrl(`/uslugi/${service.slug}`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: service.title,
    serviceType: service.title,
    description: `${service.description} Fikcyjna oferta demonstracyjna — projekt portfolio.`,
    url,
    provider: {
      '@type': 'Plumber',
      '@id': absoluteUrl('/#business'),
      name: site.name,
    },
    areaServed,
    hoursAvailable: service.slug === 'awarie-hydrauliczne' ? emergencyHours : regularHours,
    offers: service.pricing.map((price) => ({
      '@type': 'Offer',
      name: `${price.label} — cena demo`,
      description: `${price.note} Przykładowy zakres cen, nie stanowi rzeczywistej oferty.`,
      url,
      priceSpecification: {
        '@type': 'PriceSpecification',
        minPrice: price.from,
        maxPrice: price.to,
        priceCurrency: 'PLN',
      },
    })),
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbSchema(items: readonly BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Keep the supplied questions and answers identical to visible page content. */
export function faqSchema(faq: readonly FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'pl-PL',
    mainEntity: faq.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}
