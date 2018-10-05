import * as tf from '@tensorflow/tfjs';

const CONTROLS = ['up', 'down', 'left', 'right', 'center'];

const statusElement = document.getElementById('status');
const trainStatusElement = document.getElementById('train-status');

// console.log(statusElement);

// export function init() {
// 	document.getElementById('controller').style.display = '';
// 	statusElement.style.display = 'none';
// }

export function predictClass(classId) {
	document.body.setAttribute('data-active', CONTROLS[classId]);
}

// export function isPredicting() {
// 	statusElement.style.visibility = 'visible';
// }

// export function donePredicting() {
// 	statusElement.style.visibility = 'hidden';
// }

export function trainStatus(status) {
	trainStatusElement.innerText = status;
}

export let addExampleHandler;
export function setExampleHandler(handler) {
	addExampleHandler = handler;
}
let mouseDown = false;
const totals = [0, 0, 0, 0, 0];

// const upButton = document.getElementById('up');
// const downButton = document.getElementById('down');
// const leftButton = document.getElementById('left');
// const rightButton = document.getElementById('right');
// const centerButton = document.getElementById('center');

// console.log(upButton);

const thumbDisplayed = {};

export async function handler(label) {
	// mouseDown = true;
	// const className = CONTROLS[label];
	// const button = document.getElementById(className);
	// const total = document.getElementById(className + '-total');
	// while (mouseDown) {

		addExampleHandler(label);

		// document.body.setAttribute('data-active', CONTROLS[label]);
		// total.innerText = totals[label]++;
		await tf.nextFrame();
	// }
	// document.body.removeAttribute('data-active');
}

// upButton.addEventListener('mousedown', () => handler(0));
// upButton.addEventListener('mouseup', () => mouseDown = false);

// downButton.addEventListener('mousedown', () => handler(1));
// downButton.addEventListener('mouseup', () => mouseDown = false);

// leftButton.addEventListener('mousedown', () => handler(2));
// leftButton.addEventListener('mouseup', () => mouseDown = false);

// rightButton.addEventListener('mousedown', () => handler(3));
// rightButton.addEventListener('mouseup', () => mouseDown = false);

// centerButton.addEventListener('mousedown', () => handler(4));
// centerButton.addEventListener('mouseup', () => mouseDown = false);

export function drawThumb(img, label) {
	if (thumbDisplayed[label] == null) {
		const thumbCanvas = document.getElementById(CONTROLS[label] + '-thumb');
		draw(img, thumbCanvas);
	}
}

export function draw(image, canvas) {
	const [width, height] = [224, 224];
	const ctx = canvas.getContext('2d');
	const imageData = new ImageData(width, height);
	const data = image.dataSync();
	for (let i = 0; i < height * width; ++i) {
		const j = i * 4;
		imageData.data[j + 0] = (data[i * 3 + 0] + 1) * 127;
		imageData.data[j + 1] = (data[i * 3 + 1] + 1) * 127;
		imageData.data[j + 2] = (data[i * 3 + 2] + 1) * 127;
		imageData.data[j + 3] = 255;
	}
	ctx.putImageData(imageData, 0, 0);
}
