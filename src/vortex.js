class ObjectOnCanvas {
	position;
	scale;
	
	constructor(scale, x ,y) {
		this.scale = scale;
		this.position = {
			x: ObjectOnCanvas.#clampXY(x),
			y: ObjectOnCanvas.#clampXY(y)
		};
	}
	
	get x() {
		return this.position['x'];
	}
	
	set x(value) {
		this.position['x'] = ObjectOnCanvas.#clampXY(value);
	}
	
	get y() {
		return this.position['y'];
	}
	
	set y(value) {
		this.position['y'] = ObjectOnCanvas.#clampXY(value);
	}
	
	static #clampXY(value) {
		if (value > this.scale) value = this.scale;
		if (value < 0) value = 0;
		return value;
	}
}	

export default class VortexCannon extends ObjectOnCanvas {
	constructor(scale, spawnCallback) {
		super(scale, scale/2, scale/2);
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