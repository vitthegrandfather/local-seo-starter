import Image from 'next/image';
import map from '@/content/geodata/map-meta.json';

export function AreaMap({ large = false }: { large?: boolean }) {
  return (
    <figure className={large ? 'area-map area-map-large' : 'area-map'}>
      <Image
        src="/maps/krakow-districts.svg"
        alt="Mapa Krakowa z rzeczywistymi obrysami 18 dzielnic administracyjnych, oznaczonych numerami I–XVIII. Północ u góry; podział według miejskiego zbioru GIS z 31 marca 2014 r."
        width={map.svgWidth}
        height={map.svgHeight}
        sizes={large ? '(max-width: 768px) 100vw, 900px' : '(max-width: 768px) 100vw, 560px'}
        style={{ display: 'block', width: '100%', height: 'auto' }}
        unoptimized
      />
      <figcaption style={{ color: '#d4e4ef', fontSize: '0.75rem', lineHeight: 1.6 }}>
        Źródło granic:{' '}
        <a
          href="https://msip.krakow.pl/dataset/1483"
          style={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}
        >
          Gmina Miejska Kraków, Portal MSIP Obserwatorium
        </a>
        . Dane: 31.03.2014; pobrano 08.09.2026. Fikcyjny zasięg usług demo.
      </figcaption>
    </figure>
  );
}
