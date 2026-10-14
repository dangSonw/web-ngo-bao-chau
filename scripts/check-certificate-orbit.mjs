import assert from 'node:assert/strict';
import { certificatePose, centeredPhase, ORBIT_STEP } from '../src/lib/certificateOrbit.js';

for (let index = 0; index < 11; index++) {
  const phase = centeredPhase(index, 11, 7);
  const pose = certificatePose(index, 11, phase, 790, 470);
  assert(Math.abs(pose.x) < 1e-8 && Math.abs(pose.depth - 1) < 1e-8);
  assert(pose.front);
  assert(Math.abs(phase - 7) <= Math.PI);
}
const back = certificatePose(0, 11, Math.PI, 790, 470);
assert(!back.front);
const first = certificatePose(2, 11, 0, 790, 470);
const nextLap = certificatePose(2, 11, ORBIT_STEP, 790, 470);
assert(Math.abs(first.x - nextLap.x) < 1e-8);
assert(Math.abs(first.y - nextLap.y) < 1e-8);
console.log('Orbit centering, front-layer gating and continuous rotation passed');
