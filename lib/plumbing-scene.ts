import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createPlumbingModel } from './plumbing-model';
import { createPlumbingWater } from './plumbing-water';

export type PlumbingScene = {
  setOpening: (opening: number) => void;
  setPaused: (paused: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
};

/** Fixed geometry is rendered once; subsequent frames draw only the lever and water. */
export function createPlumbingScene(
  canvas: HTMLCanvasElement,
  onContextLost: () => void,
): PlumbingScene {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  // A small hero does not need a full-resolution high-DPI drawing buffer.
  const pixelRatio = Math.min(window.devicePixelRatio, 1.25);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0xf7f9fb, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const fixed = new THREE.Scene();
  const moving = new THREE.Scene();
  const framing = 2.95;
  const camera = new THREE.OrthographicCamera(-framing, framing, framing, -framing, 0.1, 30);
  camera.position.set(4.2, 2.7, 6.2);
  camera.lookAt(0, -0.8, 0);

  const room = new RoomEnvironment();
  // Broad page-coloured panels give the metal and water a coherent studio reflection.
  const panels: THREE.Mesh[] = [];
  for (const [colour, width, height, x, y, z] of [
    ['#f5f8fa', 8, 5, -4, 2, 3],
    ['#193750', 6, 1.4, -3, 0, 4],
    ['#f3c651', 1.8, 0.3, -2, -0.4, 4],
  ] as const) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: colour, side: THREE.DoubleSide }),
    );
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    room.add(panel);
    panels.push(panel);
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, 0.035);
  fixed.environment = moving.environment = environment.texture;
  fixed.environmentIntensity = moving.environmentIntensity = 0.8;
  panels.forEach((panel) => room.remove(panel));
  panels.forEach((panel) => {
    panel.geometry.dispose();
    (panel.material as THREE.Material).dispose();
  });
  room.dispose();
  pmrem.dispose();

  const hemisphere = new THREE.HemisphereLight(0xeaf5ff, 0xa6b5c2, 1.1);
  const key = new THREE.DirectionalLight(0xfff4dc, 2.3);
  key.position.set(-2, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -3;
  key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.normalBias = 0.018;
  key.shadow.bias = -0.0001;
  key.shadow.radius = 4;
  key.shadow.blurSamples = 8;
  const rim = new THREE.DirectionalLight(0xd5e7ff, 1.6);
  rim.position.set(3, 2.5, -4);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6);
  fill.position.set(-4, 0, -1);
  for (const light of [hemisphere, key, rim, fill]) {
    fixed.add(light);
    const copy = light.clone();
    copy.castShadow = false;
    moving.add(copy);
  }

  const model = createPlumbingModel();
  model.group.remove(model.handle);
  fixed.add(model.group);
  moving.add(model.handle);
  const water = createPlumbingWater();
  fixed.add(water.staticGroup);
  moving.add(water.group);

  const shadow = new THREE.ShadowMaterial({ color: 0x496780, opacity: 0.12 });
  shadow.onBeforeCompile = (shader) => {
    shader.vertexShader =
      'varying vec2 shadowPosition;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nshadowPosition = position.xy;',
      );
    shader.fragmentShader =
      'varying vec2 shadowPosition;\n' +
      shader.fragmentShader.replace(
        '#include <premultiplied_alpha_fragment>',
        'gl_FragColor.a *= 1.0 - smoothstep(0.5, 2.15, length(shadowPosition));\n#include <premultiplied_alpha_fragment>',
      );
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), shadow);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.187;
  floor.receiveShadow = true;
  fixed.add(floor);

  const cache = new THREE.WebGLRenderTarget(1, 1, {
    type: renderer.extensions.has('EXT_color_buffer_float')
      ? THREE.HalfFloatType
      : THREE.UnsignedByteType,
    samples: 2,
    depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
  });
  const compositeMaterial = new THREE.ShaderMaterial({
    uniforms: { image: { value: cache.texture }, depth: { value: cache.depthTexture } },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform sampler2D image;
      uniform sampler2D depth;
      varying vec2 vUv;
      void main() {
        vec4 cached = texture2D(image, vUv);
        gl_FragColor = vec4(cached.rgb / max(cached.a, 0.0001), cached.a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        gl_FragColor.rgb *= cached.a;
        gl_FragDepth = texture2D(depth, vUv).x;
      }`,
    depthTest: true,
    depthWrite: true,
    depthFunc: THREE.AlwaysDepth,
    blending: THREE.NoBlending,
  });
  const composite = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial);
  composite.frustumCulled = false;
  composite.renderOrder = -1000;
  moving.add(composite);

  let disposed = false;
  let unavailable = false;
  let paused = false;
  let reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let opening = 0;
  let targetOpening = 0;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let cacheDirty = true;
  model.handle.rotation.y = Math.PI / 2;

  function draw(time: number) {
    frame = 0;
    if (disposed || paused || unavailable) return;
    const dt = Math.min(previous ? (time - previous) / 1000 : 1 / 60, 0.05);
    previous = time;
    elapsed += dt;
    const delta = targetOpening - opening;
    opening =
      reduced || Math.abs(delta) < 0.0005
        ? targetOpening
        : opening + delta * (1 - Math.exp(-dt * 24));
    model.handle.rotation.y = ((1 - opening) * Math.PI) / 2;
    const fluidActive = water.update(elapsed, opening, reduced);
    if (cacheDirty) {
      renderer.setRenderTarget(cache);
      renderer.shadowMap.needsUpdate = true;
      renderer.render(fixed, camera);
      renderer.setRenderTarget(null);
      cacheDirty = false;
    }
    renderer.render(moving, camera);
    if (!reduced && (fluidActive || opening !== targetOpening)) {
      frame = requestAnimationFrame(draw);
    }
  }
  function requestDraw() {
    if (!frame && !disposed && !paused && !unavailable) {
      previous = 0;
      frame = requestAnimationFrame(draw);
    }
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    camera.left = -framing * aspect;
    camera.right = framing * aspect;
    camera.updateProjectionMatrix();
    // Cap rendering work even in a very wide layout; CSS retains intrinsic size.
    const resolution = Math.min(pixelRatio, 1000 / Math.max(width, height));
    renderer.setPixelRatio(resolution);
    renderer.setSize(width, height, false);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    cache.setSize(size.x, size.y);
    water.setReflectionSource(cache.texture, size.x, size.y);
    cacheDirty = true;
    requestDraw();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  function lost(event: Event) {
    event.preventDefault();
    unavailable = paused = true;
    cancelAnimationFrame(frame);
    frame = 0;
    onContextLost();
  }
  canvas.addEventListener('webglcontextlost', lost);
  resize();
  cancelAnimationFrame(frame);
  frame = 0;
  draw(performance.now());
  return {
    setOpening(value) {
      targetOpening = Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 1) : 0;
      requestDraw();
    },
    setPaused(value) {
      paused = value || unavailable;
      if (paused) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestDraw();
    },
    setReducedMotion(value) {
      reduced = value;
      requestDraw();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('webglcontextlost', lost);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      for (const scene of [fixed, moving])
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            if (object instanceof THREE.InstancedMesh) object.dispose();
            geometries.add(object.geometry);
            (Array.isArray(object.material) ? object.material : [object.material]).forEach((m) =>
              materials.add(m),
            );
          }
        });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      key.shadow.map?.dispose();
      cache.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
