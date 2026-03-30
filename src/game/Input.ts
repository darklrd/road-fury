export class Input {
  private keys = new Set<string>();
  private _anyKeyPressed = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this._anyKeyPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
  }

  get anyKeyPressed(): boolean {
    return this._anyKeyPressed;
  }

  get accelerate(): boolean {
    return this.keys.has('KeyW') || this.keys.has('ArrowUp');
  }

  get brake(): boolean {
    return this.keys.has('KeyS') || this.keys.has('ArrowDown');
  }

  get steerLeft(): boolean {
    return this.keys.has('KeyA') || this.keys.has('ArrowLeft');
  }

  get steerRight(): boolean {
    return this.keys.has('KeyD') || this.keys.has('ArrowRight');
  }
}
