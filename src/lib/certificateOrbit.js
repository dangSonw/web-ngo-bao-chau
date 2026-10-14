export const ORBIT_STEP = Math.PI * 2;

export function certificatePose(index, count, phase, width, height) {
  const angle = phase + index * ORBIT_STEP / count;
  const depth = Math.cos(angle);
  return {
    x: Math.sin(angle) * width * 0.35,
    y: -Math.sin(angle) * height * 0.3 + depth * height * 0.12,
    depth,
    scale: 0.55 + (depth + 1) * 0.15,
    front: depth > 0.2,
  };
}

export function centeredPhase(index, count, phase) {
  const target = -index * ORBIT_STEP / count;
  return target + Math.round((phase - target) / ORBIT_STEP) * ORBIT_STEP;
}
