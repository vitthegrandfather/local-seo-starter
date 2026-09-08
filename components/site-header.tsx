import Link from 'next/link';
import { Icon } from './icon';
import { CallLink } from './call-link';
import { site } from '@/content/site';
import { ui } from '@/content/ui';

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="AquaFix Pro — strona główna">
      <Icon name="drop" />
      <span>
        AquaFix <span className="brand-pro">Pro</span>
      </span>
    </Link>
  );
}
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav aria-label="Nawigacja główna">
          <Link href="/#uslugi">{ui.nav.services}</Link>
          <Link href="/obszar">{ui.nav.area}</Link>
          <Link href="/kontakt">{ui.nav.contact}</Link>
        </nav>
        <CallLink className="button button-dark header-call" location="header">
          <Icon name="phone" />
          <span>{site.phone}</span>
        </CallLink>
      </div>
    </header>
  );
}
