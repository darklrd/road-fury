import * as THREE from 'three';
import { Input } from './Input';
import { PlayerCar } from './PlayerCar';
import { Road } from './Road';
import { Camera } from './Camera';
import { HUD } from './HUD';
import { Environment } from './Environment';

const MAX_SPEED_KMH = 900;

export class Game {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private input: Input;
  private car: PlayerCar;
  private road: Road;
  private cam: Camera;
  private hud: HUD;
  private env: Environment;
  private started = false;
  private lastTime = 0;
  private startScreen: HTMLElement;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x2d4a7a, 100, 600);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    document.body.appendChild(this.renderer.domElement);

    this.input = new Input();
    this.car = new PlayerCar();
    this.road = new Road();
    this.cam = new Camera();
    this.hud = new HUD();
    this.env = new Environment(this.scene);

    this.scene.add(this.road.group);
    this.scene.add(this.car.group);
    this.scene.add(this.env.group);

    this.startScreen = document.getElementById('start-screen')!;

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  start(): void {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop = (time: number): void => {
    requestAnimationFrame(this.loop);

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (!this.started) {
      if (this.input.anyKeyPressed) {
        this.started = true;
        this.startScreen.style.display = 'none';
      }
      this.renderer.render(this.scene, this.cam.camera);
      return;
    }

    this.car.update(dt, this.input, this.road);
    this.road.update(dt, this.car.speed);
    this.env.update(dt, this.car.speed, this.road);
    this.cam.update(dt, this.car);
    this.hud.update(this.car.speedKmh, this.car.gear, MAX_SPEED_KMH);

    this.renderer.render(this.scene, this.cam.camera);
  };
}
