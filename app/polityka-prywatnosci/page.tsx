import { JsonLd } from '@/components/json-ld';
import { Breadcrumbs } from '@/components/sections';
import { pageLabels, privacyPage } from '@/content/pages';
import { breadcrumbSchema, makeMetadata } from '@/lib/seo';

export const metadata = makeMetadata({
  title: privacyPage.metaTitle,
  description: privacyPage.metaDescription,
  path: '/polityka-prywatnosci',
});
const breadcrumbs = [
  { name: pageLabels.home, path: '/' },
  { name: pageLabels.privacy, path: '/polityka-prywatnosci' },
];

export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />
      <section className="page-intro">
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <p className="eyebrow">{pageLabels.demo}</p>
          <h1>{privacyPage.title}</h1>
          <p className="intro-text">{privacyPage.intro}</p>
        </div>
      </section>
      <div className="container privacy-content">
        {privacyPage.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
