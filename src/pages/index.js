import React, { Component } from 'react';
import * as tf from '@tensorflow/tfjs';

import * as ui from '../components/ui';
import { setup, capture } from '../components/webcam';
import '../components/styles.css';

import WebcamMessage from '../components/WebcamMessage/WebcamMessage';
import MobilenetMessage from '../components/MobilenetMessage/MobilenetMessage';
import Thumbnail from '../components/Thumbnail/Thumbnail';
import MockSite from '../components/MockSite/MockSite';

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
			enter: 0,
			lossValue: 0,
			isMenuOpen: true,
		}
		this.isPredicting = false;
		this.mobilenet = null;
		this.model = null;
		this.webcam = null;
		this.controls = ['up', 'down', 'left', 'right', 'center', 'enter'];
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

	train = async () => {
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
					units: this.controls.length,
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
		let hasCentered = false;
		this.setState({ isMenuOpen: false }, () => {
			const mainEl = document.getElementById('title');
			mainEl.focus();
			console.log(mainEl);
		});
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
			this.setState({
				activeThumbnail: this.controls[classId]
			});
			if (hasCentered === true && this.controls[classId] === 'down') {
				hasCentered = false;
				this.nextFocus();
			} else if (hasCentered === true && this.controls[classId] === 'up') {
				hasCentered = false;
				this.prevFocus();
			} else if (hasCentered === true && this.controls[classId] === 'enter') {
				hasCentered = false;
				this.pressButton();
			}

			else if (this.controls[classId] === 'center') {
				hasCentered = true;
			}
			await tf.nextFrame();
		}
	}

	pressButton() {
		const elem = document.activeElement;
		elem.click();
	}

	nextFocus() {
		var focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
		var focussable = Array.prototype.filter.call(document.querySelectorAll(focussableElements),
			function (element) {
				return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
			});
		var index = focussable.indexOf(document.activeElement);
		if(index < focussable.length - 1) {
			focussable[index + 1].focus();
		}
	}

	prevFocus() {
		var focussableElements = 'a:not([disabled]), button:not([disabled]), input[type=text]:not([disabled]), [tabindex]:not([disabled]):not([tabindex="-1"])';
		var focussable = Array.prototype.filter.call(document.querySelectorAll(focussableElements),
			function (element) {
				return element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement
			});
		var index = focussable.indexOf(document.activeElement);
		if(index > 0) {
			focussable[index - 1].focus();
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
		const direction = e.target.id;
		const key = this.controls.findIndex((item) => {
			return item === direction;
		});
		this.setState((state) => ({
			[direction]: state[direction] + 1
		}));
		ui.handler(key);
	}

	toggleMenu = () => {
		this.setState((state) => ({ isMenuOpen: !state.isMenuOpen }));
	}

	render() {
		const {
			isMobilenetLoading,
			isWebcamAvailable,
			lossValue,
			isMenuOpen,
			activeThumbnail
		} = this.state;
		return (
			<div>
				<button
					style={isMenuOpen ? this.menuActive : this.menuPassive}
					onClick={this.toggleMenu}>|||</button>
				{!isWebcamAvailable && <WebcamMessage />}
				{!!isMobilenetLoading && <MobilenetMessage />}
				<div style={isMenuOpen ? this.containerActive : this.containerPassive}>
					<div>
						{!!isMenuOpen &&
							<div>
								<h1 style={{ textAlign: 'center'}}>Navigation with TFJS</h1>
								<h2 style={{ textAlign: 'center'}}>by Mika Rehman</h2>
								<p style={{ textAlign: 'center'}}>git: <a href="https://github.com/Mikaayel/navigation-tfjs-prototype" target="_blank">https://github.com/Mikaayel/navigation-tfjs-prototype</a></p>
								<p style={{ textAlign: 'center'}}>linkedin: <a href="https://www.linkedin.com/in/mika-rehman/">https://www.linkedin.com/in/mika-rehman/</a></p>
								<p style={{ textAlign: 'center'}}>twitter: <a>@mikarehman</a></p>
								<div>
									<button
										style={this.buttonStyle}
										onClick={this.train}>TRAIN MODEL</button>
									<p>{parseFloat(lossValue).toFixed(5)}</p>
								</div>
								<button
									style={this.buttonStyle}
									onClick={this.predict}>PREDICT</button>
							</div>
						}
						<div>
							<div style={isMenuOpen ? this.webcamActive : this.webcamPassive}>
								<video
									style={isMenuOpen ? this.videoStyleActive : this.videoStylePassive}
									autoPlay
									playsInline
									muted
									id="webcam"
									width="224"
									height="224" />
							</div>
						</div>
						<div style={isMenuOpen ? this.thumbnailsContainerActive : this.thumbnailsContainerPassive}>
							{this.controls.map((item, index) => (
								<Thumbnail
									key={index}
									item={item}
									handleButtonClick={this.handleButtonClick}
									isMenuOpen={isMenuOpen}
									activeThumbnail={activeThumbnail}
									total={this.state[item]} />
							))}
						</div>
					</div>
					{
						!isMenuOpen && <MockSite direction={activeThumbnail} />
					}
				</div>

			</div >
		);
	}

	containerActive = {
		display: 'flex',
		flexDirection: 'column'
	};

	containerPassive = {
		display: 'flex',
	};

	thumbnailsContainerActive = {
		display: 'flex',
	};

	thumbnailsContainerPassive = {
		display: 'flex',
		flexDirection: 'column',
	};

	menuStyle = {
		width: '66px',
		height: '66px',
		fontSize: '30px',
	}

	menuActive = {
		...this.menuStyle,
		transform: 'rotate(90deg)',
	}

	menuPassive = {
		...this.menuStyle,
	}

	webcamStyle = {
		display: 'flex',
		justifyContent: 'flex-start',
		padding: '2px',
	}

	webcamActive = {
		...this.webcamStyle,
		width: '160px',
	};

	webcamPassive = {
		...this.webcamStyle,
		width: '66px',
	};

	videoStyle = {
		transform: 'scaleX(-1)',
	};

	videoStyleActive = {
		...this.videoStyle,
		height: '160px',
		width: '160px',
	};

	videoStylePassive = {
		...this.videoStyle,
		height: '66px',
		width: '66px',
	};

	rowStyle = {
		display: 'flex',
	};

	buttonStyle = {
		border: '1px solid orange',
		backgroundColor: 'orange',
		padding: '10px',
		margin: '2px',
		borderRadius: '5px',
		color: 'white',
	};
}

export default IndexPage
