# Asset sources

## Original plumbing illustrations

The service artwork was developed for this fictional portfolio project. The built-in imagegen tool produced the initial visual concepts; the final assets were manually authored as SVG paths and shapes in the site's navy, blue-grey, and yellow palette. They are stylized illustrations, not photographs of real equipment installations, staff, customers, or completed work. The final SVG files contain no embedded raster images, photographic textures, or third-party brand marks.

| Final asset                               | Use and generation brief summary                                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/images/plumbing-valve.svg`        | Emergency service: a blue pipe with a yellow valve, water drop, and plumber's wrench; clean isolated trade illustration with a simple pale backdrop. |
| `public/images/plumbing-installation.svg` | Installation service: a basin faucet with a yellow lever and screwdriver; a compact composition in the same visual style.                            |
| `public/images/plumbing-drain.svg`        | Drain service: a U-shaped drain and manual drain-cleaning reel; readable silhouettes and the shared blue-and-yellow palette.                         |

These are summaries of the concept briefs. The shipped assets are the SVG files listed above. `content/visuals.ts` contains their public paths and Polish alternative text; `components/plumbing-illustration.tsx` renders them in service cards and page introductions. They do not need an image generation service or an external asset host at runtime.

## Original interactive 3D hero

The hero uses actual 3D geometry procedurally authored for this project in `lib/plumbing-model.ts`. It includes the pipe assembly and movable valve handle, a navy vanity cabinet with support, a rounded stone countertop, flooring, and a tiled backsplash. `lib/plumbing-scene.ts` renders the model with Three.js **0.185.1**, PBR materials, a RoomEnvironment enriched with panels in the page's colours, key/fill/rim lights, blurred VSM shadows, and an orthographic camera. The cabinet, countertop, plumbing body, backdrop, and camera remain fixed; cursor movement does not rotate the assembly. There is no imported Blender model, `.blend` source project, or claim of a Blender production workflow.

The fixed assembly and its VSM shadows are cached in a HalfFloat render target with a depth texture. After the initial render and any resize, active frames composite the cached colour and depth, then render the moving lever and batched water without recomputing the static shadow map. The cache also supplies the water's image sampling source, avoiding a full-scene transmission render on every frame. The shared environment and cached source keep the materials visually consistent with the page. This describes the rendering design, not a guaranteed frame rate on every device.

`lib/plumbing-fluid.ts` separates outlet emission, water in flight, and stored basin water; `lib/plumbing-water.ts` renders that state. Transport follows `s = v0 × t + 0.5 × g × t²`, using `v0 = 1.1` and `g = 9.81` under the model's metre convention. A history of emission is sampled with a different ballistic delay at each height. Closing the valve therefore cuts the stream at the nozzle while the emitted tail continues to accelerate downward. Its radius narrows as speed increases, using a continuity relation between opening, cross-sectional area, and velocity.

The basin is a rounded white glazed ceramic vessel with a metal drain. Its interior profile defines a nonlinear volume-to-height relationship; delayed arriving water feeds a normalized mass balance, and head-dependent drainage continues while the valve is open and after it closes. Surface waves decay after impact, and one small authored residual nozzle drip can detach after closure. The model remains a limited physical approximation for an interface, not a full fluid solver, calibrated equipment analysis, or Blender fluid simulation.

The moving water is batched into three draw objects: a deforming stream, a basin surface, and instanced impact splashes that also include the final residual drip. GPU deformation and cached-background sampling provide shape, highlights, and approximate refraction without a full-scene transmission pass. The material does not claim ray-traced refraction. `npm run test:water` invokes `scripts/test-water.mjs` to check flight timing, continuity, volume conservation, the curved bowl profile, and settling separately from browser rendering.

`components/interactive-plumbing.tsx` makes the illustration focusable with `role="slider"`, the accessible name “Otwarcie zaworu,” and an ARIA opening value from 0 to 100. Direct horizontal drag continuously adjusts the lever within its quarter-turn range. Right/Up arrows add 5 percentage points, Left/Down subtract 5, Home closes, and End fully opens. Click, tap, Enter, and Space do not toggle the valve. There is no separate visible range, numeric field, or button pill; the single visible hint reads “Przeciągnij uchwyt w prawo lub w lewo.” Focus styling, ARIA values, and a visually hidden live status keep the interaction accessible. `content/interactive-art.ts` owns the Polish copy.

The renderer is loaded by dynamic import on pointer entry, focus, or activation. Once lever movement and the remaining fluid activity have settled, the animation frame loop stops. Active motion pauses offscreen or in a hidden document, and reduced-motion preferences show the selected state statically.

### Rendered posters and fallback

| Final asset                             | Origin and role                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `public/images/plumbing-3d-closed.webp` | 900×900 capture of the actual authored Three.js model with the valve closed; the initial hero image and closed-state fallback. |
| `public/images/plumbing-3d-open.webp`   | 900×900 capture of the same model with the valve open and water visible; the open-state fallback.                              |

Both WebP posters are real render captures of this project's geometry, not AI-generated pictures or photographs of client work. When WebGL is unavailable or its context is lost, the closed poster represents 0% and the open poster represents any nonzero opening; intermediate angles do not have individual posters. Direct drag, keyboard adjustment, ARIA values, and the accessible status continue to work on the illustration. The service SVGs retain their separate AI-concept/manual-vector provenance described above.

To regenerate posters after changing the model, start the local production app on `http://localhost:3000`, then run these commands in another terminal:

```bash
npx playwright install chromium
npm run art:render
```

The command invokes `scripts/render-plumbing-posters.mjs`, captures the scene states, and writes the two WebP assets. Stop the production server after capture, run `npm run build` again to include the updated posters, and restart it for review. The browser scene and generated posters share the authored model; no image-generation service is needed for this rendering step.

### Three.js license notice

The following notice is reproduced from the installed `node_modules/three/LICENSE` for Three.js 0.185.1 and its included addons, including RoomEnvironment and RoundedBoxGeometry.

```text
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Interface icons

- Library: [Lucide](https://lucide.dev/), `lucide-react` **1.42.0** (locked in `package-lock.json`).
- Integration: `components/icon.tsx` imports only the 11 named icons used by the shared wrapper. Icons use a 24 × 24 viewBox, round stroke joins and a consistent 1.75 stroke width.
- License: ISC; the bundled license also includes the MIT notice for icons derived from Feather. Both notices are reproduced below from the installed package's `LICENSE`.
- Accessibility: icons accompany visible text or an accessible control name and are hidden from assistive technology. They cannot receive keyboard focus.
- Source documentation: [Lucide React](https://lucide.dev/guide/react) and [Lucide license](https://lucide.dev/license), checked 2026-09-08.

## Map

The district map uses municipal geographic data. Its independent provenance and date are documented in [MAP_SOURCES.md](MAP_SOURCES.md).

## Lucide license notice

```text
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```
