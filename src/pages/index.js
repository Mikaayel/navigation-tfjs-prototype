import React, { Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import { ControllerDataset } from '../components/controller_dataset';
import * as ui from '../components/ui';
import { setup, capture } from '../components/webcam';
import '../components/styles.css';

import WebcamMessage from '../components/WebcamMessage/WebcamMessage';
import MobilenetMessage from '../components/MobilenetMessage/MobilenetMessage';

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
		this.controllerDataset = null;
		this.controls = ['up', 'down', 'left', 'right', 'center'];
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
		if (this.controllerDataset.xs == null) {
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
			Math.floor(this.controllerDataset.xs.shape[0] * 0.4);
		if (!(batchSize > 0)) {
			throw new Error(
				`Batch size is 0 or NaN. Please choose a non-zero fraction.`);
		}
		this.model.fit(this.controllerDataset.xs, this.controllerDataset.ys, {
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
		// this.webcam = new Webcam();
		this.controllerDataset = new ControllerDataset(5);

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

	componentDidMount() {
		this.init();
		ui.setExampleHandler(label => {
			tf.tidy(() => {
				const img = capture();
				this.controllerDataset.addExample(this.mobilenet.predict(img), label);
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
			up,
			down,
			left,
			right,
			center,
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
					<div>
						<div>
							<div style={this.thumbnailOuter}>
								<div style={this.thumbnailInner}>
									<canvas
										onClick={this.handleButtonClick}
										style={this.canvasStyle}
										width='224'
										height='224'
										id="up" />
								</div>
							</div>
							<p>{up} examples</p>
						</div>
						<div style={this.rowStyle}>
							<div>
								<div style={this.thumbnailOuter}>
									<div style={this.thumbnailInner}>
										<canvas
											onClick={this.handleButtonClick}
											style={this.canvasStyle}
											width='224'
											height='224'
											id="left" />
									</div>
								</div>
								<p>{left} examples</p>
							</div>
							<div>
								<div style={this.thumbnailOuter}>
									<div style={this.thumbnailInner}>
										<canvas
											onClick={this.handleButtonClick}
											style={this.canvasStyle}
											width='224'
											height='224'
											id="center" />
									</div>
								</div>
								<p>{center} examples</p>
							</div>
							<div>
								<div style={this.thumbnailOuter}>
									<div style={this.thumbnailInner}>
										<canvas
											onClick={this.handleButtonClick}
											style={this.canvasStyle}
											width='224'
											height='224'
											id="right" />
									</div>
								</div>
								<p>{right} examples</p>
							</div>
						</div>
						<div>
							<div>
								<div style={this.thumbnailOuter}>
									<div style={this.thumbnailInner}>
										<canvas
											onClick={this.handleButtonClick}
											style={this.canvasStyle}
											width='224'
											height='224'
											id="down" />
									</div>
								</div>
								<p>{down} examples</p>
							</div>
						</div>
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

	canvasStyle = {
		height: '66px',
		transform: 'scaleX(-1)',
	};

	rowStyle = {
		display: 'flex',
	};

	buttonStyle = {
		border: '1px solid red'
	};

	thumbnailOuter = {
		background: 'black',
		border: '1px solid #585858',
		borderRadius: '4px',
		boxSizing: 'border-box',
		display: 'inline-block',
		padding: '9px',
		position: 'relative',
		transition: 'box-shadow 0.3s',
	}

	thumbnailInner = {
		border: '1px solid #585858',
		borderRadius: '4px',
		boxSizing: 'border-box',
		display: 'flex',
		justifyContent: 'center',
		overflow: 'hidden',
		width: '66px'
	}

	thumbnailButton = {
		height: '100%',
		left: '0',
		position: 'absolute',
		top: '0',
		width: '100%'
	};
}

export default IndexPage
