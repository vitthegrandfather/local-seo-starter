export const FLUID_SAMPLE_COUNT = 64;
export const FLUID_FALL_DISTANCE = 1.395;
export const FLUID_INITIAL_SPEED = 1.1;
export const FLUID_GRAVITY = 9.81;
export const RESERVOIR_BASE_OFFSET = 0.014;
export const RESERVOIR_HEIGHT = 0.23;
const clamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function flightTime(distance: number, initialSpeed = FLUID_INITIAL_SPEED) {
  return (
    (Math.sqrt(initialSpeed ** 2 + 2 * FLUID_GRAVITY * Math.max(0, distance)) - initialSpeed) /
    FLUID_GRAVITY
  );
}
export function flightDistance(time: number, initialSpeed = FLUID_INITIAL_SPEED) {
  const elapsed = Math.max(0, time);
  return initialSpeed * elapsed + (FLUID_GRAVITY * elapsed ** 2) / 2;
}
export function flightSpeed(distance: number) {
  return Math.sqrt(FLUID_INITIAL_SPEED ** 2 + 2 * FLUID_GRAVITY * Math.max(0, distance));
}
export function jetRadius(distance: number, opening: number) {
  return 0.053 * Math.sqrt((clamp(opening) * FLUID_INITIAL_SPEED) / flightSpeed(distance));
}
export const FLUID_MAX_DELAY = flightTime(FLUID_FALL_DISTANCE);

// Cross-section knots follow the ceramic basin's inner wall. Omitting pi in
// both numerator and capacity keeps the normalized volume unchanged.
const basinSections = [
  [0, 0.17],
  [0.007, 0.274],
  [0.029, 0.327],
  [0.07, 0.359],
  [0.137, 0.385],
  [0.216, 0.403],
  [RESERVOIR_HEIGHT, 0.407],
];
const sectionVolumes = [0];
for (let index = 1; index < basinSections.length; index += 1) {
  const [y0, r0] = basinSections[index - 1];
  const [y1, r1] = basinSections[index];
  sectionVolumes.push(sectionVolumes[index - 1] + ((y1 - y0) * (r0 * r0 + r0 * r1 + r1 * r1)) / 3);
}
const capacity = sectionVolumes.at(-1)!;
export function reservoirHeight(volume: number) {
  const target = clamp(volume) * capacity;
  if (target === 0) return 0;
  for (let index = 1; index < basinSections.length; index += 1) {
    if (target > sectionVolumes[index]) continue;
    const [y0, r0] = basinSections[index - 1];
    const [y1, r1] = basinSections[index];
    const length = y1 - y0;
    const slope = (r1 - r0) / length;
    const needed = target - sectionVolumes[index - 1];
    let h = (length * needed) / (sectionVolumes[index] - sectionVolumes[index - 1]);
    for (let iteration = 0; iteration < 4; iteration += 1) {
      const actual = r0 * r0 * h + r0 * slope * h * h + (slope * slope * h ** 3) / 3;
      h = Math.max(0, Math.min(length, h - (actual - needed) / (r0 + slope * h) ** 2));
    }
    return y0 + h;
  }
  return RESERVOIR_HEIGHT;
}
export function reservoirRadius(height: number) {
  for (let index = 1; index < basinSections.length; index += 1) {
    const [y0, r0] = basinSections[index - 1];
    const [y1, r1] = basinSections[index];
    if (height <= y1) return r0 + (r1 - r0) * clamp((height - y0) / (y1 - y0));
  }
  return basinSections.at(-1)![1];
}
export function reservoirOutflow(volume: number) {
  const head = reservoirHeight(volume) / RESERVOIR_HEIGHT;
  return 0.65 * Math.sqrt(head) + 0.35 * head ** 8;
}

export type FluidSnapshot = {
  samples: Float32Array;
  volume: number;
  inflow: number;
  impact: number;
  dripDistance: number | null;
  dripSize: number;
  received: number;
  drained: number;
  active: boolean;
};

/** Ballistic emission transport plus a normalized, head-driven reservoir. */
export function createPlumbingFluid() {
  const times: number[] = [Number.NEGATIVE_INFINITY];
  const openings: number[] = [0];
  const snapshot: FluidSnapshot = {
    samples: new Float32Array(FLUID_SAMPLE_COUNT),
    volume: 0,
    inflow: 0,
    impact: 0,
    dripDistance: null,
    dripSize: 0,
    received: 0,
    drained: 0,
    active: false,
  };
  const sampleDelays = Array.from({ length: FLUID_SAMPLE_COUNT }, (_, index) =>
    flightTime((index / (FLUID_SAMPLE_COUNT - 1)) * FLUID_FALL_DISTANCE),
  );
  let previous: number | null = null;
  let wasReduced = false;
  let residualWetness = 0;
  let sealedAt: number | null = null;
  let dripStrength = 0;
  function sample(time: number) {
    let low = 0;
    let high = times.length - 1;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (times[middle] <= time) low = middle;
      else high = middle - 1;
    }
    return openings[low];
  }
  function equilibrium(opening: number) {
    if (opening === 0 || opening === 1) return opening;
    let low = 0;
    let high = 1;
    for (let index = 0; index < 24; index += 1) {
      const middle = (low + high) / 2;
      if (reservoirOutflow(middle) < opening) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }
  function update(time: number, opening: number, reduced = false): FluidSnapshot {
    const now = Math.max(previous ?? 0, Number.isFinite(time) ? time : (previous ?? 0));
    const amount = clamp(opening);
    if (reduced) {
      snapshot.samples.fill(amount);
      snapshot.volume = equilibrium(amount);
      snapshot.inflow = snapshot.impact = amount;
      snapshot.dripDistance = null;
      snapshot.dripSize = 0;
      snapshot.received = snapshot.volume;
      snapshot.drained = 0;
      snapshot.active = false;
      times.splice(0, times.length, Number.NEGATIVE_INFINITY);
      openings.splice(0, openings.length, amount);
      previous = now;
      residualWetness = amount;
      sealedAt = null;
      wasReduced = true;
      return snapshot;
    }
    if (wasReduced) {
      times.splice(0, times.length, Number.NEGATIVE_INFINITY);
      openings.splice(0, openings.length, snapshot.samples[0]);
      wasReduced = false;
    }
    if (amount > 0.005) residualWetness = Math.max(residualWetness, amount);
    if (residualWetness > 0.005 && amount <= 0.0001) {
      sealedAt = now;
      dripStrength = Math.max(0.35, Math.sqrt(residualWetness));
      residualWetness = 0;
    } else if (amount > 0.0001) sealedAt = null;
    if (openings[openings.length - 1] !== amount) {
      if (times[times.length - 1] === now) openings[openings.length - 1] = amount;
      else {
        times.push(now);
        openings.push(amount);
      }
    }
    const dt = previous === null ? 0 : Math.min(now - previous, 6);
    const steps = Math.max(1, Math.ceil(dt * 120));
    const step = dt / steps;
    for (let index = 0; index < steps; index += 1) {
      const at = now - dt + (index + 0.5) * step;
      const distance =
        FLUID_FALL_DISTANCE - RESERVOIR_BASE_OFFSET - reservoirHeight(snapshot.volume);
      const incoming = sample(at - flightTime(distance)) * step;
      const drained = Math.min(
        snapshot.volume + incoming,
        reservoirOutflow(snapshot.volume) * step,
      );
      snapshot.volume += incoming - drained;
      snapshot.received += incoming;
      snapshot.drained += drained;
      if (snapshot.volume > 1) {
        snapshot.drained += snapshot.volume - 1;
        snapshot.volume = 1;
      }
    }
    const surfaceDistance =
      FLUID_FALL_DISTANCE - RESERVOIR_BASE_OFFSET - reservoirHeight(snapshot.volume);
    snapshot.inflow = sample(now - flightTime(surfaceDistance));
    snapshot.impact = Math.max(snapshot.inflow, snapshot.impact * Math.exp(-dt * 3.6));
    snapshot.dripDistance = null;
    snapshot.dripSize = 0;
    if (sealedAt !== null) {
      const age = now - sealedAt;
      const travel = flightDistance(Math.max(0, age - 0.11), 0);
      if (travel >= surfaceDistance) {
        const residual = 0.0004 * dripStrength;
        const accepted = Math.min(residual, 1 - snapshot.volume);
        snapshot.volume += accepted;
        snapshot.received += residual;
        snapshot.drained += residual - accepted;
        snapshot.impact = Math.max(snapshot.impact, 0.2 * dripStrength);
        sealedAt = null;
      } else {
        snapshot.dripDistance = travel;
        snapshot.dripSize = dripStrength * Math.min(1, age / 0.11);
      }
    }
    if (snapshot.volume < 0.00002) {
      snapshot.drained += snapshot.volume;
      snapshot.volume = 0;
    }
    let hasTail = false;
    for (let index = 0; index < FLUID_SAMPLE_COUNT; index += 1) {
      const value = sample(now - sampleDelays[index]);
      snapshot.samples[index] = value;
      if (value > 0.0001) hasTail = true;
    }
    snapshot.active = hasTail || amount > 0.0001 || snapshot.volume > 0 || sealedAt !== null;
    previous = now;
    while (times.length > 2 && times[1] < now - FLUID_MAX_DELAY - 0.1) {
      times.shift();
      openings.shift();
    }
    return snapshot;
  }
  return { update };
}
