# Kraków district map — sources and reproducibility

The map draws actual municipal district polygons. It is not an AI-generated city shape. AquaFix Pro's service coverage is fictional; the administrative geometry is sourced separately from the city.

## Sources

- Data owner: **Gmina Miejska Kraków**, municipal GIS / MSIP Obserwatorium.
- [Official catalog: Podział administracyjny — dzielnice](https://msip.krakow.pl/dataset/1483). The catalog identifies EPSG:2178 and the municipal Department of Geodesy as the data owner.
- [Downloaded municipal ArcGIS item: Dzielnice Miasta Krakowa](https://www.arcgis.com/home/item.html?id=e4de069bb2574615bc795705d8777edc). Its description identifies ISDP as the origin.
- [Municipal ArcGIS organization](https://www.arcgis.com/sharing/rest/portals/svTzSt3AvH7sK6q9?f=pjson): `Zintegrowana Platforma GIS - Gmina Miejska Kraków`.
- [Actual downloaded layer](https://services-eu1.arcgis.com/svTzSt3AvH7sK6q9/arcgis/rest/services/Dzielnice_Krakowa/FeatureServer/10): `F07_DZIELN_2014_polyg`, 18 features, EPSG:2178.
- [MSIP terms](https://msip.krakow.pl/getHtml?dok_id=228972), consulted 2026-09-08. Attribution is retained beside the image, within SVG metadata and in this document. This project distributes an attributed static visual, not a live mirror or resale of a municipal WMS/WFS/REST service. The map is illustrative, not a legal or surveying document. No municipal logo is used.

The catalog's direct ZIP host and current `msip3.um.krakow.pl` endpoint timed out in the build environment. The alternative source is a publicly accessible layer inside the city's own ArcGIS organization, not an unattributed third-party polygon collection.

## Dates and limitations

- Retrieval date: **2026-09-08**.
- Every feature's `DATA_AKTUA` attribute: **2014-03-31**.
- Layer edit date: **2023-08-09**. Item metadata update: **2024-07-24**.
- These are distinct dates. Downloading in 2026 does **not** establish that the boundary geometry reflects every subsequent administrative change. The visible caption identifies the geometry's date. Recheck the current municipal layer before using this map for a real company's coverage or any administrative purpose.
- No road, river, invented district edge, office marker, travel-time promise or coverage radius has been added. The city's external silhouette is formed by the real district polygons.
- The north arrow indicates grid north in the source projected coordinate system. The scale bar uses its metre units. This is a neighborhood overview, not a navigation map.

## Files

- `content/geodata/krakow-districts.esri.json`: complete downloaded Esri JSON response, with original coordinates and source attributes.
- `content/geodata/source.json`: retrieval and provenance metadata.
- `content/geodata/map-meta.json`: generated feature/vertex counts, bounds, source hash and SVG size.
- `scripts/build-map.mjs`: dependency-free Node generator.
- `public/maps/krakow-districts.svg`: generated static asset.
- `components/area-map.tsx`: responsive server component with accessible alternative text and visible attribution.

## Build and verify

```bash
node scripts/build-map.mjs
```

The script rejects a truncated response, an unexpected CRS, missing districts and invalid coordinates. It preserves **all 23,288 source vertices** and transforms EPSG:2178 eastings/northings using one uniform scale, a translation and a vertical-axis flip for SVG. It does not simplify, rotate, stretch or redraw district polygons. SVG coordinates are rounded to 0.001 display units, below one tenth of a metre at this scale. Labels are calculated inside their own polygons and do not affect geometry. The committed source SHA-256 is recorded in the generated manifest and SVG metadata.

The application serves the SVG from its own public directory. No browser connection to ArcGIS, MSIP, map tiles, a geocoder or an API-key service is needed. The image is loaded lazily, has intrinsic dimensions, and uses no client JavaScript.

## Updating the snapshot

1. Confirm the current municipal dataset and reuse terms.
2. Fetch all features with `where=1%3D1&outFields=*&outSR=2178&returnGeometry=true&f=json` from the verified layer's `/query` route.
3. Replace the source JSON, update `source.json`, and run the generator.
4. Review the source geometry dates; update the visible caption, alt text and this document when the snapshot changes.
5. Inspect the generated SVG against the source, including all 18 district labels, and rerun the app's checks.

Do not manually reshape SVG paths to fit the layout. Resize the containing element; SVG's aspect ratio preserves the map's proportions.
