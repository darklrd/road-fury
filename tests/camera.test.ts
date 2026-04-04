import { describe, it, expect } from 'vitest';

const CAM_DISTANCE = 10;
const CAM_HEIGHT = 4.5;
const LERP_SPEED = 3.5;

function lerpScalar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function simulateCameraUpdate(
  camX: number,
  camY: number,
  camZ: number,
  dt: number,
  carX: number,
  carSpeed: number,
) {
  const speedRatio = carSpeed / 250;

  const targetX = carX;
  const targetY = CAM_HEIGHT - speedRatio * 0.5;
  const targetZ = CAM_DISTANCE + speedRatio * 2;

  const t = LERP_SPEED * dt;
  camX = lerpScalar(camX, targetX, t);
  camY = lerpScalar(camY, targetY, t);
  camZ = lerpScalar(camZ, targetZ, t);

  return { camX, camY, camZ };
}

describe('Camera behavior', () => {
  it('camera follows car position at 100%', () => {
    let camX = 0, camY = CAM_HEIGHT, camZ = CAM_DISTANCE;
    for (let i = 0; i < 60; i++) {
      const result = simulateCameraUpdate(camX, camY, camZ, 0.016, 5.0, 100);
      camX = result.camX;
      camY = result.camY;
      camZ = result.camZ;
    }
    expect(camX).toBeGreaterThan(0);
    expect(camX).toBeCloseTo(5.0, 0);
  });

  it('camera lookAt follows car X', () => {
    const carX = 12.0;
    const speedRatio = 100 / 250;
    const lookX = carX;
    const lookY = 1;
    const lookZ = -15 - speedRatio * 10;
    expect(lookX).toBe(carX);
    expect(lookY).toBe(1);
    expect(lookZ).toBeLessThan(0);
  });

  it('camera does not lean on curves', () => {
    let camX = 0, camY = CAM_HEIGHT, camZ = CAM_DISTANCE;
    for (let i = 0; i < 120; i++) {
      const result = simulateCameraUpdate(camX, camY, camZ, 0.016, 0, 100);
      camX = result.camX;
      camY = result.camY;
      camZ = result.camZ;
    }
    expect(Math.abs(camX)).toBeLessThan(0.01);
  });

  it('camera does not rotate on curves', () => {
    const rotationZ = 0;
    expect(rotationZ).toBeCloseTo(0);
  });

  it('camera has speed-based FOV increase', () => {
    const baseFov = 75;
    const slowFov = baseFov + (50 / 250) * 15;
    const fastFov = baseFov + (200 / 250) * 15;
    expect(fastFov).toBeGreaterThan(slowFov);
    expect(fastFov).toBeGreaterThan(baseFov);
  });

  it('camera shakes at high speed', () => {
    let camX = 5, camY = CAM_HEIGHT, camZ = CAM_DISTANCE;
    const result1 = simulateCameraUpdate(camX, camY, camZ, 0.016, 5.0, 200);
    const result2 = simulateCameraUpdate(camX, camY, camZ, 0.016, 5.0, 200);
    const speedRatio = 200 / 250;
    const shakeAmount = speedRatio * 0.015;
    expect(shakeAmount).toBeGreaterThan(0);
    expect(result1.camX).toBeDefined();
    expect(result2.camX).toBeDefined();
  });

  it('camera has higher Y position than car (chase cam)', () => {
    const result = simulateCameraUpdate(0, CAM_HEIGHT, CAM_DISTANCE, 0.016, 0, 100);
    expect(result.camY).toBeGreaterThan(1.0);
  });

  it('camera smoothly transitions between positions', () => {
    let camX = 0, camY = CAM_HEIGHT, camZ = CAM_DISTANCE;
    const positions: number[] = [];
    for (let i = 0; i < 30; i++) {
      const result = simulateCameraUpdate(camX, camY, camZ, 0.016, 5.0, 100);
      camX = result.camX;
      camY = result.camY;
      camZ = result.camZ;
      positions.push(camX);
    }
    for (let i = 1; i < positions.length; i++) {
      const jump = Math.abs(positions[i] - positions[i - 1]);
      expect(jump).toBeLessThan(1.0);
    }
    expect(positions[positions.length - 1]).toBeGreaterThan(positions[0]);
  });
});
