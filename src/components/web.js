export function setup() {
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