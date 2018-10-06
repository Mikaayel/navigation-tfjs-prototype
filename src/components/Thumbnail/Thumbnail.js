import React from 'react';

const thumbnailOuter = {
	background: 'black',
	border: '1px solid #585858',
	borderRadius: '4px',
	boxSizing: 'border-box',
	display: 'inline-block',
	padding: '9px',
	position: 'relative',
	transition: 'box-shadow 0.3s',
}

const thumbnailInner = {
	border: '1px solid #585858',
	borderRadius: '4px',
	boxSizing: 'border-box',
	display: 'flex',
	justifyContent: 'center',
	overflow: 'hidden',
	width: '66px'
}

const canvasStyle = {
	height: '66px',
	transform: 'scaleX(-1)',
};

const Thumbnail = ({ item, handleButtonClick}) => (
	<div>
		<div style={thumbnailOuter}>
			<div style={thumbnailInner}>
				<canvas
					onClick={handleButtonClick}
					style={canvasStyle}
					width='224'
					height='224'
					id={item} />
			</div>
		</div>
		<p>{item} examples</p>
	</div>
);

export default Thumbnail;