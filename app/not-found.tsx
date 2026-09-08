import type { Metadata } from 'next';
import Link from 'next/link';
import { Icon } from '@/components/icon';
import { pageLabels } from '@/content/pages';
import { site } from '@/content/site';
import { ui } from '@/content/ui';

export const metadata: Metadata = {
  title: `${pageLabels.notFoundMeta} | ${site.name}`,
  description: ui.notFound.text,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="container not-found">
      <p className="not-found-code" aria-hidden="true">
        404
      </p>
      <h1>{ui.notFound.title}</h1>
      <p className="intro-text">{ui.notFound.text}</p>
      <div className="hero-actions">
        <Link className="button button-primary" href="/">
          {ui.notFound.home}
          <Icon name="arrow" />
        </Link>
        <Link className="button button-outline" href="/kontakt">
          {ui.notFound.contact}
        </Link>
      </div>
    </section>
  );
}
