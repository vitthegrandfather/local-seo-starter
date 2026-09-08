import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CallLink } from '@/components/call-link';
import { Icon } from '@/components/icon';
import { JsonLd } from '@/components/json-ld';
import { PlumbingIllustration } from '@/components/plumbing-illustration';
import { Breadcrumbs, ContactCta, Faq, ServiceCards } from '@/components/sections';
import { pageLabels } from '@/content/pages';
import { services } from '@/content/services';
import { site } from '@/content/site';
import { ui } from '@/content/ui';
import { breadcrumbSchema, faqSchema, makeMetadata, serviceSchema } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

// Known services are prerendered. Unknown slugs reach our explicit notFound()
// instead of Next's low-level NoFallbackError path.
export const dynamicParams = true;

export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();
  return makeMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/uslugi/${service.slug}`,
  });
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();
  const breadcrumbs = [
    { name: pageLabels.home, path: '/' },
    { name: service.shortTitle, path: `/uslugi/${service.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={[serviceSchema(service), breadcrumbSchema(breadcrumbs), faqSchema(service.faq)]}
      />
      <section className="page-intro">
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <div className="service-intro-grid">
            <div>
              <p className="eyebrow">
                {site.address.addressLocality} · {ui.service.demo}
              </p>
              <h1>{service.title}</h1>
              <p className="intro-text">{service.heroText}</p>
              <div className="hero-actions">
                <CallLink className="button button-primary" location="service">
                  <Icon name="phone" />
                  {site.phone}
                </CallLink>
                <Link className="button button-outline" href="/kontakt">
                  {ui.write}
                  <Icon name="arrow" />
                </Link>
              </div>
              <p className="demo-note">{ui.hero.demo}</p>
            </div>
            <div className="service-illustration">
              <PlumbingIllustration image={service.image} variant="intro" />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container detail-layout">
          <div>
            <h2>{ui.service.audience}</h2>
            <p className="intro-text">{service.audience}</p>
            <Link className="text-link" href="/obszar">
              {pageLabels.serviceArea}
              <Icon name="arrow" />
            </Link>
          </div>
          <div>
            <h2>{ui.service.included}</h2>
            <ul className="check-list">
              {service.included.map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section process-section">
        <div className="container">
          <div className="section-heading">
            <h2>{ui.service.process}</h2>
          </div>
          <ol className="process-list">
            {service.process.map((step, index) => (
              <li key={step.title}>
                <span className="step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{ui.service.demo}</p>
              <h2>{ui.service.pricing}</h2>
            </div>
          </div>
          <table className="pricing-table">
            <caption className="sr-only">
              {service.shortTitle} — {pageLabels.grossPrice}
            </caption>
            <thead>
              <tr>
                <th scope="col">{pageLabels.service}</th>
                <th scope="col">{ui.service.priceRange}</th>
              </tr>
            </thead>
            <tbody>
              {service.pricing.map((price) => (
                <tr key={price.label}>
                  <th scope="row">
                    {price.label}
                    <small className="price-note">{price.note}</small>
                  </th>
                  <td>
                    <strong>
                      {price.from}–{price.to} zł
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="price-note">{ui.pricingNote}</p>
        </div>
      </section>

      <Faq items={service.faq} title={ui.service.faq} />
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <h2>{ui.service.related}</h2>
          </div>
          <ServiceCards exclude={service.slug} />
        </div>
      </section>
      <ContactCta />
    </>
  );
}
