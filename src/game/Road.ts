import * as THREE from 'three';

const SEGMENT_LENGTH = 20;
const ROAD_WIDTH = 14;
const SEGMENTS_VISIBLE = 50;
const LANE_COUNT = 3;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;
const DASH_LENGTH = 3;
const DASH_GAP = 3;

export class Road {
  readonly group: THREE.Group;
  private totalDistance = 0;
  private curvePhase = 0;
  private segmentGroups: THREE.Group[] = [];
  private segmentBaseZ: number[] = [];

  constructor() {
    this.group = new THREE.Group();

    for (let i = 0; i < SEGMENTS_VISIBLE; i++) {
      const segZ = -i * SEGMENT_LENGTH;
      const seg = this.buildSegment();
      seg.position.z = segZ;
      this.group.add(seg);
      this.segmentGroups.push(seg);
      this.segmentBaseZ.push(segZ);
    }
  }

  private buildSegment(): THREE.Group {
    const seg = new THREE.Group();

    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, SEGMENT_LENGTH);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.7, metalness: 0.1 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.receiveShadow = true;
    seg.add(road);

    const shoulderMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    for (const side of [-1, 1]) {
      const shoulderGeo = new THREE.PlaneGeometry(3, SEGMENT_LENGTH);
      const shoulder = new THREE.Mesh(shoulderGeo, shoulderMat);
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.position.set(side * (ROAD_WIDTH / 2 + 1.5), 0.005, 0);
      shoulder.receiveShadow = true;
      seg.add(shoulder);
    }

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let lane = 1; lane < LANE_COUNT; lane++) {
      const x = -ROAD_WIDTH / 2 + lane * LANE_WIDTH;
      for (let d = 0; d < SEGMENT_LENGTH; d += DASH_LENGTH + DASH_GAP) {
        const dashGeo = new THREE.PlaneGeometry(0.15, DASH_LENGTH);
        const dash = new THREE.Mesh(dashGeo, lineMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(x, 0.02, d - SEGMENT_LENGTH / 2 + DASH_LENGTH / 2);
        seg.add(dash);
      }
    }

    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    for (const side of [-1, 1]) {
      const edgeGeo = new THREE.PlaneGeometry(0.2, SEGMENT_LENGTH);
      const edge = new THREE.Mesh(edgeGeo, edgeMat);
      edge.rotation.x = -Math.PI / 2;
      edge.position.set(side * ROAD_WIDTH / 2, 0.02, 0);
      seg.add(edge);
    }

    const barrierMat = new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.4, roughness: 0.5 });
    for (const side of [-1, 1]) {
      const bGeo = new THREE.BoxGeometry(0.3, 0.7, SEGMENT_LENGTH);
      const barrier = new THREE.Mesh(bGeo, barrierMat);
      barrier.position.set(side * (ROAD_WIDTH / 2 + 3.3), 0.35, 0);
      barrier.castShadow = true;
      seg.add(barrier);
    }

    return seg;
  }

  update(dt: number, speed: number): void {
    const move = speed * dt;
    this.totalDistance += move;
    this.curvePhase += move * 0.002;

    const totalLength = SEGMENTS_VISIBLE * SEGMENT_LENGTH;

    for (let i = 0; i < this.segmentGroups.length; i++) {
      this.segmentBaseZ[i] += move;

      if (this.segmentBaseZ[i] > SEGMENT_LENGTH * 3) {
        this.segmentBaseZ[i] -= totalLength;
      }

      const z = this.segmentBaseZ[i];
      const curve = this.getCurveAt(z);

      this.segmentGroups[i].position.z = z;
      this.segmentGroups[i].position.x = curve;
    }
  }

  getCurveAt(z: number): number {
    const d = -z + this.totalDistance;
    return Math.sin(this.curvePhase + d * 0.004) * 6 +
      Math.sin(this.curvePhase * 1.3 + d * 0.002) * 3;
  }

  getCurveAhead(): number {
    return this.getCurveAt(-50);
  }

  get distance(): number {
    return this.totalDistance;
  }
}
