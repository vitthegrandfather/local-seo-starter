import { AreaMap } from '@/components/area-map';
import { JsonLd } from '@/components/json-ld';
import { Breadcrumbs, ContactCta, Faq } from '@/components/sections';
import { areaPage, districtNumbers, pageLabels } from '@/content/pages';
import { site } from '@/content/site';
import { breadcrumbSchema, faqSchema, makeMetadata } from '@/lib/seo';

export const metadata = makeMetadata({
  title: areaPage.metaTitle,
  description: areaPage.metaDescription,
  path: '/obszar',
});
const breadcrumbs = [
  { name: pageLabels.home, path: '/' },
  { name: pageLabels.area, path: '/obszar' },
];

export default function AreaPage() {
  return (
    <>
      <JsonLd data={[breadcrumbSchema(breadcrumbs), faqSchema(areaPage.faq)]} />
      <section className="page-intro">
        <div className="container">
          <Breadcrumbs items={breadcrumbs} />
          <p className="eyebrow">{pageLabels.demo}</p>
          <h1>{areaPage.title}</h1>
          <p className="intro-text">{areaPage.intro}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <h2>{areaPage.coverageTitle}</h2>
              <p className="intro-text">{areaPage.coverageText}</p>
            </div>
          </div>
          <div className="area-full" style={{ backgroundColor: '#132d47' }}>
            <AreaMap large />
          </div>
          <h3>{pageLabels.districts}</h3>
          <ol className="district-grid">
            {site.districts.map((district, index) => (
              <li key={district}>
                <span aria-hidden="true">{districtNumbers[index]}</span>
                <span>{district}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section process-section">
        <div className="container">
          <div className="section-heading">
            <h2>{areaPage.dispatchTitle}</h2>
          </div>
          <ol className="process-list">
            {areaPage.dispatchSteps.map((step, index) => (
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
      <Faq items={areaPage.faq} />
      <ContactCta />
    </>
  );
}
