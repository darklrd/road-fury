export class HUD {
  private speedEl: HTMLElement;
  private barEl: HTMLElement;
  private gearEl: HTMLElement;

  constructor() {
    this.speedEl = document.getElementById('speed-value')!;
    this.barEl = document.getElementById('speed-bar')!;
    this.gearEl = document.getElementById('gear')!;
  }

  update(speedKmh: number, gear: number, maxSpeed: number): void {
    this.speedEl.textContent = String(speedKmh);
    this.barEl.style.width = `${Math.min(100, (speedKmh / maxSpeed) * 100)}%`;

    if (gear === 0) {
      this.gearEl.textContent = 'N';
    } else {
      this.gearEl.textContent = `G${gear}`;
    }
  }
}
