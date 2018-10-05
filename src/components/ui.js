import * as tf from '@tensorflow/tfjs';

const CONTROLS = ['up', 'down', 'left', 'right', 'center'];

export let addExampleHandler;

export function setExampleHandler(handler) {
	addExampleHandler = handler;
}

export async function handler(label) {
	addExampleHandler(label);
	await tf.nextFrame();
}

export function drawThumb(img, label) {
	const canvas = document.getElementById(CONTROLS[label]);
	draw(img, canvas);
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