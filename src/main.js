import GPE from './gpe.js';
import VortexCannon from './vortex.js';

const canvasElem = document.getElementById('GPE');

let isDragging = false;
let isLeftDown = false;
let isRightDown = false;
let ttc;
const keysDepressed = [];

const gpe = new GPE(canvasElem);
const vc = new VortexCannon(gpe.scale, gpe.spawnVortex.bind(this));

const getPosition = (e) => {
	return {
		x: (event.offsetX != null) ? event.offsetX : event.originalEvent.layerX,
		y: (event.offsetY != null) ? event.offsetY : event.originalEvent.layerY,
	};
};

// Disable default right click menu on canvas item        
canvasElem.addEventListener('contextmenu', function() {
	event.preventDefault();
	return false;
});	

// Take note of mouse click time and type
canvasElem.addEventListener('mousedown', (event) => {
	isDragging = false;
	ttc = Date.now();
	isLeftDown = event.button === 0;
	isRightDown = event.button === 2;
});

// Handle inserting potental object on click-and-drag
canvasElem.addEventListener('mousemove', (event) => {
	isDragging = (Date.now() - ttc) > 100;
	if(isLeftDown && isDragging){
		gpe.addObstacle({ position: getPosition(event) });
	}
});

// Handle injecting positive vortex on left click and negative vortex on right click
canvasElem.addEventListener('mouseup', (event) => {
	gpe.removeObstacle();
	if (!isDragging && (isLeftDown || isRightDown)) {
		gpe.spawnVortex({ positive: isLeftDown, position: getPosition(event) });
	}
	isLeftDown = isRightDown = isDragging = false;
});

document.addEventListener("keydown", (event) => {
	event.preventDefault();
	if (!keysDepressed.includes(event.key))
		keysDepressed.push(event.key);
	
});

document.addEventListener("keyup", (event) => {
	event.preventDefault();
	while (keysDepressed.includes(event.key))
		keysDepressed.splice(keysDepressed.indexOf(event.key), 1);
	
});

window.addEventListener("resize", (event) => {
   gpe.resize();
}, true);

const handleKeys = () => {
	const vortexCannon = vc;

	keysDepressed.forEach((key) => {
		switch (key) {
			case 'z':
				vortexCannon.spawnPositive();
				break;
			case 'x':
				vortexCannon.spawnNegative();
				break;
			case "ArrowDown":
				vortexCannon.moveDown()
				break;
			case "ArrowUp":
				vortexCannon.moveUp()
				break;
			case "ArrowLeft":
				vortexCannon.moveLeft()
				break;
			case "ArrowRight":
				vortexCannon.moveRight()
				break;
			case " ":
				if (!vortexPair.active) {
					vortexPair.active = true;
					this.spawnVortex(vortexPair.x, vortexPair.y, false);
					// 10ms seems to the minimum time to reliably update the shader
					setTimeout(() => {
						this.spawnVortex(vortexPair.x, vortexPair.y, true);
					}, 10);
					setTimeout(() => {
						vortexPair.active = false;
					}, vortexPair['delay']);
				}
				break;
			default:
				return;
		}
	});
	requestAnimationFrame(handleKeys.bind(this));
}

gpe.stepAndDraw();
handleKeys();