import * as THREE from 'three';
import { Input } from './Input';
import { Road } from './Road';

const ACCELERATION = 30;
const BRAKE_FORCE = 40;
const MAX_SPEED = 250;
const FRICTION = 5;
const STEER_SPEED = 3.5;
const MAX_STEER_ANGLE = 0.04;
const ROAD_HALF_WIDTH = 5.5;
const TILT_AMOUNT = 0.08;

export class PlayerCar {
  readonly group: THREE.Group;
  speed = 0;
  lateralPosition = 0;
  private steerAngle = 0;
  private readonly bodyMesh: THREE.Mesh;
  private laneOffset = 0;

  constructor() {
    this.group = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.8, 0.5, 4);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff2200, metalness: 0.6, roughness: 0.3 });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.5;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    const cabinGeo = new THREE.BoxGeometry(1.4, 0.45, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x222244, metalness: 0.8, roughness: 0.1 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.95, -0.3);
    cabin.castShadow = true;
    this.group.add(cabin);

    const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 8);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wheelPositions: [number, number, number][] = [
      [-0.9, 0.25, 1.3],
      [0.9, 0.25, 1.3],
      [-0.9, 0.25, -1.3],
      [0.9, 0.25, -1.3],
    ];
    for (const pos of wheelPositions) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(...pos);
      wheel.castShadow = true;
      this.group.add(wheel);
    }

    const tailLightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const tailLightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
    const leftTail = new THREE.Mesh(tailLightGeo, tailLightMat);
    leftTail.position.set(-0.6, 0.55, 2.0);
    this.group.add(leftTail);
    const rightTail = new THREE.Mesh(tailLightGeo, tailLightMat);
    rightTail.position.set(0.6, 0.55, 2.0);
    this.group.add(rightTail);

    const headLightGeo = new THREE.BoxGeometry(0.35, 0.15, 0.05);
    const headLightMat = new THREE.MeshStandardMaterial({ color: 0xffffcc, emissive: 0xffffcc, emissiveIntensity: 0.8 });
    const leftHead = new THREE.Mesh(headLightGeo, headLightMat);
    leftHead.position.set(-0.6, 0.55, -2.0);
    this.group.add(leftHead);
    const rightHead = new THREE.Mesh(headLightGeo, headLightMat);
    rightHead.position.set(0.6, 0.55, -2.0);
    this.group.add(rightHead);

    this.group.position.y = 0;
  }

  update(dt: number, input: Input, road?: Road): void {
    if (input.accelerate) {
      this.speed += ACCELERATION * dt;
    } else if (input.brake) {
      this.speed -= BRAKE_FORCE * dt;
    } else {
      this.speed -= FRICTION * dt;
    }

    this.speed = Math.max(0, Math.min(MAX_SPEED, this.speed));

    const speedFactor = this.speed / MAX_SPEED;

    if (input.steerLeft) {
      this.steerAngle -= STEER_SPEED * dt;
    } else if (input.steerRight) {
      this.steerAngle += STEER_SPEED * dt;
    } else {
      this.steerAngle *= 1 - 5 * dt;
    }

    this.steerAngle = Math.max(-MAX_STEER_ANGLE, Math.min(MAX_STEER_ANGLE, this.steerAngle));

    this.laneOffset += this.steerAngle * this.speed * dt;
    this.laneOffset = Math.max(-ROAD_HALF_WIDTH, Math.min(ROAD_HALF_WIDTH, this.laneOffset));

    const curveOffset = road ? road.getCurveOffset(0) : 0;
    this.lateralPosition = this.laneOffset + curveOffset;

    this.group.position.x = this.lateralPosition;

    const curveSlope = road ? road.getCurveSlope(0) : 0;
    this.group.rotation.z = -this.steerAngle * TILT_AMOUNT * this.speed;
    this.group.rotation.y = -this.steerAngle * 0.5 - Math.atan(curveSlope) * 0.3;

    this.bodyMesh.position.y = 0.5 + Math.sin(Date.now() * 0.01 * speedFactor) * 0.01 * speedFactor;
  }

  get speedKmh(): number {
    return Math.round(this.speed * 3.6);
  }

  get gear(): number {
    if (this.speed < 1) return 0;
    if (this.speed < 20) return 1;
    if (this.speed < 45) return 2;
    if (this.speed < 75) return 3;
    if (this.speed < 120) return 4;
    if (this.speed < 180) return 5;
    return 6;
  }
}
