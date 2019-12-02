
import React, { Component } from 'react';
import './BaseOverlay.css';

import { TimelineMax, Back } from 'gsap/TweenMax';
import onClickOutside from 'react-onclickoutside';

import { trackOverlay } from '../../../utils/tracking';

import { OVERLAY_TYPE_FIXED_SIZE, OVERLAY_TYPE_PERCENT_SIZE } from './';


const INTRO_DURATION = (1/8);
const OUTRO_DURATION = (1/4);


class BaseOverlay extends Component {
	constructor(props) {
		super(props);

		this.state = {
			outro : false
		};

		this.wrapper = null;
	}

	componentDidMount() {
// 		console.log('%s.componentDidMount()', this.constructor.name, this.props, this.state);

		const { tracking } = this.props;
		trackOverlay(`open${tracking}`);

		this.timeline = new TimelineMax();
		this.timeline.from(this.wrapper, INTRO_DURATION, {
			opacity : 0.25,
			scale   : 0.9,
			ease    : Back.easeOut,
			delay   : (this.props.delay || 0) * 0.001
		});
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
// 		console.log('%s.componentDidUpdate()', this.constructor.name, prevProps, this.props, this.state);

		if (prevProps.outro !== this.props.outro && this.props.outro) {
			this.setState({ outro : true });
		}

		if (this.state.outro) {
			this.setState({ outro : false });
			const { onComplete } = this.props;

			this.timeline = new TimelineMax();
			this.timeline.to(this.wrapper, OUTRO_DURATION, {
				scale      : 0.9,
				opacity    : 0,
				ease       : Back.easeIn,
				onComplete : onComplete
			});
		}
	}

	componentWillUnmount() {
// 		console.log('%s.componentWillUnmount()', this.constructor.name);
		const { tracking } = this.props;
		trackOverlay(`close${tracking}`);

		this.timeline = null;
	}

	handleClickOutside(event) {
		const { closeable } = this.props;
		if (closeable) {
			this.setState({ outro : true });
		}
	}

	handleClose = ()=> {
// 		console.log('%s.handleClose()', this.constructor.name, this.props);
		this.setState({ outro : true });
	};

	render() {
// 		console.log('%s.render()', this.constructor.name, this.props, this.state, this.timeline);

		if (this.wrapper && this.timeline && this.timeline.time === 0) {
			this.timeline.seek(0);
		}

		const { type, size, title, closeable, children } = this.props;
		const wrapperClass = `base-overlay-content-wrapper base-overlay-content-wrapper${(type === OVERLAY_TYPE_FIXED_SIZE) ? '-fixed' : (type === OVERLAY_TYPE_PERCENT_SIZE) ? '-percent' : '-auto-scroll'}`;
		const wrapperStyle = (type === OVERLAY_TYPE_FIXED_SIZE) ? {
			width  : size.width,
			height : size.height
		} : null;


		return (<div className={`base-overlay${(!closeable) ? ' base-overlay-blocking' : ''}`} onClick={(closeable) ? this.handleClose : null} ref={(element)=> { this.wrapper = element; }}>
			<div className={wrapperClass} style={wrapperStyle} onClick={(event)=> event.stopPropagation()}>
				{(title) && (<div className="base-overlay-header-wrapper">
					<div className="base-overlay-title">{title}</div>
				</div>)}
				<div className="base-overlay-content">{children}</div>
			</div>
		</div>);
	}
}


export default onClickOutside(BaseOverlay);
