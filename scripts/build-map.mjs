import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// No runtime map API or dependencies: transform the committed municipal data into SVG.
const root = fileURLToPath(new URL('../', import.meta.url));
const dataFile = path.join(root, 'content/geodata/krakow-districts.esri.json');
const source = JSON.parse(await readFile(path.join(root, 'content/geodata/source.json'), 'utf8'));
const raw = await readFile(dataFile, 'utf8');
const data = JSON.parse(raw);
const districts = data.features;
const expected = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
];

if (data.spatialReference.wkid !== 2178 || data.geometryType !== 'esriGeometryPolygon') {
  throw new Error('Expected original municipal polygon data in EPSG:2178.');
}
if (
  data.exceededTransferLimit ||
  districts.length !== 18 ||
  new Set(districts.map((d) => d.attributes.NR_DZIELNI)).size !== 18
) {
  throw new Error('Expected all 18 unique districts, without a truncated server response.');
}
for (const id of expected) {
  if (!districts.some((d) => d.attributes.NR_DZIELNI === id))
    throw new Error(`Missing district ${id}`);
}
districts.sort(
  (a, b) => expected.indexOf(a.attributes.NR_DZIELNI) - expected.indexOf(b.attributes.NR_DZIELNI),
);

const points = districts.flatMap((d) => d.geometry.rings.flat());
if (!points.every((p) => p.length >= 2 && p.every(Number.isFinite)))
  throw new Error('Invalid coordinate.');
const minX = Math.min(...points.map((p) => p[0]));
const minY = Math.min(...points.map((p) => p[1]));
const maxX = Math.max(...points.map((p) => p[0]));
const maxY = Math.max(...points.map((p) => p[1]));
const width = 900;
const height = 620;
const padding = 36;
const scale = Math.min(
  (width - padding * 2) / (maxX - minX),
  (height - padding * 2) / (maxY - minY),
);
const offsetX = (width - (maxX - minX) * scale) / 2;
const offsetY = (height - (maxY - minY) * scale) / 2;
const project = ([x, y]) => [offsetX + (x - minX) * scale, offsetY + (maxY - y) * scale];
const fmt = (n) => Number(n.toFixed(3)).toString();
const escapeXml = (value) =>
  String(value).replace(
    /[<>&"']/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
  );

function squaredSegmentDistance([x, y], a, b) {
  let dx = b[0] - a[0];
  let dy = b[1] - a[1];
  const t =
    dx === 0 && dy === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
  dx = x - (a[0] + t * dx);
  dy = y - (a[1] + t * dy);
  return dx * dx + dy * dy;
}

function interiorDistance(point, rings) {
  let inside = false;
  let min = Infinity;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (
        a[1] > point[1] !== b[1] > point[1] &&
        point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
      )
        inside = !inside;
      min = Math.min(min, squaredSegmentDistance(point, a, b));
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(min);
}

// Repeated grid refinement finds a well-inside label anchor, never moving geometry.
function labelAnchor(rings) {
  const all = rings.flat();
  let left = Math.min(...all.map((p) => p[0]));
  let bottom = Math.min(...all.map((p) => p[1]));
  let spanX = Math.max(...all.map((p) => p[0])) - left;
  let spanY = Math.max(...all.map((p) => p[1])) - bottom;
  let best = { point: all[0], distance: -Infinity };
  for (let pass = 0; pass < 4; pass++) {
    const stepX = spanX / 18;
    const stepY = spanY / 18;
    for (let xi = 0; xi <= 18; xi++) {
      for (let yi = 0; yi <= 18; yi++) {
        const point = [left + xi * stepX, bottom + yi * stepY];
        const distance = interiorDistance(point, rings);
        if (distance > best.distance) best = { point, distance };
      }
    }
    left = best.point[0] - stepX;
    bottom = best.point[1] - stepY;
    spanX = 2 * stepX;
    spanY = 2 * stepY;
  }
  if (best.distance <= 0) throw new Error('Could not place a label inside its district.');
  return best.point;
}

const paths = districts
  .map((d) => {
    const id = d.attributes.NR_DZIELNI;
    // Every original vertex remains. Only a uniform scale, translation and SVG Y flip occur.
    const commands = d.geometry.rings
      .map(
        (ring) =>
          ring.map((p, index) => `${index ? 'L' : 'M'}${project(p).map(fmt).join(',')}`).join('') +
          'Z',
      )
      .join('');
    return `<path id="district-${id}" d="${commands}"><title>${escapeXml(d.attributes.NAZWA_PELN)}</title></path>`;
  })
  .join('\n');

const namedDistricts = new Set(['IV', 'VI', 'VII', 'VIII', 'X', 'XVIII']);
const labels = districts
  .map((d) => {
    const id = d.attributes.NR_DZIELNI;
    const [x, y] = project(labelAnchor(d.geometry.rings));
    const name = namedDistricts.has(id)
      ? `<text class="name" x="${fmt(x)}" y="${fmt(y + 23)}">${escapeXml(d.attributes.NAZWA)}</text>`
      : '';
    return `<g><text class="number" x="${fmt(x)}" y="${fmt(y)}">${id}</text>${name}</g>`;
  })
  .join('\n');

const boundaryDates = [
  ...new Set(districts.map((d) => new Date(d.attributes.DATA_AKTUA).toISOString().slice(0, 10))),
];
const sourceHash = createHash('sha256').update(raw).digest('hex');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="map-title map-description">
<title id="map-title">Kraków — granice 18 dzielnic administracyjnych</title>
<desc id="map-description">Obrysy z miejskiego zbioru GIS w układzie EPSG:2178. Północ u góry. I Stare Miasto, II Grzegórzki, III Prądnik Czerwony, IV Prądnik Biały, V Krowodrza, VI Bronowice, VII Zwierzyniec, VIII Dębniki, IX Łagiewniki-Borek Fałęcki, X Swoszowice, XI Podgórze Duchackie, XII Bieżanów-Prokocim, XIII Podgórze, XIV Czyżyny, XV Mistrzejowice, XVI Bieńczyce, XVII Wzgórza Krzesławickie, XVIII Nowa Huta. Data granic w źródle: ${boundaryDates.join(', ')}. Zasięg usług jest fikcyjnym założeniem demonstracyjnym.</desc>
<metadata>Gmina Miejska Kraków, Portal MSIP Obserwatorium (https://msip.krakow.pl). Source: ${escapeXml(source.sourceItem)}. Retrieved: ${source.retrievedAt}. SHA256: ${sourceHash}. All ${points.length} source vertices preserved. Uniform projected scale; no geographic simplification.</metadata>
<style>text{font-family:Arial,Helvetica,sans-serif;text-anchor:middle;fill:#eff6fa;paint-order:stroke;stroke:#132d47;stroke-width:3;stroke-linejoin:round}.number{font-size:21px;font-weight:700}.name{font-size:15px;fill:#d4e4ef;font-weight:400}</style>
<rect width="${width}" height="${height}" fill="#132d47"/>
<g fill="#244763" fill-rule="evenodd" stroke="#7193ad" stroke-width="1.15" stroke-linejoin="round">${paths}</g>
<g>${labels}</g>
<g transform="translate(838 51)" fill="none" stroke="#d4e4ef" stroke-width="1.5"><path d="M0 40V6M-6 14L0 5L6 14"/><text x="0" y="-7" style="font-size:14px;stroke:none;fill:#d4e4ef">N</text></g>
<g transform="translate(47 584)" stroke="#d4e4ef" stroke-width="2"><path d="M0 -5V0H${fmt(5000 * scale)}V-5" fill="none"/><text x="${fmt(2500 * scale)}" y="-12" style="font-size:14px;stroke:none;fill:#d4e4ef">5 km</text></g>
</svg>\n`;

await mkdir(path.join(root, 'public/maps'), { recursive: true });
await writeFile(path.join(root, 'public/maps/krakow-districts.svg'), svg);
const manifest = {
  ...source,
  sourceHash,
  boundaryDates,
  crs: 'EPSG:2178',
  featureCount: districts.length,
  vertexCount: points.length,
  sourceBounds: [minX, minY, maxX, maxY],
  svgWidth: width,
  svgHeight: height,
  svgBytes: Buffer.byteLength(svg),
  gzipBytes: gzipSync(svg).length,
  sourceMetersPerSvgUnit: 1 / scale,
};
await writeFile(
  path.join(root, 'content/geodata/map-meta.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(JSON.stringify(manifest, null, 2));
