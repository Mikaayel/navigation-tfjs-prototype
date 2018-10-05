import * as tf from '@tensorflow/tfjs';

export class Webcam {

	// constructor(webcamElement) {
	// 	this.webcamElement = webcamElement;
	// }

	capture() {
		return tf.tidy(() => {
			const video = document.getElementById('webcam');
			const webcamImage = tf.fromPixels(video);
			const croppedImage = this.cropImage(webcamImage);
			const batchedImage = croppedImage.expandDims(0);
			return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
		});
	}
	cropImage(img) {
		const size = Math.min(img.shape[0], img.shape[1]);
		const centerHeight = img.shape[0] / 2;
		const beginHeight = centerHeight - (size / 2);
		const centerWidth = img.shape[1] / 2;
		const beginWidth = centerWidth - (size / 2);
		return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
	}
}
