import * as tf from '@tensorflow/tfjs';

export function setupStream() {
	return new Promise((resolve, reject) => {
		// navigator is a system class which holds information about the user agent
		if (navigator.mediaDevices) {
			const options = {
				video: {
					height: 224,
					width: 224
				},
				// video: true,
				audio: false
			}
			navigator.mediaDevices.getUserMedia(options)
				.then(stream => {
					const video = document.getElementById('video');
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

export function takePhoto(e) {
	const img = document.getElementById(e.target.id);
	const video = document.getElementById('video');
	const canvas = document.getElementById('canvas');

	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;

	canvas.getContext('2d').drawImage(video, 0, 0);
	img.src = canvas.toDataURL('image/webp');

	const webcamImageTensor = tf.fromPixels(canvas);
	console.log(webcamImageTensor);
	const croppedImage = cropImage(webcamImageTensor);
	const batchedImage = croppedImage.expandDims(0);
	return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
}

function cropImage(img) {
    const size = Math.min(img.shape[0], img.shape[1]);
    const centerHeight = img.shape[0] / 2;
    const beginHeight = centerHeight - (size / 2);
    const centerWidth = img.shape[1] / 2;
    const beginWidth = centerWidth - (size / 2);
    return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
  }