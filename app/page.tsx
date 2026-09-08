import Link from 'next/link';
import { home, site } from '@/content/site';
import { ui } from '@/content/ui';
import { CallLink } from '@/components/call-link';
import { Icon } from '@/components/icon';
import { InteractivePlumbing } from '@/components/interactive-plumbing';
import { AreaMap } from '@/components/area-map';
import { ContactCta, Faq, ServiceCards } from '@/components/sections';
import { JsonLd } from '@/components/json-ld';
import { makeMetadata, businessSchema, faqSchema } from '@/lib/seo';
export const metadata = makeMetadata({
  title: home.title,
  description: home.description,
  path: '/',
});
export default function HomePage() {
  return (
    <>
      <JsonLd data={[businessSchema(), faqSchema(home.faqs)]} />
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1 className="preserve-lines">{ui.hero.title}</h1>
            <p>{ui.hero.text}</p>
            <div className="hero-actions">
              <CallLink className="button button-primary" location="hero">
                <Icon name="phone" />
                {ui.call}: {site.phone}
              </CallLink>
              <Link className="button button-outline" href="/kontakt">
                {ui.write}
                <Icon name="arrow" />
              </Link>
            </div>
            <p className="demo-note">{ui.hero.demo}</p>
          </div>
          <InteractivePlumbing />
        </div>
      </section>
      <div className="trust-strip">
        <div className="container trust-grid">
          {ui.trust.map((t) => (
            <div className="trust-item" key={t.title}>
              <Icon name={t.icon} />
              <div>
                <strong>{t.title}</strong>
                <span>{t.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <section className="section" id="uslugi">
        <div className="container">
          <div className="section-heading">
            <h2>{ui.servicesTitle}</h2>
            <p>{ui.servicesText}</p>
          </div>
          <ServiceCards />
          <p className="price-note">{ui.pricingNote}</p>
        </div>
      </section>
      <section className="why-section">
        <div className="container why-layout">
          <div>
            <h2 className="preserve-lines">{ui.whyTitle}</h2>
            <p className="muted">{ui.whyText}</p>
          </div>
          <ul className="why-list">
            {home.whyItems.map((item, i) => (
              <li key={item.title}>
                <span className="why-icon">
                  <Icon name={['document', 'clock', 'check'][i % 3]} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="area-section">
        <div className="container area-layout">
          <div>
            <h2>{ui.areaTitle}</h2>
            <p>{ui.areaText}</p>
            <Link href="/obszar" className="text-link">
              {ui.areaLink}
              <Icon name="arrow" />
            </Link>
          </div>
          <AreaMap />
        </div>
      </section>
      <Faq items={home.faqs} />
      <ContactCta />
    </>
  );
}
