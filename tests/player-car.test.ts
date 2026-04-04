import { describe, it, expect } from 'vitest';

const ACCELERATION = 30;
const BRAKE_FORCE = 40;
const MAX_SPEED = 250;
const FRICTION = 5;
const STEER_SPEED = 5.0;
const MAX_STEER_ANGLE = 0.08;
const ROAD_HALF_WIDTH = 5.5;
const DRIFT_FACTOR = 0.12;
const OFF_ROAD_DECEL = 0.96;
const MAX_LANE_OFFSET = ROAD_HALF_WIDTH + 2;

function simulateCarUpdate(
  speed: number,
  steerAngle: number,
  laneOffset: number,
  dt: number,
  input: { accelerate: boolean; brake: boolean; steerLeft: boolean; steerRight: boolean },
  curveSlope = 0,
  curveOffset = 0,
) {
  if (input.accelerate) {
    speed += ACCELERATION * dt;
  } else if (input.brake) {
    speed -= BRAKE_FORCE * dt;
  } else {
    speed -= FRICTION * dt;
  }
  speed = Math.max(0, Math.min(MAX_SPEED, speed));

  if (input.steerLeft) {
    steerAngle -= STEER_SPEED * dt;
  } else if (input.steerRight) {
    steerAngle += STEER_SPEED * dt;
  } else {
    steerAngle *= 1 - 5 * dt;
  }
  steerAngle = Math.max(-MAX_STEER_ANGLE, Math.min(MAX_STEER_ANGLE, steerAngle));

  laneOffset += steerAngle * speed * dt;
  laneOffset += curveSlope * speed * DRIFT_FACTOR * dt;

  const offRoad = Math.abs(laneOffset) > ROAD_HALF_WIDTH;

  if (offRoad) {
    speed *= OFF_ROAD_DECEL;
  }

  laneOffset = Math.max(-MAX_LANE_OFFSET, Math.min(MAX_LANE_OFFSET, laneOffset));

  const lateralPosition = laneOffset + curveOffset;

  return { speed, steerAngle, laneOffset, lateralPosition, offRoad };
}

const noInput = { accelerate: false, brake: false, steerLeft: false, steerRight: false };

describe('PlayerCar physics', () => {
  it('car accelerates when given accelerate input', () => {
    const result = simulateCarUpdate(0, 0, 0, 0.016, { ...noInput, accelerate: true });
    expect(result.speed).toBeGreaterThan(0);
  });

  it('car brakes when given brake input', () => {
    const result = simulateCarUpdate(100, 0, 0, 0.016, { ...noInput, brake: true });
    expect(result.speed).toBeLessThan(100);
  });

  it('car decelerates with friction when no input', () => {
    const result = simulateCarUpdate(100, 0, 0, 0.016, noInput);
    expect(result.speed).toBeLessThan(100);
    expect(result.speed).toBeGreaterThan(0);
  });

  it('car does not exceed max speed', () => {
    let speed = 249;
    for (let i = 0; i < 100; i++) {
      const result = simulateCarUpdate(speed, 0, 0, 0.016, { ...noInput, accelerate: true });
      speed = result.speed;
    }
    expect(speed).toBeLessThanOrEqual(MAX_SPEED);
  });

  it('car lateral position changes with steering input', () => {
    let speed = 100;
    let steerAngle = 0;
    let laneOffset = 0;
    for (let i = 0; i < 60; i++) {
      const result = simulateCarUpdate(speed, steerAngle, laneOffset, 0.016, { ...noInput, accelerate: true, steerRight: true });
      speed = result.speed;
      steerAngle = result.steerAngle;
      laneOffset = result.laneOffset;
    }
    expect(laneOffset).toBeGreaterThan(0);
  });

  it('car drifts outward on curves without steering input', () => {
    let speed = 150;
    let steerAngle = 0;
    let laneOffset = 0;
    for (let i = 0; i < 60; i++) {
      const result = simulateCarUpdate(speed, steerAngle, laneOffset, 0.016, { ...noInput, accelerate: true }, 2.0);
      speed = result.speed;
      steerAngle = result.steerAngle;
      laneOffset = result.laneOffset;
    }
    expect(laneOffset).toBeGreaterThan(1.0);
  });

  it('counter-steering reduces drift compared to no input', () => {
    let speedA = 100, steerA = 0, offsetA = 0;
    let speedB = 100, steerB = 0, offsetB = 0;
    for (let i = 0; i < 20; i++) {
      const a = simulateCarUpdate(speedA, steerA, offsetA, 0.016, { ...noInput, accelerate: true }, 1.0);
      speedA = a.speed; steerA = a.steerAngle; offsetA = a.laneOffset;
      const b = simulateCarUpdate(speedB, steerB, offsetB, 0.016, { ...noInput, accelerate: true, steerLeft: true }, 1.0);
      speedB = b.speed; steerB = b.steerAngle; offsetB = b.laneOffset;
    }
    expect(Math.abs(offsetB)).toBeLessThan(Math.abs(offsetA));
  });

  it('steering significantly reduces drift on moderate curves', () => {
    let speedA = 100, steerA = 0, offsetA = 0;
    let speedB = 100, steerB = 0, offsetB = 0;
    for (let i = 0; i < 30; i++) {
      const a = simulateCarUpdate(speedA, steerA, offsetA, 0.016, { ...noInput, accelerate: true }, 0.5);
      speedA = a.speed; steerA = a.steerAngle; offsetA = a.laneOffset;
      const b = simulateCarUpdate(speedB, steerB, offsetB, 0.016, { ...noInput, accelerate: true, steerLeft: true }, 0.5);
      speedB = b.speed; steerB = b.steerAngle; offsetB = b.laneOffset;
    }
    expect(offsetB).toBeLessThan(offsetA * 0.5);
  });

  it('offRoad is true when laneOffset exceeds road width', () => {
    const result = simulateCarUpdate(100, 0, ROAD_HALF_WIDTH + 1, 0.016, noInput);
    expect(result.offRoad).toBe(true);
  });

  it('offRoad is false when on road', () => {
    const result = simulateCarUpdate(100, 0, 2.0, 0.016, noInput);
    expect(result.offRoad).toBe(false);
  });

  it('car decelerates when off-road', () => {
    const result = simulateCarUpdate(200, 0, ROAD_HALF_WIDTH + 1, 0.016, noInput);
    expect(result.speed).toBeLessThan(200 - FRICTION * 0.016);
  });

  it('car position includes road curve offset', () => {
    const curveOffset = 5.0;
    const laneOffset = 2.0;
    const result = simulateCarUpdate(100, 0, laneOffset, 0.016, noInput, 0, curveOffset);
    const expectedLane = laneOffset + 0 * 100 * DRIFT_FACTOR * 0.016;
    expect(result.lateralPosition).toBeCloseTo(expectedLane + curveOffset, 1);
  });

  it('drift force is proportional to speed', () => {
    const slowResult = simulateCarUpdate(50, 0, 0, 0.016, noInput, 2.0);
    const fastResult = simulateCarUpdate(200, 0, 0, 0.016, noInput, 2.0);
    expect(Math.abs(fastResult.laneOffset)).toBeGreaterThan(Math.abs(slowResult.laneOffset));
  });

  it('drift force is proportional to curve slope', () => {
    const gentleResult = simulateCarUpdate(150, 0, 0, 0.016, noInput, 1.0);
    const sharpResult = simulateCarUpdate(150, 0, 0, 0.016, noInput, 4.0);
    expect(Math.abs(sharpResult.laneOffset)).toBeGreaterThan(Math.abs(gentleResult.laneOffset));
  });

  it('car can go onto shoulder but is clamped', () => {
    let speed = 200;
    let steerAngle = 0;
    let laneOffset = 0;
    for (let i = 0; i < 2000; i++) {
      const result = simulateCarUpdate(speed, steerAngle, laneOffset, 0.016, { ...noInput, accelerate: true, steerRight: true });
      speed = result.speed;
      steerAngle = result.steerAngle;
      laneOffset = result.laneOffset;
    }
    expect(laneOffset).toBeLessThanOrEqual(MAX_LANE_OFFSET);
    expect(laneOffset).toBeGreaterThanOrEqual(-MAX_LANE_OFFSET);
  });
});
