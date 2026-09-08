import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../lib/plumbing-fluid.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const {
  createPlumbingFluid,
  FLUID_MAX_DELAY,
  FLUID_FALL_DISTANCE,
  FLUID_INITIAL_SPEED,
  flightTime,
  flightDistance,
  flightSpeed,
  jetRadius,
  reservoirHeight,
} = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

function advance(fluid, start, end, opening, rate = 120) {
  let state;
  const frames = Math.ceil((end - start) * rate);
  for (let index = 0; index <= frames; index += 1) {
    state = fluid.update(start + ((end - start) * index) / frames, opening, false);
  }
  return state;
}

test('closed tap has no emitted water, stored water, or active loop', () => {
  const state = createPlumbingFluid().update(0, 0);
  assert.ok(state.samples.every((value) => value === 0));
  assert.equal(state.volume, 0);
  assert.equal(state.active, false);
});

test('opening starts at the nozzle and reaches the bowl after flight time', () => {
  const fluid = createPlumbingFluid();
  fluid.update(0, 0);
  fluid.update(0.01, 1);
  const early = fluid.update(0.11, 1);
  assert.equal(early.samples[0], 1);
  assert.equal(early.samples.at(-1), 0);
  assert.equal(early.inflow, 0);
  assert.equal(early.volume, 0);
  assert.equal(early.active, true);
  const arrived = fluid.update(0.01 + FLUID_MAX_DELAY + 0.02, 1);
  assert.equal(arrived.samples.at(-1), 1);
  assert.equal(arrived.inflow, 1);
  assert.ok(arrived.volume > 0);
});

test('closing cuts the top while the previously emitted tail keeps falling', () => {
  const fluid = createPlumbingFluid();
  advance(fluid, 0, 1, 1);
  const closedAtNozzle = fluid.update(1.01, 0);
  assert.equal(closedAtNozzle.samples[0], 0);
  assert.equal(closedAtNozzle.samples.at(-1), 1);
  const falling = fluid.update(1.16, 0);
  const cutoff = (flightDistance(0.15) / FLUID_FALL_DISTANCE) * (falling.samples.length - 1);
  assert.ok(falling.samples.slice(0, Math.floor(cutoff)).every((value) => value === 0));
  assert.ok(falling.samples.slice(Math.ceil(cutoff)).every((value) => value === 1));
  assert.equal(falling.inflow, 1);
  const landed = fluid.update(1.01 + FLUID_MAX_DELAY + 0.01, 0);
  assert.ok(landed.samples.every((value) => value === 0));
  assert.equal(landed.inflow, 0);
  assert.ok(landed.volume > 0);
  assert.equal(landed.active, true);
});

test('basin fills toward a stable capacity, then drains and ends the loop', () => {
  const fluid = createPlumbingFluid();
  const filled = advance(fluid, 0, 3, 1);
  assert.ok(filled.volume > 0.8 && filled.volume <= 1);
  const steady = advance(fluid, 3, 6, 1);
  assert.ok(steady.volume > 0.99 && steady.volume <= 1);
  const tail = advance(fluid, 6.01, 6.31, 0);
  assert.ok(tail.volume > 0);
  assert.equal(tail.active, true);
  const drained = advance(fluid, 6.31, 10, 0);
  assert.equal(drained.volume, 0);
  assert.equal(drained.active, false);
});

test('partial opening propagates its actual value and yields a lower stable level', () => {
  const fluid = createPlumbingFluid();
  const state = advance(fluid, 0, 6, 0.5);
  assert.ok(state.samples.every((value) => value === 0.5));
  assert.ok(state.volume > 0.35 && state.volume < 0.75);
});

test('rapid changes leave no orphaned emission after the final tail lands', () => {
  const fluid = createPlumbingFluid();
  for (let frame = 0; frame <= 120; frame += 1) {
    const opening = (frame % 5) / 4;
    const state = fluid.update(frame / 120, opening);
    assert.ok(state.volume >= 0 && state.volume <= 1);
  }
  fluid.update(1.01, 0);
  const state = fluid.update(1.01 + FLUID_MAX_DELAY + 0.01, 0);
  assert.ok(state.samples.every((value) => value === 0));
});

test('reduced motion provides one deterministic selected state', () => {
  const fluid = createPlumbingFluid();
  const first = fluid.update(0, 0.5, true);
  const volume = first.volume;
  const samples = new Float32Array(first.samples);
  const later = fluid.update(99, 0.5, true);
  assert.equal(later.volume, volume);
  assert.deepEqual(later.samples, samples);
  assert.equal(later.active, false);
  const closed = fluid.update(100, 0, true);
  assert.equal(closed.volume, 0);
  assert.ok(closed.samples.every((value) => value === 0));
});

test('mass balance is stable across 60 and 120 Hz and clamps invalid inputs', () => {
  const slow = advance(createPlumbingFluid(), 0, 3, 1, 60).volume;
  const fast = advance(createPlumbingFluid(), 0, 3, 1, 120).volume;
  assert.ok(Math.abs(slow - fast) < 0.005);
  const fluid = createPlumbingFluid();
  const state = fluid.update(Number.NaN, Number.POSITIVE_INFINITY);
  assert.equal(state.volume, 0);
  assert.ok(state.samples.every((value) => value === 0));
});

test('ballistic transport accelerates and inverse travel matches position', () => {
  for (const distance of [0, 0.1, 0.4, 0.8, FLUID_FALL_DISTANCE]) {
    assert.ok(Math.abs(flightDistance(flightTime(distance)) - distance) < 1e-10);
  }
  const first = flightDistance(0.1);
  const second = flightDistance(0.2) - flightDistance(0.1);
  const third = flightDistance(0.3) - flightDistance(0.2);
  assert.ok(first < second && second < third);
  assert.ok(flightSpeed(FLUID_FALL_DISTANCE) > FLUID_INITIAL_SPEED * 4);
  assert.ok(FLUID_MAX_DELAY > 0.4 && FLUID_MAX_DELAY < 0.5);
});

test('continuity preserves jet flux as falling speed grows', () => {
  for (const opening of [0.1, 0.5, 1]) {
    const inlet = Math.PI * jetRadius(0, opening) ** 2 * FLUID_INITIAL_SPEED;
    for (const distance of [0.2, 0.7, FLUID_FALL_DISTANCE]) {
      const flux = Math.PI * jetRadius(distance, opening) ** 2 * flightSpeed(distance);
      assert.ok(Math.abs(flux - inlet) < 1e-10);
      assert.ok(jetRadius(distance, opening) < jetRadius(0, opening));
    }
  }
});

test('received minus drained volume equals stored water through repeated toggles', () => {
  const fluid = createPlumbingFluid();
  for (let index = 0; index < 1600; index += 1) {
    const t = index / 120;
    const opening = t < 3 ? 1 : t < 5 ? 0 : t < 7 ? 0.4 : 0;
    const state = fluid.update(t, opening);
    assert.ok(Math.abs(state.received - state.drained - state.volume) < 1e-9);
    assert.ok(state.volume >= 0 && state.volume <= 1);
  }
});

test('rounded bowl uses nonlinear volume-to-height and stays below its rim', () => {
  assert.equal(reservoirHeight(0), 0);
  assert.ok(Math.abs(reservoirHeight(1) - 0.23) < 1e-9);
  assert.ok(reservoirHeight(0.5) > 0.115);
  let previous = 0;
  for (let index = 1; index <= 100; index += 1) {
    const height = reservoirHeight(index / 100);
    assert.ok(height > previous && height <= 0.230001);
    previous = height;
  }
  assert.ok(0.014 + reservoirHeight(1) < 0.303);
});

test('one residual drop detaches after closure and impact waves settle', () => {
  const fluid = createPlumbingFluid();
  advance(fluid, 0, 1, 1);
  fluid.update(1.01, 0);
  const attached = fluid.update(1.06, 0);
  assert.equal(attached.dripDistance, 0);
  assert.ok(attached.dripSize > 0);
  const falling = fluid.update(1.25, 0);
  assert.ok(falling.dripDistance > 0);
  const a = falling.dripDistance;
  const later = fluid.update(1.35, 0);
  assert.ok(later.dripDistance > a);
  const landed = fluid.update(1.85, 0);
  assert.equal(landed.dripDistance, null);
  assert.ok(landed.impact > 0);
  const settled = advance(fluid, 1.85, 7, 0);
  assert.equal(settled.active, false);
  assert.ok(settled.impact < 0.001);
});

test('gradual valve closure retains one final drop without continuously re-emitting it', () => {
  const fluid = createPlumbingFluid();
  advance(fluid, 0, 1, 1);
  for (let index = 1; index <= 120; index += 1) {
    fluid.update(1 + index / 120, Math.max(0, 1 - index / 120));
  }
  const collecting = fluid.update(2.05, 0);
  assert.equal(collecting.dripDistance, 0);
  assert.ok(collecting.dripSize > 0);
  const landed = advance(fluid, 2.05, 3, 0);
  assert.equal(landed.dripDistance, null);
  const later = fluid.update(4, 0);
  assert.equal(later.dripDistance, null);
});
