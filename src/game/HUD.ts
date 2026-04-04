export class HUD {
  private speedEl: HTMLElement;
  private barEl: HTMLElement;
  private gearEl: HTMLElement;
  private warningEl: HTMLElement;

  constructor() {
    this.speedEl = document.getElementById('speed-value')!;
    this.barEl = document.getElementById('speed-bar')!;
    this.gearEl = document.getElementById('gear')!;

    this.warningEl = document.createElement('div');
    this.warningEl.id = 'off-road-warning';
    this.warningEl.textContent = '⚠ OFF ROAD';
    this.warningEl.style.cssText =
      'display:none;font-size:28px;font-weight:900;color:#ff2200;' +
      'text-shadow:0 0 12px rgba(255,34,0,0.8);margin-bottom:8px;' +
      'animation:pulse 0.4s ease-in-out infinite';
    const hud = document.getElementById('hud');
    if (hud) {
      hud.insertBefore(this.warningEl, hud.firstChild);
    }
  }

  update(speedKmh: number, gear: number, maxSpeed: number, offRoad = false): void {
    this.speedEl.textContent = String(speedKmh);
    this.barEl.style.width = `${Math.min(100, (speedKmh / maxSpeed) * 100)}%`;

    if (gear === 0) {
      this.gearEl.textContent = 'N';
    } else {
      this.gearEl.textContent = `G${gear}`;
    }

    this.warningEl.style.display = offRoad ? 'block' : 'none';
    this.speedEl.style.color = offRoad ? '#ff2200' : '#fff';
  }
}
