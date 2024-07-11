import GPE from "./src/gpe.js";
import { VortexCannon, VortexPair } from "./src/vortex.js";

const canvasElem = document.getElementById("GPE");

let isDragging = false;
let isLeftDown = false;
let isRightDown = false;
let ttc;
const keysDepressed = [];

const gpe = new GPE(canvasElem);
const vortexCannon = new VortexCannon(gpe.scale, gpe.spawnVortex.bind(this));
const vortexPair = new VortexPair(gpe.scale, gpe.spawnVortexPair.bind(this), gpe.getPair);

const getPosition = (e) => {
  return {
    x: event.offsetX != null ? event.offsetX : event.originalEvent.layerX,
    y: event.offsetY != null ? event.offsetY : event.originalEvent.layerY,
  };
};

// Disable default right click menu on canvas item
canvasElem.addEventListener("contextmenu", function () {
  event.preventDefault();
  return false;
});

// Take note of mouse click time and type
canvasElem.addEventListener("mousedown", (event) => {
  isDragging = false;
  ttc = Date.now();
  isLeftDown = event.button === 0;
  isRightDown = event.button === 2;
});

// Handle inserting potental object on click-and-drag
canvasElem.addEventListener("mousemove", (event) => {
  isDragging = Date.now() - ttc > 100;
  if (isLeftDown && isDragging) {
    gpe.addObstacle({ position: getPosition(event) });
  }
});

// Handle injecting positive vortex on left click and negative vortex on right click
canvasElem.addEventListener("mouseup", (event) => {
  gpe.removeObstacle();
  if (!isDragging && (isLeftDown || isRightDown)) {
    gpe.spawnVortex({ positive: isLeftDown, position: getPosition(event) });
  }
  isLeftDown = isRightDown = isDragging = false;
});

document.addEventListener("keydown", (event) => {
  event.preventDefault();
  if (!keysDepressed.includes(event.key)) keysDepressed.push(event.key);
});

document.addEventListener("keyup", (event) => {
  event.preventDefault();
  while (keysDepressed.includes(event.key))
    keysDepressed.splice(keysDepressed.indexOf(event.key), 1);
});

window.addEventListener(
  "resize",
  (event) => {
    gpe.resize();
  },
  true
);

const handleKeys = () => {
  keysDepressed.forEach((key) => {
    switch (key) {
      case "z":
        vortexCannon.spawnPositive();
        break;
      case "x":
        vortexCannon.spawnNegative();
        break;
      case "ArrowDown":
        vortexCannon.moveDown();
        break;
      case "ArrowUp":
        vortexCannon.moveUp();
        break;
      case "ArrowLeft":
        vortexCannon.moveLeft();
        break;
      case "ArrowRight":
        vortexCannon.moveRight();
        break;
      case "s":
        vortexPair.moveDown();
        break;
      case "w":
        vortexPair.moveUp();
        break;
      case "a":
        vortexPair.moveLeft();
        break;
      case "d":
        vortexPair.moveRight();
        break;
      case "q":
        vortexPair.counterClockwise();
        break;
      case "e":
        vortexPair.clockwise();
        break;
      case " ":
        vortexPair.spawnPair();
        break;
      default:
        return;
    }
  });
  requestAnimationFrame(handleKeys.bind(this));
};

gpe.stepAndDraw();
handleKeys();
