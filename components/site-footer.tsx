import Link from 'next/link';
import { Brand } from './site-header';
import { site } from '@/content/site';
import { services } from '@/content/services';
import { ui } from '@/content/ui';
import { CallLink } from './call-link';
import { Icon } from './icon';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Brand />
            <p className="preserve-lines">{ui.footerText}</p>
            <span className="footer-demo">DEMO / LOCALSEO STARTER</span>
          </div>
          <div>
            <h2>Usługi</h2>
            <ul>
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/uslugi/${s.slug}`}>{s.shortTitle}</Link>
                </li>
              ))}
            </ul>
            <Link href="/obszar">Obszar działania</Link>
          </div>
          <div>
            <h2>Kontakt demonstracyjny</h2>
            <CallLink location="footer">{site.phone}</CallLink>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <p>
              {site.address.streetAddress}
              <br />
              {site.address.postalCode} {site.address.addressLocality}
            </p>
          </div>
          <div>
            <h2>Przykładowe godziny</h2>
            <p>
              Pon.–pt. 8:00–20:00
              <br />
              Sob. 9:00–14:00
            </p>
            <p>Dyżur awaryjny: 24/7</p>
            <Link href="/kontakt">
              Formularz kontaktowy <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div>
            <strong lang="en">{site.demoDisclaimer}</strong>
            <p>{ui.demoPolish}</p>
          </div>
          <Link href="/polityka-prywatnosci">Polityka prywatności</Link>
        </div>
      </div>
      <div className="mobile-call">
        <CallLink className="button button-primary" location="mobile">
          <Icon name="phone" />
          Zadzwoń: {site.phone}
        </CallLink>
        <span>Numer fikcyjny · projekt demo</span>
      </div>
    </footer>
  );
}
