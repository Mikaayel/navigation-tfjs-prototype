import * as tf from '@tensorflow/tfjs';

export class Webcam {

	constructor(webcamElement) {
		this.webcamElement = webcamElement;
	}
	capture() {
		return tf.tidy(() => {
			const webcamImage = tf.fromPixels(this.webcamElement);
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

	adjustVideoSize(width, height) {
		const aspectRatio = width / height;
		if (width >= height) {
			this.webcamElement.width = aspectRatio * this.webcamElement.height;
		} else if (width < height) {
			this.webcamElement.height = this.webcamElement.width / aspectRatio;
		}
	}

	async setup() {
		return new Promise((resolve, reject) => {
			if (navigator.mediaDevices) {
				const options = {
					video: {
						height: 224,
						width: 224
					},
					audio: false
				}
				navigator.mediaDevices.getUserMedia(options)
					.then(stream => {
						const video = document.getElementById('webcam');
						video.srcObject = stream;
						resolve();
					})
					.catch(error => {
						reject(error);
					});
			}
			else {
				reject('webcam not available');
			}
		});
	}
}
