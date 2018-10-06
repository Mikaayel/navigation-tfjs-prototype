import React, { Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import * as ui from '../components/ui';
import { setup, capture } from '../components/webcam';
import '../components/styles.css';

import WebcamMessage from '../components/WebcamMessage/WebcamMessage';
import MobilenetMessage from '../components/MobilenetMessage/MobilenetMessage';
import Thumbnail from '../components/Thumbnail/Thumbnail';

class IndexPage extends Component {
	constructor() {
		super();
		this.state = {
			isMobilenetLoading: true,
			isWebcamAvailable: true,
			up: 0,
			down: 0,
			left: 0,
			right: 0,
			center: 0,
			lossValue: 0,
		}
		this.isPredicting = false;
		this.mobilenet = null;
		this.model = null;
		this.webcam = null;
		this.controls = ['up', 'down', 'left', 'right', 'center'];
		this.xs = null;
		this.ys = null;
	}
	loadMobilenet = async () => {
		const mobilenet = await tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
		const layer = mobilenet.getLayer('conv_pw_13_relu');
		this.setState({
			isMobilenetLoading: false,
		});
		return tf.model({ inputs: mobilenet.inputs, outputs: layer.output });
	}

	async train() {
		await tf.nextFrame();
		if (this.xs == null) {
			throw new Error('Add some examples before training!');
		}
		this.model = tf.sequential({
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

		const optimizer = tf.train.adam(0.0001);
		this.model.compile({ optimizer: optimizer, loss: 'categoricalCrossentropy' });
		const batchSize =
			Math.floor(this.xs.shape[0] * 0.4);
		if (!(batchSize > 0)) {
			throw new Error(
				`Batch size is 0 or NaN. Please choose a non-zero fraction.`);
		}
		this.model.fit(this.xs, this.ys, {
			batchSize,
			epochs: 20,
			callbacks: {
				onBatchEnd: async (batch, logs) => {
					this.setState({
						lossValue: logs.loss.toFixed(5)
					});
				}
			}
		});
	}

	predict = async () => {
		this.isPredicting = true;
		while (this.isPredicting) {
			const predictedClass = tf.tidy(() => {
				const img = capture();
				const activation = this.mobilenet.predict(img);
				const predictions = this.model.predict(activation);
				return predictions.as1D().argMax();
			});

			const classId = (await predictedClass.data())[0];
			predictedClass.dispose();

			const CONTROLS = ['up', 'down', 'left', 'right', 'center'];
			console.log(CONTROLS[classId]);
			await tf.nextFrame();
		}
	}

	init = async () => {
		try {
			await setup();
			this.mobilenet = await this.loadMobilenet();
			tf.tidy(() => this.mobilenet.predict(capture()));
		}
		catch (err) {
			this.setState({
				isWebcamAvailable: false
			});
			console.log('error')
		}
	}

	addExample = (example, label) => {
		const y = tf.tidy(
			() => tf.oneHot(tf.tensor1d([label]).toInt(), this.controls.length));

		if (this.xs == null) {
			this.xs = tf.keep(example);
			this.ys = tf.keep(y);
		} else {
			const oldX = this.xs;
			this.xs = tf.keep(oldX.concat(example, 0));

			const oldY = this.ys;
			this.ys = tf.keep(oldY.concat(y, 0));

			oldX.dispose();
			oldY.dispose();
			y.dispose();
		}
	}

	componentDidMount() {
		this.init();
		ui.setExampleHandler(label => {
			tf.tidy(() => {
				const img = capture();
				this.addExample(this.mobilenet.predict(img), label);
				ui.drawThumb(img, label);
			});
		});
	}

	handleButtonClick = (e) => {
		const key = this.controls.findIndex((item) => {
			return item === e.target.id;
		});
		ui.handler(key);
	}

	render() {
		const {
			isMobilenetLoading,
			isWebcamAvailable,
			lossValue,
		} = this.state;
		return (
			<div>
				<h1>Direction</h1>
				{!isWebcamAvailable && <WebcamMessage />}
				{!!isMobilenetLoading && <MobilenetMessage />}
				<div id="controller">
					<div>
						<div>
							<div>
								<button style={this.buttonStyle} onClick={() => {
									this.train();
								}}>TRAIN MODEL</button>
								<p>{parseFloat(lossValue).toFixed(5)}</p>
							</div>
							<button style={this.buttonStyle} onClick={this.predict}>PREDICT</button>
						</div>
						<div>
							<div style={this.webcamOuter}>
								<div style={this.webcamInner}>
									<video style={this.videoStyle} autoPlay playsInline muted id="webcam" width="224" height="224"></video>
								</div>
							</div>
						</div>
					</div>
					<div style={{ display: 'flex' }}>
						{this.controls.map((item, index) => <Thumbnail key={index} item={item} handleButtonClick={this.handleButtonClick} />)}
					</div>
				</div>
			</div >
		);
	}
	webcamOuter = {
		background: 'black',
		border: '1px solid #585858',
		borderRadius: '4px',
		boxSizing: 'border-box',
		display: 'inline-block',
		padding: '9px',
	};

	webcamInner = {
		borderRadius: '4px',
		border: '1px solid #585858',
		boxSizing: 'border-box',
		display: 'flex',
		justifyContent: 'center',
		overflow: 'hidden',
		width: '160px',
	};

	videoStyle = {
		height: '160px',
		transform: 'scaleX(-1)',
	};

	rowStyle = {
		display: 'flex',
	};

	buttonStyle = {
		border: '1px solid red'
	};
}

export default IndexPage
