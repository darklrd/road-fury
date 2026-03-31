import { describe, it, expect } from 'vitest';

const CAM_DISTANCE = 10;
const CAM_HEIGHT = 4.5;
const LERP_SPEED = 3;
const LATERAL_OFFSET_FACTOR = 0.3;
const CURVE_LEAN_FACTOR = 2.5;
const LEAN_LERP_SPEED = 2;

function lerpScalar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function simulateCameraUpdate(
  camX: number,
  camY: number,
  camZ: number,
  currentLean: number,
  dt: number,
  carLateral: number,
  carSpeed: number,
  curveSlope: number,
  curveOffset: number,
) {
  const speedRatio = carSpeed / 250;
  currentLean += (curveSlope * CURVE_LEAN_FACTOR - currentLean) * LEAN_LERP_SPEED * dt;

  const targetX = carLateral * LATERAL_OFFSET_FACTOR + curveOffset + currentLean;
  const targetY = CAM_HEIGHT - speedRatio * 0.5;
  const targetZ = CAM_DISTANCE + speedRatio * 2;

  const t = LERP_SPEED * dt;
  camX = lerpScalar(camX, targetX, t);
  camY = lerpScalar(camY, targetY, t);
  camZ = lerpScalar(camZ, targetZ, t);

  return { camX, camY, camZ, currentLean };
}

describe('Camera behavior', () => {
  it('camera follows car position with lag', () => {
    let camX = 0, camY = CAM_HEIGHT, camZ = CAM_DISTANCE;
    let lean = 0;
    const result = simulateCameraUpdate(camX, camY, camZ, lean, 0.016, 3.0, 100, 0, 0);
    expect(result.camX).toBeGreaterThan(0);
    expect(result.camX).toBeLessThan(3.0 * LATERAL_OFFSET_FACTOR);
  });

  it('camera has higher Y position than car (chase cam)', () => {
    const result = simulateCameraUpdate(0, CAM_HEIGHT, CAM_DISTANCE, 0, 0.016, 0, 100, 0, 0);
    expect(result.camY).toBeGreaterThan(1.0);
  });

  it('camera leans laterally on curves', () => {
    let camX = 0, camY = CAM_HEIGHT, camZ = CAM_DISTANCE;
    let lean = 0;
    for (let i = 0; i < 120; i++) {
      const result = simulateCameraUpdate(camX, camY, camZ, lean, 0.016, 0, 100, 2.0, 5.0);
      camX = result.camX;
      camY = result.camY;
      camZ = result.camZ;
      lean = result.currentLean;
    }
    expect(lean).toBeGreaterThan(1.0);
    expect(camX).toBeGreaterThan(0);
  });

  it('camera lean is zero on straight road', () => {
    let lean = 0;
    for (let i = 0; i < 60; i++) {
      const result = simulateCameraUpdate(0, CAM_HEIGHT, CAM_DISTANCE, lean, 0.016, 0, 100, 0, 0);
      lean = result.currentLean;
    }
    expect(Math.abs(lean)).toBeLessThan(0.01);
  });

  it('camera smoothly transitions between positions', () => {
    let camX = 0, camY = CAM_HEIGHT, camZ = CAM_DISTANCE;
    let lean = 0;
    const positions: number[] = [];
    for (let i = 0; i < 30; i++) {
      const result = simulateCameraUpdate(camX, camY, camZ, lean, 0.016, 5.0, 100, 1.0, 3.0);
      camX = result.camX;
      camY = result.camY;
      camZ = result.camZ;
      lean = result.currentLean;
      positions.push(camX);
    }
    for (let i = 1; i < positions.length; i++) {
      const jump = Math.abs(positions[i] - positions[i - 1]);
      expect(jump).toBeLessThan(1.0);
    }
    expect(positions[positions.length - 1]).toBeGreaterThan(positions[0]);
  });
});
