import React, { Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import { setupStream, takePhoto } from '../webcam';

class IndexPage extends Component {
	constructor() {
		super();
		this.setupStream = setupStream;
		this.takePhoto = takePhoto;
		this.handleClick = this.handleClick.bind(this);
		this.mobilenet = null;
	}

	async main() {
		try {
			await this.setupStream();
			this.mobilenet = await this.loadMobilenet();
			console.log('mobilenet loaded');
		}
		catch (error) {
			console.log('reporting error in main', error);
		}
	}

	async loadMobilenet() {
		const mobilenet = await tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
		const layer = mobilenet.getLayer('conv_pw_13_relu');
		return tf.model({ inputs: mobilenet.inputs, outputs: layer.output });
	}

	async handleClick(e) {
		const img = this.takePhoto(e);
		// console.log(img);
		const predictedClass = tf.tidy(() => {
			const activation = this.mobilenet.predict(img);
			const predictions = this.model.predict(activation);
			return predictions.as1D().argMax();
		});

		const classId = (await predictedClass.data())[0];
		predictedClass.dispose();
		console.log('class', classId);
		await tf.nextFrame();
	}

	model = tf.sequential({
		layers: [
			tf.layers.flatten({ inputShape: [7, 7, 256] }),
			tf.layers.dense({
				units: 100,
				activation: 'relu',
				kernelInitializer: 'varianceScaling',
				useBias: true
			}),
			tf.layers.dense({
				units: 5,
				kernelInitializer: 'varianceScaling',
				useBias: false,
				activation: 'softmax'
			})
		]
	});

	componentDidMount() {
		this.main();
	}

	render() {
		const containerStyle = {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center'
		}

		const rowStyle = {
			padding: 0,
			margin: 0,
			display: 'flex',
		}

		const videoStyle = {
			height: '112px',
			width: '112px',
			margin: 0,
			display: 'block',
		}

		const imageStyle = {
			height: '112px',
			width: '112px',
			backgroundColor: 'grey',
			margin: 0,
			padding: 0,
			display: 'block',
		}



		return (
			<div style={containerStyle}>
				<h1>Setting Up</h1>
				<canvas id="canvas" style={{ display: 'none' }} />
				<div style={rowStyle}>
					<img
						onClick={this.handleClick}
						style={imageStyle}
						id="img-top" />
				</div>
				<div style={rowStyle}>
					<img
						onClick={this.handleClick}
						style={imageStyle}
						id="img-left" />
					<img
						onClick={this.handleClick}
						style={imageStyle}
						id="img-center" />
					<img
						onClick={this.handleClick}
						style={imageStyle}
						id="img-right" />
				</div>
				<div style={rowStyle}>
					<img
						onClick={this.handleClick}
						style={imageStyle}
						id="img-bottom" />
				</div>
				<video style={videoStyle} autoPlay id="video" />
			</div>
		);
	}
}

export default IndexPage
