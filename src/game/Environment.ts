import * as THREE from 'three';
import { Road } from './Road';

const TREE_COUNT = 80;
const POLE_COUNT = 30;
const ROAD_HALF_WIDTH = 7;
const OBJECT_SPREAD = 800;
const SIDE_MIN = 12;
const SIDE_MAX = 50;

export class Environment {
  readonly group: THREE.Group;
  private trees: THREE.Mesh[] = [];
  private poles: THREE.Mesh[] = [];
  private treeSides: number[] = [];
  private poleSides: number[] = [];
  private totalMoved = 0;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();

    const ambientLight = new THREE.AmbientLight(0x6688cc, 0.6);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(0xffeedd, 1.5);
    sun.position.set(30, 50, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    scene.add(sun);

    const groundGeo = new THREE.PlaneGeometry(2000, 2000);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.group.add(ground);

    this.createSky(scene);
    this.createMountains();
    this.createTrees();
    this.createPoles();
  }

  private createSky(scene: THREE.Scene): void {
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(0.3, '#1a1a4e');
    grad.addColorStop(0.5, '#2d4a7a');
    grad.addColorStop(0.7, '#5a8abf');
    grad.addColorStop(0.85, '#ff8844');
    grad.addColorStop(1, '#ffcc88');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.LinearFilter;
    scene.background = texture;
  }

  private createMountains(): void {
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x334455, flatShading: true });

    for (let i = 0; i < 15; i++) {
      const w = 40 + Math.random() * 60;
      const h = 15 + Math.random() * 30;
      const geo = new THREE.ConeGeometry(w, h, 4 + Math.floor(Math.random() * 3));
      const mountain = new THREE.Mesh(geo, mountainMat);
      const side = Math.random() > 0.5 ? 1 : -1;
      mountain.position.set(
        side * (80 + Math.random() * 200),
        h / 2 - 2,
        -200 - Math.random() * 500,
      );
      mountain.rotation.y = Math.random() * Math.PI;
      this.group.add(mountain);
    }
  }

  private createTrees(): void {
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 2, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x664422 });
    const leafGeo = new THREE.ConeGeometry(1.2, 3, 6);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x226622 });

    for (let i = 0; i < TREE_COUNT; i++) {
      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1;
      trunk.castShadow = true;
      tree.add(trunk);

      const leaves = new THREE.Mesh(leafGeo, leafMat);
      leaves.position.y = 3.2;
      leaves.castShadow = true;
      tree.add(leaves);

      const side = Math.random() > 0.5 ? 1 : -1;
      const sideDistance = SIDE_MIN + Math.random() * SIDE_MAX;
      tree.position.set(
        side * sideDistance,
        0,
        -Math.random() * OBJECT_SPREAD,
      );
      tree.scale.setScalar(0.8 + Math.random() * 0.8);

      const mesh = tree as unknown as THREE.Mesh;
      this.trees.push(mesh);
      this.treeSides.push(side * sideDistance);
      this.group.add(tree);
    }
  }

  private createPoles(): void {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.5 });

    for (let i = 0; i < POLE_COUNT; i++) {
      const poleGroup = new THREE.Group();

      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 4);
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 3;
      pole.castShadow = true;
      poleGroup.add(pole);

      const armGeo = new THREE.CylinderGeometry(0.04, 0.04, 2, 4);
      const arm = new THREE.Mesh(armGeo, poleMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(-1, 5.8, 0);
      poleGroup.add(arm);

      const lightGeo = new THREE.SphereGeometry(0.15, 6, 6);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
      const lampLight = new THREE.Mesh(lightGeo, lightMat);
      lampLight.position.set(-2, 5.8, 0);
      poleGroup.add(lampLight);

      const side = i % 2 === 0 ? -1 : 1;
      const sideDistance = ROAD_HALF_WIDTH + 4;
      poleGroup.position.set(
        side * sideDistance,
        0,
        -i * (OBJECT_SPREAD / POLE_COUNT),
      );
      if (side === 1) {
        poleGroup.scale.x = -1;
      }

      const mesh = poleGroup as unknown as THREE.Mesh;
      this.poles.push(mesh);
      this.poleSides.push(side * sideDistance);
      this.group.add(poleGroup);
    }
  }

  update(dt: number, speed: number, road?: Road): void {
    const move = speed * dt;
    this.totalMoved += move;

    for (let i = 0; i < this.trees.length; i++) {
      const tree = this.trees[i];
      tree.position.z += move;
      if (tree.position.z > 50) {
        tree.position.z -= OBJECT_SPREAD + 50;
        const side = Math.random() > 0.5 ? 1 : -1;
        const sideDistance = SIDE_MIN + Math.random() * SIDE_MAX;
        this.treeSides[i] = side * sideDistance;
      }
      const curveX = road ? road.getCurveOffset(tree.position.z) : 0;
      tree.position.x = this.treeSides[i] + curveX;
    }

    for (let i = 0; i < this.poles.length; i++) {
      const pole = this.poles[i];
      pole.position.z += move;
      if (pole.position.z > 50) {
        pole.position.z -= OBJECT_SPREAD + 50;
      }
      const curveX = road ? road.getCurveOffset(pole.position.z) : 0;
      pole.position.x = this.poleSides[i] + curveX;
    }
  }
}
