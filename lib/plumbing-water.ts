import * as THREE from 'three';
import {
  createPlumbingFluid,
  FLUID_SAMPLE_COUNT,
  FLUID_FALL_DISTANCE,
  FLUID_INITIAL_SPEED,
  FLUID_GRAVITY,
  RESERVOIR_BASE_OFFSET,
  reservoirHeight,
  reservoirRadius,
} from './plumbing-fluid';

export type PlumbingWater = {
  /** Fixed bowl and strainer, for the caller's cached static render. */
  staticGroup: THREE.Group;
  /** Three dynamic draws: flow, surface, instanced splashes. */
  group: THREE.Group;
  update: (time: number, opening: number, reduced: boolean) => boolean;
  setReflectionSource: (texture: THREE.Texture, width: number, height: number) => void;
};

const outletY = 0.085;
const basinY = -1.31;
const fluidFragment = `
  uniform sampler2D reflectedScene;
  uniform vec2 viewport;
  uniform float hasReflection;
  uniform vec3 emptyBackground;
  uniform float surfaceY;
  uniform float opacity;
  uniform float kind;
  uniform float surfaceRadius;
  varying vec3 waterNormal;
  varying vec3 worldPosition;
  varying vec2 localPlane;
  varying float emission;
  void main() {
    if (kind < 0.5 && (emission < 0.006 || worldPosition.y < surfaceY)) discard;
    if (kind > 0.5 && length(localPlane) > surfaceRadius) discard;
    vec3 N = normalize(waterNormal);
    vec3 V = vec3(0.0, 0.0, 1.0);
    float facing = clamp(abs(dot(N, V)), 0.0, 1.0);
    float fresnel = 0.0204 + 0.9796 * pow(1.0 - facing, 5.0);
    vec3 R = reflect(-V, N);
    vec2 screenUv = gl_FragCoord.xy / viewport;
    vec2 offset = N.xy * (1.7 + (1.0 - facing) * 2.1) / viewport;
    vec4 background = texture2D(reflectedScene, clamp(screenUv + offset, vec2(0.002), vec2(0.998)));
    vec3 refracted = mix(emptyBackground, background.rgb, background.a * hasReflection);
    float whitePanel = pow(max(0.0, dot(R, normalize(vec3(-0.42, 0.58, 0.7)))), 13.0);
    float darkPanel = pow(max(0.0, dot(R, normalize(vec3(0.91, 0.18, 0.35)))), 5.0);
    float warmPanel = pow(max(0.0, dot(R, normalize(vec3(-0.75, 0.5, -0.1)))), 18.0);
    vec3 reflection = mix(vec3(0.65, 0.78, 0.86), vec3(0.025, 0.072, 0.11), darkPanel * 0.9);
    reflection += whitePanel * vec3(1.25, 1.28, 1.3);
    reflection += warmPanel * vec3(0.2, 0.12, 0.035);
    vec3 color = mix(refracted, reflection, 0.055 + fresnel * 0.64);
    color = mix(color, vec3(0.065, 0.16, 0.22), fresnel * 0.24);
    if (kind > 0.5) color = mix(color, vec3(0.3, 0.54, 0.64), 0.1);
    color += whitePanel * 0.07;
    // Empty cached pixels cannot refract the CSS behind the canvas. Let that
    // background show through instead of painting a tone-mapped gray column.
    float foregroundCoverage = clamp(background.a * hasReflection, 0.0, 1.0);
    float narrowGlint = kind < 0.5
      ? pow(max(0.0, 1.0 - abs(N.x + 0.34) / 0.1), 2.0)
      : 0.0;
    float narrowDarkEdge = kind < 0.5
      ? pow(max(0.0, 1.0 - abs(N.x - 0.58) / 0.30), 2.0)
      : 0.0;
    color = mix(color, vec3(0.035, 0.12, 0.18), narrowDarkEdge * 0.45);
    color = mix(color, vec3(2.2, 2.3, 2.4), narrowGlint * 0.8);
    float waterAlpha = opacity;
    if (kind < 0.5) {
      waterAlpha *= mix(0.24 + fresnel * 0.58, 1.0, foregroundCoverage);
      waterAlpha = max(waterAlpha, narrowGlint * 0.55);
    }
    gl_FragColor = vec4(color, waterAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const streamVertex = `
  uniform float time;
  uniform float history[${FLUID_SAMPLE_COUNT}];
  varying vec3 waterNormal;
  varying vec3 worldPosition;
  varying vec2 localPlane;
  varying float emission;
  float flux(float t) {
    float coordinate = clamp(t, 0.0, 1.0) * ${FLUID_SAMPLE_COUNT - 1}.0;
    int a = int(floor(coordinate));
    int b = min(a + 1, ${FLUID_SAMPLE_COUNT - 1});
    return mix(history[a], history[b], fract(coordinate));
  }
  float radiusAt(float t) {
    float speed = sqrt(${FLUID_INITIAL_SPEED ** 2} + 2.0 * ${FLUID_GRAVITY} * t * ${FLUID_FALL_DISTANCE});
    float flow = sqrt(max(0.0, flux(t)) * ${FLUID_INITIAL_SPEED} / speed);
    return flow * (0.053 + sin(t * 72.0 - time * 15.0) * 0.00075 * t);
  }
  void main() {
    float t = clamp(-position.y, 0.0, 1.0);
    emission = flux(t);
    float r = radiusAt(t);
    float sway = sin(t * 17.0 - time * 4.0) * 0.00065 * t * emission;
    vec3 p = vec3(position.x * r + sway, -t * ${FLUID_FALL_DISTANCE}, position.z * r);
    float slope = (radiusAt(min(1.0, t + 0.002)) - radiusAt(max(0.0, t - 0.002))) / 0.004;
    vec3 n = normalize(vec3(position.x, slope / ${FLUID_FALL_DISTANCE}, position.z));
    waterNormal = normalize(normalMatrix * n);
    worldPosition = (modelMatrix * vec4(p, 1.0)).xyz;
    localPlane = vec2(0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const surfaceVertex = `
  uniform float time;
  uniform float impact;
  varying vec3 waterNormal;
  varying vec3 worldPosition;
  varying vec2 localPlane;
  varying float emission;
  float heightAt(float radius) {
    float wave = sin(radius * 70.0 - time * 10.0) * exp(-radius * 6.0);
    float ripple1 = exp(-pow((radius - fract(time * 0.58) * 0.43) * 55.0, 2.0));
    float ripple2 = exp(-pow((radius - fract(time * 0.58 + 0.5) * 0.43) * 55.0, 2.0));
    return impact * (wave * 0.0014 + (ripple1 + ripple2) * 0.0012);
  }
  void main() {
    float r = length(position.xy);
    float h = heightAt(r);
    float derivative = (heightAt(r + 0.001) - heightAt(max(0.0, r - 0.001))) / 0.002;
    vec2 direction = r > 0.0001 ? position.xy / r : vec2(0.0);
    vec3 n = normalize(vec3(-direction * derivative, 1.0));
    vec3 p = position + vec3(0.0, 0.0, h);
    waterNormal = normalize(normalMatrix * n);
    worldPosition = (modelMatrix * vec4(p, 1.0)).xyz;
    localPlane = position.xy;
    emission = 1.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export function createPlumbingWater(): PlumbingWater {
  const staticGroup = new THREE.Group();
  staticGroup.name = 'Cached ceramic washbasin';
  const group = new THREE.Group();
  group.name = 'Dynamic flowing and stored water';
  const fluid = createPlumbingFluid();
  const steel = new THREE.MeshStandardMaterial({
    color: '#bac5cc',
    metalness: 0.94,
    roughness: 0.3,
  });
  const ceramic = new THREE.MeshStandardMaterial({
    color: '#dae3e8',
    metalness: 0,
    roughness: 0.2,
    envMapIntensity: 0.7,
    vertexColors: true,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: '#18232b',
    roughness: 0.55,
    metalness: 0.45,
  });
  const profile = [
    [0, -0.083],
    [0.28, -0.083],
    [0.323, -0.078],
    [0.361, -0.056],
    [0.396, -0.013],
    [0.424, 0.04],
    [0.446, 0.12],
    [0.465, 0.23],
    [0.467, 0.27],
    [0.46, 0.293],
    [0.444, 0.303],
    [0.428, 0.296],
    [0.416, 0.278],
    [0.403, 0.23],
    [0.385, 0.151],
    [0.359, 0.084],
    [0.327, 0.043],
    [0.274, 0.021],
    [0.17, 0.014],
    [0.13, 0.006],
    [0, 0.006],
  ];
  const bowl = new THREE.Mesh(
    new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      64,
    ),
    ceramic,
  );
  const basinColors = new Float32Array(bowl.geometry.getAttribute('position').count * 3);
  for (let index = 0; index < basinColors.length / 3; index += 1) {
    const section = index % profile.length;
    const inner = section >= 12;
    const shade = inner ? 0.79 + (0.21 * Math.max(0, profile[section][1])) / 0.303 : 1;
    basinColors.set([shade, Math.min(1, shade * 1.012), Math.min(1, shade * 1.025)], index * 3);
  }
  bowl.geometry.setAttribute('color', new THREE.BufferAttribute(basinColors, 3));
  bowl.name = 'White glazed ceramic vessel basin';
  bowl.position.set(-1.24, basinY, 0);
  bowl.castShadow = true;
  bowl.receiveShadow = true;
  staticGroup.add(bowl);
  const cavity = new THREE.Mesh(new THREE.CylinderGeometry(0.143, 0.143, 0.012, 40), dark);
  cavity.position.set(-1.24, basinY - 0.006, 0);
  staticGroup.add(cavity);
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.143, 0, Math.PI * 2, false);
  const perforation = (x: number, y: number, radius: number) => {
    const hole = new THREE.Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  };
  perforation(0, 0, 0.017);
  for (const [count, radius] of [
    [6, 0.053],
    [12, 0.105],
  ]) {
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      perforation(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.011);
    }
  }
  const strainerGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 8,
    steps: 1,
  });
  const strainer = new THREE.Mesh(strainerGeometry, steel);
  strainer.name = 'Perforated basin drain';
  strainer.rotation.x = -Math.PI / 2;
  strainer.position.set(-1.24, basinY + 0.004, 0);
  staticGroup.add(strainer);

  const placeholder = new THREE.DataTexture(new Uint8Array([243, 247, 250, 0]), 1, 1);
  placeholder.needsUpdate = true;
  const uniforms = {
    time: { value: 0 },
    history: { value: new Float32Array(FLUID_SAMPLE_COUNT) },
    reflectedScene: { value: placeholder as THREE.Texture },
    viewport: { value: new THREE.Vector2(1, 1) },
    hasReflection: { value: 0 },
    emptyBackground: { value: new THREE.Color('#f3f7fa') },
    surfaceY: { value: basinY + 0.012 },
    surfaceRadius: { value: 0.402 },
    opacity: { value: 0.91 },
    kind: { value: 0 },
    impact: { value: 0 },
  };
  const streamMaterial = new THREE.ShaderMaterial({
    vertexShader: streamVertex,
    fragmentShader: fluidFragment,
    uniforms,
    transparent: true,
    depthWrite: false,
  });
  const streamGeometry = new THREE.CylinderGeometry(1, 1, 1, 32, 48, true);
  streamGeometry.translate(0, -0.5, 0);
  const stream = new THREE.Mesh(streamGeometry, streamMaterial);
  stream.name = 'Delayed continuous flow';
  stream.position.set(-1.24, outletY, 0);
  stream.frustumCulled = false;
  stream.visible = false;
  group.add(stream);
  const surfaceUniforms = { ...uniforms, kind: { value: 1 }, opacity: { value: 0.88 } };
  const surfaceMaterial = new THREE.ShaderMaterial({
    vertexShader: surfaceVertex,
    fragmentShader: fluidFragment,
    uniforms: surfaceUniforms,
    transparent: true,
    depthWrite: false,
  });
  const surface = new THREE.Mesh(new THREE.PlaneGeometry(0.822, 0.822, 32, 32), surfaceMaterial);
  surface.name = 'Rising and draining water surface';
  surface.rotation.x = -Math.PI / 2;
  surface.position.set(-1.24, basinY + 0.012, 0);
  surface.visible = false;
  group.add(surface);
  const splashMaterial = new THREE.MeshStandardMaterial({
    color: '#c9e5ef',
    metalness: 0.12,
    roughness: 0.07,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const splashes = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.006, 8, 6),
    splashMaterial,
    7,
  );
  splashes.name = 'Seven tiny impact droplets in one draw';
  splashes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  splashes.frustumCulled = false;
  splashes.visible = false;
  group.add(splashes);
  const dummy = new THREE.Object3D();
  let placeholderDisposed = false;
  function setReflectionSource(texture: THREE.Texture, width: number, height: number) {
    uniforms.reflectedScene.value = texture;
    uniforms.viewport.value.set(Math.max(1, width), Math.max(1, height));
    uniforms.hasReflection.value = 1;
    if (!placeholderDisposed) {
      placeholder.dispose();
      placeholderDisposed = true;
    }
  }
  streamMaterial.addEventListener('dispose', () => {
    if (!placeholderDisposed) placeholder.dispose();
  });
  function update(time: number, opening: number, reduced: boolean) {
    const state = fluid.update(time, opening, reduced);
    const clock = reduced ? 0 : time;
    uniforms.time.value = clock;
    uniforms.history.value.set(state.samples);
    const storedHeight = reservoirHeight(state.volume);
    const waterY = basinY + RESERVOIR_BASE_OFFSET + storedHeight;
    uniforms.surfaceY.value = waterY;
    uniforms.impact.value = state.impact;
    uniforms.surfaceRadius.value = reservoirRadius(storedHeight);
    stream.visible = state.samples.some((sample) => sample > 0.006);
    surface.visible = state.volume > 0.0001;
    surface.position.y = waterY;
    surfaceUniforms.opacity.value = Math.min(1, state.volume * 40) * 0.88;
    splashes.visible = state.inflow > 0.08 || state.dripDistance !== null;
    if (splashes.visible) {
      for (let index = 0; index < 6; index += 1) {
        const phase = reduced ? (index + 0.4) / 7 : (clock * 1.6 + index / 7) % 1;
        const angle = index * 2.39996;
        const reach = (0.02 + phase * 0.052) * Math.sqrt(state.inflow);
        const height = Math.sin(phase * Math.PI) * (0.037 + (index % 3) * 0.007) * state.inflow;
        dummy.position.set(
          -1.24 + Math.cos(angle) * reach,
          waterY + height + 0.004,
          Math.sin(angle) * reach,
        );
        dummy.scale.setScalar((0.65 + Math.sin(phase * Math.PI) * 0.3) * Math.sqrt(state.inflow));
        dummy.updateMatrix();
        splashes.setMatrixAt(index, dummy.matrix);
      }
      dummy.position.set(-1.24, outletY - (state.dripDistance ?? 0) - 0.011, 0);
      dummy.scale.setScalar(state.dripDistance === null ? 0 : state.dripSize * 1.65);
      dummy.scale.y *= state.dripDistance === 0 ? 1.3 : 1;
      dummy.updateMatrix();
      splashes.setMatrixAt(6, dummy.matrix);
      splashes.instanceMatrix.needsUpdate = true;
    }
    return state.active;
  }
  return { staticGroup, group, update, setReflectionSource };
}
