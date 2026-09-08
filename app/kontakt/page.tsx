import Link from 'next/link';
import { CallLink } from '@/components/call-link';
import { ContactForm } from '@/components/contact-form';
import { Icon } from '@/components/icon';
import { JsonLd } from '@/components/json-ld';
import { Breadcrumbs } from '@/components/sections';
import { contactPage, pageLabels } from '@/content/pages';
import { site } from '@/content/site';
import { breadcrumbSchema, businessSchema, makeMetadata } from '@/lib/seo';

export const metadata = makeMetadata({
  title: contactPage.metaTitle,
  description: contactPage.metaDescription,
  path: '/kontakt',
});
const breadcrumbs = [
  { name: pageLabels.home, path: '/' },
  { name: pageLabels.contact, path: '/kontakt' },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={[businessSchema(), breadcrumbSchema(breadcrumbs)]} />
      <section className="page-intro">
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <p className="eyebrow">{pageLabels.demo}</p>
          <h1>{contactPage.title}</h1>
          <p className="intro-text">{contactPage.intro}</p>
        </div>
      </section>
      <section className="section">
        <div className="container contact-layout">
          <div>
            <h2>{contactPage.formTitle}</h2>
            <p className="form-notice">{contactPage.demoNotice}</p>
            <ContactForm />
          </div>
          <aside className="contact-aside" aria-labelledby="contact-details-title">
            <h2 id="contact-details-title">{contactPage.detailsTitle}</h2>
            <div className="contact-detail">
              <Icon name="phone" />
              <div>
                <h3>{pageLabels.phone}</h3>
                <CallLink location="contact">{site.phone}</CallLink>
              </div>
            </div>
            <div className="contact-detail">
              <Icon name="mail" />
              <div>
                <h3>{pageLabels.email}</h3>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </div>
            </div>
            <div className="contact-detail">
              <Icon name="pin" />
              <div>
                <h3>{pageLabels.address}</h3>
                <address>
                  {site.name}
                  <br />
                  {site.address.streetAddress}
                  <br />
                  {site.address.postalCode} {site.address.addressLocality}
                </address>
              </div>
            </div>
            <div className="contact-detail">
              <Icon name="clock" />
              <div>
                <h3>{pageLabels.hours}</h3>
                <p>
                  {site.hours.weekdays}
                  <br />
                  {site.hours.saturday}
                  <br />
                  <strong>{site.hours.emergency}</strong>
                </p>
              </div>
            </div>
            <p className="demo-note">{contactPage.arrivalNote}</p>
            <Link className="text-link" href="/obszar">
              {pageLabels.serviceArea}
              <Icon name="arrow" />
            </Link>
          </aside>
        </div>
      </section>
    </>
  );
}
