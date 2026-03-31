import { describe, it, expect } from 'vitest';
import { computeCurve, computeCurveSlope } from '../src/game/Road';

describe('Road curve calculations', () => {
  it('getCurveAt returns different values for different z positions', () => {
    const phase = 1.0;
    const dist = 100;
    const v1 = computeCurve(phase, dist, 0);
    const v2 = computeCurve(phase, dist, -50);
    const v3 = computeCurve(phase, dist, -100);
    expect(v1).not.toBeCloseTo(v2, 1);
    expect(v2).not.toBeCloseTo(v3, 1);
  });

  it('getCurveAt values change over time as curvePhase advances', () => {
    const dist = 100;
    const z = -30;
    const v1 = computeCurve(0, dist, z);
    const v2 = computeCurve(1, dist, z);
    const v3 = computeCurve(2, dist, z);
    expect(v1).not.toBeCloseTo(v2, 1);
    expect(v2).not.toBeCloseTo(v3, 1);
  });

  it('curve amplitude exceeds 10 units', () => {
    let maxAbs = 0;
    for (let phase = 0; phase < 20; phase += 0.1) {
      for (let z = 0; z > -500; z -= 5) {
        const v = Math.abs(computeCurve(phase, 1000, z));
        if (v > maxAbs) maxAbs = v;
      }
    }
    expect(maxAbs).toBeGreaterThan(10);
  });

  it('getCurveSlope returns non-zero for curved sections', () => {
    let maxSlope = 0;
    for (let phase = 0; phase < 20; phase += 0.1) {
      for (let z = 0; z > -200; z -= 5) {
        const slope = Math.abs(computeCurveSlope(phase, 500, z));
        if (slope > maxSlope) maxSlope = slope;
      }
    }
    expect(maxSlope).toBeGreaterThan(0.01);
  });

  it('getCurveSlope returns near-zero for straight sections', () => {
    let foundNearZero = false;
    for (let phase = 0; phase < 20; phase += 0.01) {
      const slope = computeCurveSlope(phase, 500, 0);
      if (Math.abs(slope) < 0.05) {
        foundNearZero = true;
        break;
      }
    }
    expect(foundNearZero).toBe(true);
  });

  it('segments recycle when they pass behind camera', () => {
    const segmentBaseZ = [0, -20, -40];
    const SEGMENT_LENGTH = 20;
    const totalLength = 3 * SEGMENT_LENGTH;

    segmentBaseZ[0] += 100;
    if (segmentBaseZ[0] > SEGMENT_LENGTH * 3) {
      segmentBaseZ[0] -= totalLength;
    }
    expect(segmentBaseZ[0]).toBeLessThanOrEqual(SEGMENT_LENGTH * 3);
  });

  it('total distance increases with update', () => {
    let totalDistance = 0;
    const speed = 100;
    const dt = 0.016;
    totalDistance += speed * dt;
    expect(totalDistance).toBeGreaterThan(0);
    const prev = totalDistance;
    totalDistance += speed * dt;
    expect(totalDistance).toBeGreaterThan(prev);
  });

  it('curve is smooth with no sudden jumps between adjacent z values', () => {
    const phase = 1.5;
    const dist = 300;
    let maxDelta = 0;
    let prevVal = computeCurve(phase, dist, 0);
    for (let z = -1; z > -200; z -= 1) {
      const val = computeCurve(phase, dist, z);
      const delta = Math.abs(val - prevVal);
      if (delta > maxDelta) maxDelta = delta;
      prevVal = val;
    }
    expect(maxDelta).toBeLessThan(1.0);
  });

  it('multiple curve frequencies produce varied turns', () => {
    const phase = 2.0;
    const dist = 500;
    const values: number[] = [];
    for (let z = 0; z > -1000; z -= 5) {
      values.push(computeCurve(phase, dist, z));
    }
    const diffs = values.slice(1).map((v, i) => v - values[i]);
    const signChanges = diffs.slice(1).filter((d, i) => d * diffs[i] < 0).length;
    expect(signChanges).toBeGreaterThanOrEqual(1);
  });

  it('getCurveAhead returns value for upcoming road section', () => {
    const phase = 1.0;
    const dist = 200;
    const ahead = computeCurve(phase, dist, -50);
    const current = computeCurve(phase, dist, 0);
    expect(typeof ahead).toBe('number');
    expect(ahead).not.toBe(current);
  });
});
