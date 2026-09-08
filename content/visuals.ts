/** Original SVG artwork developed from generated flat illustration concepts. */
export const plumbingImages = {
  emergency: {
    src: '/images/plumbing-valve.svg',
    alt: 'Niebieska rura z żółtym zaworem, kropla wody i klucz — ilustracja hydrauliki.',
  },
  installation: {
    src: '/images/plumbing-installation.svg',
    alt: 'Bateria umywalkowa z żółtą dźwignią i wkrętak — ilustracja montażu armatury.',
  },
  drain: {
    src: '/images/plumbing-drain.svg',
    alt: 'Niebieski syfon i ręczna spirala — ilustracja udrażniania odpływów.',
  },
};

export type PlumbingImage = (typeof plumbingImages)[keyof typeof plumbingImages];
