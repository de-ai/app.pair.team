
import React, { Component } from 'react';
import './AIStatus.css';

import { TimelineLite, Power1 } from "gsap/TweenMax";

class AIStatus extends Component {
	constructor(props) {
		super(props);
		this.state = {
		};

		this.contentWrapper = null;
		this.tail1Wrapper = null;
		this.tail2Wrapper = null;
		this.tail3Wrapper = null;
		this.timeline = null;
	}

	componentDidMount() {
		this.timeline = new TimelineLite();

		this.timeline.staggerTo([this.contentWrapper, this.tail1Wrapper, this.tail2Wrapper, this.tail3Wrapper], 0.5, {
			y       : '-25px',
			opacity : 0,
			ease    : Power1.easeIn,
			delay   : this.props.delay
		}, 0.1);
		this.timeline.play();
	}

	componentWillUnmount() {
		this.timeline = null;
	}

	render() {
		const style = {
		};

		return (
			<div className="ai-status" style={style}>
				<div className="ai-status-tail ai-status-tail-3" ref={div=> this.tail3Wrapper = div} />
				<div className="ai-status-tail ai-status-tail-2" ref={div=> this.tail2Wrapper = div} />
				<div className="ai-status-tail ai-status-tail-1" ref={div=> this.tail1Wrapper = div} />
				<div className="ai-status-main" ref={div=> this.contentWrapper = div}>
					<div className="ai-status-text">{this.props.content}</div>
				</div>
			</div>
		);
	}
}

export default AIStatus;
