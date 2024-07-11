class ObjectOnCanvas {
  constructor(scale, x, y) {
    this.scale = scale;
    this.position = {
      x: ObjectOnCanvas.#clampXY(x),
      y: ObjectOnCanvas.#clampXY(y),
    };
  }

  get x() {
    return this.position["x"];
  }

  set x(value) {
    this.position["x"] = ObjectOnCanvas.#clampXY(value);
  }

  get y() {
    return this.position["y"];
  }

  set y(value) {
    this.position["y"] = ObjectOnCanvas.#clampXY(value);
  }

  static #clampXY(value) {
    if (value > this.scale) value = this.scale;
    if (value < 0) value = 0;
    return value;
  }
}

export class VortexCannon extends ObjectOnCanvas {
  constructor(scale, spawnCallback) {
    super(scale, scale / 2, scale / 2);
    this.spawnVortex = spawnCallback;
  }

  moveDown() {
    this.y++;
  }

  moveUp() {
    this.y--;
  }

  moveLeft() {
    this.x--;
  }

  moveRight() {
    this.x++;
  }

  spawnPositive() {
    this.positive = true;
    this.spawnVortex(this);
  }

  spawnNegative() {
    this.positive = false;
    this.spawnVortex(this);
  }
}

export class VortexPair extends VortexCannon {
  constructor(scale, spawnCallback, getPair) {
    super(scale, scale / 2, scale / 4);
    this.spawnVortex = spawnCallback;
    this.getSettings = getPair;
    this.active = false;
    this.rotation = 180;
  }

  rotate(clockwise) {
    let angle = this.rotation;
    if (clockwise) {
      angle++;
    } else {
      angle--;
    }

    if (angle > 360) angle = 0;
    if (angle < 0) angle = 360;
    this.rotation = angle;
  }

  clockwise() {
    this.rotate(true);
  }

  counterClockwise() {
    this.rotate(false);
  }

  calcOffsets(r) {
    const { x: cx, y: cy } = this.position;
    const angle = this.rotation * (Math.PI / 180);
    const dx = r * Math.cos(angle);
    const dy = r * Math.sin(angle);
    return { a: { x: cx + dx, y: cy + dy }, b: { x: cx - dx, y: cy - dy } };
  }

  spawnPair() {
    if (!this.active) {
      this.active = true;
      const settings = this.getSettings();
      const { a, b } = this.calcOffsets(settings.x * 100);
      this.spawnVortex({ a, b });
      setTimeout(() => {
        this.active = false;
      }, settings.delay);
    }
  }
}
