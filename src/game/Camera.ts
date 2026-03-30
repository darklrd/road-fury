import * as THREE from 'three';
import { PlayerCar } from './PlayerCar';

const CAM_DISTANCE = 10;
const CAM_HEIGHT = 4.5;
const LERP_SPEED = 3;
const LATERAL_OFFSET_FACTOR = 0.3;
const SHAKE_INTENSITY = 0.015;

export class Camera {
  readonly camera: THREE.PerspectiveCamera;
  private targetPosition = new THREE.Vector3();

  constructor() {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(0, CAM_HEIGHT, CAM_DISTANCE);
    this.camera.lookAt(0, 1, 0);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  update(dt: number, car: PlayerCar): void {
    const speedRatio = car.speed / 250;

    this.targetPosition.set(
      car.lateralPosition * LATERAL_OFFSET_FACTOR,
      CAM_HEIGHT - speedRatio * 0.5,
      CAM_DISTANCE + speedRatio * 2,
    );

    this.camera.position.lerp(this.targetPosition, LERP_SPEED * dt);

    if (car.speed > 50) {
      const shake = speedRatio * SHAKE_INTENSITY;
      this.camera.position.x += (Math.random() - 0.5) * shake;
      this.camera.position.y += (Math.random() - 0.5) * shake * 0.5;
    }

    const lookTarget = new THREE.Vector3(
      car.lateralPosition * 0.5,
      1,
      -15 - speedRatio * 10,
    );
    this.camera.lookAt(lookTarget);

    this.camera.fov = 75 + speedRatio * 15;
    this.camera.updateProjectionMatrix();
  }
}
