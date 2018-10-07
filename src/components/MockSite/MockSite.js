import React, { Component } from 'react';

class MockSite extends Component {
	constructor() {
		super();
		this.state = {
			contentArray: ['no site is complete without a slider', 'Tensorflowjs in the browser. OMG!', 'ok, thats all I got.'],
			currentItem: 0,
			showEnd: false,
		}
	}
	componentDidUpdate(prevProps) {
		const {direction} = this.props;
		if(prevProps.direction !== direction) {
			if(direction === 'left') {
				this.setState((state) => {
					if(state.currentItem === 0) {
						return {
							currentItem: state.contentArray.length - 1
						};
					} else {
						return {
							currentItem: state.currentItem - 1
						}
					}
				});
			}
			else if (direction === 'right') {
				this.setState((state) => {
					if(state.currentItem === state.contentArray.length - 1) {
						return {
							currentItem: 0
						}
					} else {
						return {
							currentItem: state.currentItem + 1
						}
					}
				});
			}
		}
	}

	handleButtonPress = () => {
		this.setState({
			showEnd: true
		});
	}

	render() {
		const { contentArray, currentItem, showEnd } = this.state;
		return (
			<div style={{ padding: '20px' }}>
				<main>
					<header>
						<h1 id="title" tabIndex="0">Super awesome javascript hipster website</h1>
						<h2 tabIndex="0">Become a 10x developer with unicorn juice</h2>
					</header>
					<article>
						<h2 tabIndex="0">Do you even javascript?</h2>
						<ul>
							<li tabIndex="0">tabs are for winners, spaces suck</li>
							<li tabIndex="0">typescript is for the less adventurous</li>
							<li tabIndex="0">tell your team everyday about your uber cool framework on npm</li>
							<li tabIndex="0">why use plain javascript when you can use 4 libraries</li>

						</ul>
					</article>
					<article>
						<div className="slideshow" tabIndex="0" style={{
							width: '100%',
							border: '1px solid grey',
							height: '200px',
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							fontSize: '30px',
							position: 'relative',
						}}>
							<p style={{ margin: '0'}}>
								<span style={{position: 'absolute', left: '0', fontSize: '50px'}}>&lt;</span>
									{ contentArray[currentItem] }
								<span style={{position: 'absolute', right: '0', fontSize: '50px'}}>&gt;</span>
							</p>
						</div>
						<button onClick={this.handleButtonPress} style={{

							background: 'orange',
							padding: '10px',
							borderRadius: '5px',
						}} tabIndex="0">press this button right now, god dammit</button>
						{ !!showEnd && (
							<div>
								<h2>WOOOOOOOOOOO!</h2>
								<p>You nulled it!</p>
							</div>
						)}
					</article>
				</main>
			</div>
		)
	}
}

export default MockSite;