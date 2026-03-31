import { describe, it, expect } from 'vitest';

const ACCELERATION = 30;
const BRAKE_FORCE = 40;
const MAX_SPEED = 250;
const FRICTION = 5;
const STEER_SPEED = 3.5;
const MAX_STEER_ANGLE = 0.04;
const ROAD_HALF_WIDTH = 5.5;

function simulateCarUpdate(
  speed: number,
  steerAngle: number,
  laneOffset: number,
  dt: number,
  input: { accelerate: boolean; brake: boolean; steerLeft: boolean; steerRight: boolean },
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
  laneOffset = Math.max(-ROAD_HALF_WIDTH, Math.min(ROAD_HALF_WIDTH, laneOffset));

  return { speed, steerAngle, laneOffset };
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

  it('car stays within road bounds', () => {
    let speed = 200;
    let steerAngle = 0;
    let laneOffset = 0;
    for (let i = 0; i < 1000; i++) {
      const result = simulateCarUpdate(speed, steerAngle, laneOffset, 0.016, { ...noInput, accelerate: true, steerRight: true });
      speed = result.speed;
      steerAngle = result.steerAngle;
      laneOffset = result.laneOffset;
    }
    expect(laneOffset).toBeLessThanOrEqual(ROAD_HALF_WIDTH);
    expect(laneOffset).toBeGreaterThanOrEqual(-ROAD_HALF_WIDTH);
  });
});
