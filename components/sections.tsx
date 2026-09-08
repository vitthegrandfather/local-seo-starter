import Link from 'next/link';
import { Icon } from './icon';
import { CallLink } from './call-link';
import { services } from '@/content/services';
import { site, type FAQ } from '@/content/site';
import { ui } from '@/content/ui';
import { PlumbingIllustration } from './plumbing-illustration';

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="Ścieżka nawigacji">
      <ol>
        {items.map((item, i) => (
          <li key={item.path}>
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === items.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.path}>{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function ServiceCards({ exclude }: { exclude?: string }) {
  return (
    <div className={`service-grid ${exclude ? 'service-grid-two' : ''}`}>
      {services
        .filter((s) => s.slug !== exclude)
        .map((s, i) => (
          <Link className="service-card" href={`/uslugi/${s.slug}`} key={s.slug}>
            <div className="service-card-image">
              <PlumbingIllustration image={s.image} variant={exclude ? 'related' : 'card'} />
            </div>
            <span className="service-number" aria-hidden="true">
              0{services.indexOf(s) + 1}
            </span>
            <h3>{s.shortTitle}</h3>
            <p>{s.description}</p>
            <div className="service-card-bottom">
              <span>
                od <strong>{s.pricing[0].from} zł</strong>
                <small>cena demo</small>
              </span>
              <span className="circle-arrow">
                <Icon name="arrow" />
              </span>
            </div>
            <span className="sr-only">
              {ui.viewService} {i + 1}
            </span>
          </Link>
        ))}
    </div>
  );
}
export function Faq({
  items,
  title = ui.faqTitle,
  text = ui.faqText,
}: {
  items: readonly FAQ[];
  title?: string;
  text?: string;
}) {
  return (
    <section className="section">
      <div className="container faq-layout">
        <div>
          <h2>{title}</h2>
          <p className="muted">{text}</p>
          <Link className="text-link" href="/kontakt">
            Masz inne pytanie? Napisz <Icon name="arrow" />
          </Link>
        </div>
        <div className="faq-list">
          {items.map((f) => (
            <details key={f.question}>
              <summary>
                {f.question}
                <span className="faq-plus" aria-hidden="true">
                  +
                </span>
              </summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
export function ContactCta() {
  return (
    <section className="contact-cta">
      <div className="container cta-inner">
        <div>
          <h2 className="preserve-lines">{ui.ctaTitle}</h2>
          <p>{ui.ctaText}</p>
        </div>
        <div className="cta-actions">
          <CallLink className="button button-dark" location="cta">
            <Icon name="phone" />
            {site.phone}
          </CallLink>
          <Link className="text-link" href="/kontakt">
            Przejdź do formularza <Icon name="arrow" />
          </Link>
        </div>
      </div>
    </section>
  );
}
