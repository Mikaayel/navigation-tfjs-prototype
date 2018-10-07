import React from 'react';

const containerStyle = {
	position: 'relative',
};

const thumbnailInner = {
	background: 'black',
	boxSizing: 'border-box',
	display: 'flex',
	justifyContent: 'center',
	overflow: 'hidden',
	width: '66px',
}

const canvasStyle = {
	height: '66px',
	transform: 'scaleX(-1)',
};

const overlayStyle = {
	position: 'absolute',
	width: '66px',
    height: '66px',
	top: '0',
	pointerEvents: 'none',
};

const overlayStyleActive = {
	...overlayStyle,
	backgroundColor: 'rgba(255, 255, 0, .5)',
}

const overlayStylePassive = {
	...overlayStyle,
}

const Thumbnail = ({ item, handleButtonClick, isMenuOpen, activeThumbnail }) => (
	<div style={containerStyle}>
		<div style={thumbnailInner}>
			<canvas
				onClick={handleButtonClick}
				style={canvasStyle}
				width='224'
				height='224'
				id={item} />
		</div>
		<div style={activeThumbnail === item ? overlayStyleActive: overlayStylePassive}></div>
		{ isMenuOpen && <p>{item}</p> }
	</div>
);

export default Thumbnail;