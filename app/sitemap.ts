import type { MetadataRoute } from 'next';
import { services } from '@/content/services';
import { absoluteUrl, isNoindex } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  // A deliberately noindex deployment has no indexable URLs to advertise.
  if (isNoindex) return [];

  return [
    { url: absoluteUrl('/'), priority: 1 },
    ...services.map((service) => ({
      url: absoluteUrl(`/uslugi/${service.slug}`),
      priority: 0.9,
    })),
    { url: absoluteUrl('/obszar'), priority: 0.7 },
    { url: absoluteUrl('/kontakt'), priority: 0.8 },
    { url: absoluteUrl('/polityka-prywatnosci'), priority: 0.3 },
  ];
}
