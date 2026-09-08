import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    // Allow crawling even with noindex, so crawlers can read the robots meta tag.
    rules: { userAgent: '*', allow: '/', disallow: '/api/' },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
