import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type PlumbingModel = {
  group: THREE.Group;
  /** The lever pivots around Y. Zero = open (+X); PI / 2 = closed. */
  handle: THREE.Group;
};

/** Exact circular centreline, so adjacent straight pipes meet tangentially. */
class PipeElbow extends THREE.Curve<THREE.Vector3> {
  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly radius: number,
    private readonly start: number,
    private readonly end: number,
  ) {
    super();
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    const angle = THREE.MathUtils.lerp(this.start, this.end, t);
    return target.set(
      this.x + this.radius * Math.cos(angle),
      this.y + this.radius * Math.sin(angle),
      0,
    );
  }
}

function turnedGeometry(profile: [number, number][]) {
  return new THREE.LatheGeometry(
    profile.map(([radius, height]) => new THREE.Vector2(radius, height)),
    64,
  );
}

/** A machined hexagon with actual bevels and an optional through-bore. */
function hexGeometry(radius: number, depth: number, bore = 0) {
  const shape = new THREE.Shape();
  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = (corner / 6) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (corner === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  if (bore > 0) {
    const hole = new THREE.Path();
    hole.absarc(0, 0, bore, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  const bevel = Math.min(0.012, depth * 0.13);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 32,
  });
  geometry.translate(0, 0, -depth / 2 + bevel);
  return geometry;
}

/**
 * Procedural product model in metres. Floor: -1.4; outlet: (-1.24, .09, 0).
 * Materials and geometry belong to the caller, which disposes them on unmount.
 */
export function createPlumbingModel(): PlumbingModel {
  const group = new THREE.Group();
  group.name = 'AquaFix plumbing assembly';

  const paint = new THREE.MeshStandardMaterial({
    color: '#356382',
    roughness: 0.38,
    metalness: 0.65,
  });
  const darkPaint = new THREE.MeshStandardMaterial({
    color: '#18384f',
    roughness: 0.32,
    metalness: 0.65,
  });
  const brass = new THREE.MeshStandardMaterial({
    color: '#b89751',
    roughness: 0.4,
    metalness: 0.85,
  });
  const machinedBrass = new THREE.MeshStandardMaterial({
    color: '#d2b572',
    roughness: 0.32,
    metalness: 0.9,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: '#b9c8d0',
    roughness: 0.3,
    metalness: 0.94,
  });
  const rubber = new THREE.MeshStandardMaterial({
    color: '#142938',
    roughness: 0.76,
    metalness: 0.03,
  });
  const grip = new THREE.MeshPhysicalMaterial({
    color: '#f5c451',
    roughness: 0.27,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.32,
  });

  function part(
    name: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number],
    parent: THREE.Group = group,
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function cylinder(
    name: string,
    radius: number,
    length: number,
    position: [number, number, number],
    material: THREE.Material,
    axis: 'x' | 'y' = 'y',
    parent: THREE.Group = group,
  ) {
    const mesh = part(
      name,
      new THREE.CylinderGeometry(radius, radius, length, 48),
      material,
      position,
      parent,
    );
    if (axis === 'x') mesh.rotation.z = Math.PI / 2;
    return mesh;
  }

  function hex(
    name: string,
    radius: number,
    depth: number,
    position: [number, number, number],
    material: THREE.Material,
    axis: 'x' | 'y',
    bore = 0,
    parent: THREE.Group = group,
  ) {
    const mesh = part(name, hexGeometry(radius, depth, bore), material, position, parent);
    if (axis === 'x') mesh.rotation.y = Math.PI / 2;
    else mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  // The upright and both bends use the same round section, with no pinched elbow.
  cylinder('Painted supply upright', 0.15, 1.6, [0.95, -0.45, 0], paint);
  part(
    'Supply quarter-circle elbow',
    new THREE.TubeGeometry(new PipeElbow(0.55, 0.35, 0.4, 0, Math.PI / 2), 40, 0.15, 32, false),
    paint,
    [0, 0, 0],
  );
  cylinder('Supply inlet', 0.15, 0.18, [0.48, 0.75, 0], paint, 'x');

  // A turned brass body with small shoulders, not an intersecting sphere/cylinder.
  const body = part(
    'Forged brass ball-valve body',
    turnedGeometry([
      [0.14, -0.42],
      [0.163, -0.42],
      [0.17, -0.41],
      [0.17, -0.31],
      [0.194, -0.29],
      [0.221, -0.22],
      [0.229, -0.18],
      [0.229, 0.18],
      [0.221, 0.22],
      [0.194, 0.29],
      [0.17, 0.31],
      [0.17, 0.41],
      [0.163, 0.42],
      [0.14, 0.42],
    ]),
    brass,
    [-0.16, 0.75, 0],
  );
  body.rotation.z = Math.PI / 2;

  for (const x of [-0.635, 0.315]) {
    hex('Bevelled compression union', 0.228, 0.18, [x, 0.75, 0], machinedBrass, 'x', 0.132);
    for (const offset of [-0.106, 0.106]) {
      cylinder('Union machined shoulder', 0.174, 0.021, [x + offset, 0.75, 0], brass, 'x');
    }
    // Three shallow exposed thread crests are enough to explain the connection.
    const threadSide = x < 0 ? -1 : 1;
    for (let index = 0; index < 3; index += 1) {
      cylinder(
        'Exposed connection thread',
        0.154,
        0.009,
        [x + threadSide * (0.124 + index * 0.018), 0.75, 0],
        steel,
        'x',
      );
    }
  }

  cylinder('Outlet steel nipple', 0.138, 0.28, [-0.87, 0.75, 0], steel, 'x');
  part(
    'Outlet quarter-circle elbow',
    new THREE.TubeGeometry(
      new PipeElbow(-1, 0.51, 0.24, Math.PI / 2, Math.PI),
      32,
      0.138,
      32,
      false,
    ),
    steel,
    [0, 0, 0],
  );
  part(
    'Hollow outlet and machined lip',
    turnedGeometry([
      [0.145, 0.09],
      [0.158, 0.103],
      [0.158, 0.156],
      [0.145, 0.17],
      [0.138, 0.185],
      [0.138, 0.51],
      [0.105, 0.51],
      [0.105, 0.115],
      [0.117, 0.09],
      [0.145, 0.09],
    ]),
    steel,
    [-1.24, 0, 0],
  );
  cylinder('Recessed outlet interior', 0.104, 0.008, [-1.24, 0.44, 0], rubber);

  // Stem, packing nut, spindle and a pressed steel lever with a vinyl grip.
  cylinder('Valve stem boss', 0.108, 0.13, [-0.16, 1.003, 0], brass);
  hex('Stem packing nut', 0.128, 0.063, [-0.16, 1.096, 0], machinedBrass, 'y', 0.042);
  cylinder('Valve spindle', 0.05, 0.146, [-0.16, 1.176, 0], steel);

  const handle = new THREE.Group();
  handle.name = 'Interactive quarter-turn lever';
  handle.position.set(-0.16, 1.25, 0);
  group.add(handle);
  cylinder('Lever pivot eye', 0.098, 0.032, [0, 0, 0], steel, 'y', handle);
  part(
    'Pressed lever',
    new RoundedBoxGeometry(0.74, 0.035, 0.118, 3, 0.016),
    steel,
    [0.285, 0, 0],
    handle,
  );
  part(
    'Yellow vinyl grip',
    new RoundedBoxGeometry(0.43, 0.072, 0.145, 5, 0.034),
    grip,
    [0.46, 0.018, 0],
    handle,
  );
  cylinder('Pivot washer', 0.064, 0.012, [0, 0.024, 0], steel, 'y', handle);
  hex('Lever retaining nut', 0.043, 0.038, [0, 0.047, 0], steel, 'y', 0, handle);
  cylinder('Spindle end', 0.019, 0.012, [0, 0.069, 0], darkPaint, 'y', handle);

  // Heavy, bevelled mounting flange and four genuine hex-head fasteners.
  part(
    'Floor flange',
    turnedGeometry([
      [0, -0.09],
      [0.345, -0.09],
      [0.371, -0.07],
      [0.371, 0.025],
      [0.351, 0.048],
      [0.21, 0.048],
      [0.18, 0.075],
      [0.16, 0.1],
      [0, 0.1],
    ]),
    darkPaint,
    [0.95, -1.31, 0],
  );
  cylinder('Pipe foot collar', 0.187, 0.13, [0.95, -1.218, 0], paint);
  const weld = part(
    'Subtle collar weld bead',
    new THREE.TorusGeometry(0.157, 0.011, 8, 48),
    paint,
    [0.95, -1.145, 0],
  );
  weld.rotation.x = Math.PI / 2;
  for (let index = 0; index < 4; index += 1) {
    const angle = Math.PI / 4 + (index * Math.PI) / 2;
    const x = 0.95 + Math.cos(angle) * 0.269;
    const z = Math.sin(angle) * 0.269;
    cylinder('Flange fastener washer', 0.055, 0.009, [x, -1.257, z], steel);
    hex('Flange hex bolt', 0.041, 0.035, [x, -1.235, z], steel, 'y');
  }

  const countertop = new THREE.MeshStandardMaterial({
    color: '#707b83',
    roughness: 0.6,
    metalness: 0.03,
  });
  part(
    'Solid countertop with rounded edges',
    new RoundedBoxGeometry(3.55, 0.18, 1.42, 6, 0.06),
    countertop,
    [-0.04, -1.49, 0],
  );
  part(
    'Countertop lower edge',
    new RoundedBoxGeometry(3.51, 0.025, 1.38, 4, 0.011),
    darkPaint,
    [-0.04, -1.582, 0],
  );

  // A real supported washstand: cabinet, recessed plinth, doors and tiled splashback.
  // These details live in the static render and add no work to flowing-water frames.
  const cabinet = new THREE.MeshStandardMaterial({
    color: '#37536a',
    roughness: 0.48,
    metalness: 0.08,
  });
  const cabinetEdge = new THREE.MeshStandardMaterial({
    color: '#233b4d',
    roughness: 0.55,
    metalness: 0.06,
  });
  const porcelain = new THREE.MeshStandardMaterial({
    color: '#66727b',
    roughness: 0.46,
    metalness: 0.01,
  });
  const grout = new THREE.MeshStandardMaterial({
    color: '#535f67',
    roughness: 0.92,
  });
  part(
    'Vanity cabinet carcass',
    new RoundedBoxGeometry(3.32, 1.38, 1.21, 4, 0.025),
    cabinetEdge,
    [-0.04, -2.28, -0.025],
  );
  for (const x of [-0.867, 0.787]) {
    part(
      'Satin blue cabinet door',
      new RoundedBoxGeometry(1.626, 1.305, 0.055, 4, 0.012),
      cabinet,
      [x, -2.265, 0.607],
    );
    part(
      'Recessed door pull shadow',
      new RoundedBoxGeometry(0.29, 0.028, 0.012, 3, 0.006),
      cabinetEdge,
      [x, -1.75, 0.64],
    );
    part('Brushed steel door pull', new RoundedBoxGeometry(0.285, 0.025, 0.04, 3, 0.01), steel, [
      x,
      -1.754,
      0.662,
    ]);
  }
  part(
    'Recessed supporting toe kick',
    new RoundedBoxGeometry(3.12, 0.16, 1.02, 3, 0.018),
    cabinetEdge,
    [-0.04, -3.03, -0.075],
  );
  part(
    'Stone floor under the vanity',
    new RoundedBoxGeometry(3.82, 0.075, 1.95, 4, 0.035),
    new THREE.MeshStandardMaterial({ color: '#e9edf0', roughness: 0.65, metalness: 0.02 }),
    [-0.04, -3.145, 0.12],
  );

  // A low backsplash anchors the tap without boxing the hero into a room illustration.
  part(
    'Backsplash backing with fine grout',
    new RoundedBoxGeometry(3.56, 2.77, 0.07, 3, 0.022),
    grout,
    [-0.04, -0.04, -0.76],
  );
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      part(
        'Glazed backsplash tile',
        new RoundedBoxGeometry(0.878, 0.683, 0.025, 2, 0.008),
        porcelain,
        [-1.376 + column * 0.891, -1.077 + row * 0.694, -0.714],
      );
    }
  }

  return { group, handle };
}
