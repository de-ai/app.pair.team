
import React, { Component } from 'react';
import './CornerType.css';

import AIStatus from './elements/AIStatus';


class CornerType extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isSelected : false,
			status : {
				isVisible : false,
				content   : '',
				coords    : {
					x : 0,
					y : 0
				}
			}
		};

		this.divWrapper = null;
	}

	showStatus(delay, content) {
		let self = this;
		this.setState({
			status : {
				isVisible : true,
				content : content,
				delay : delay,
			}
		});

		setTimeout(function() {
			let status = {
				isVisible : false,
				content   : '',
				delay     : 0,
			};
			self.setState({ status : status });
		}, 2125);
	}

	handleClick() {
		const isSelected = !this.state.isSelected;
		this.setState({ isSelected : isSelected });
		this.props.onClick(isSelected);

		if (isSelected) {
			this.showStatus(1.125, (this.props.amount < 4) ? 'Sentiment: Negative' : (this.props.amount < 20) ? 'Sentiment: Neutral' : 'Sentiment: Positive');
		}
	}

	render() {
// 		const style = { borderRadius : this.props.amount + 'px' };
		const className = (this.state.isSelected) ? 'corner-type corner-type-selected' : 'corner-type';
		const marginOffset = (this.divWrapper) ? (this.divWrapper.clientWidth < 200) ? (this.divWrapper.clientWidth * -0.5) + ((200 - this.divWrapper.clientWidth) * -0.5) : (this.divWrapper.clientWidth * -0.5) + ((this.divWrapper.clientWidth - 200) * 0.5) : 0;
		if (this.divWrapper && this.state.isSelected) console.log(this.divWrapper.clientWidth, marginOffset);

		return (
			<div onClick={()=> this.handleClick()} className={className} ref={(element)=> { this.divWrapper = element; }}>
				{this.state.status.isVisible && (
					<div className="ai-status-wrapper" style={{marginLeft:marginOffset + 'px'}}>
						<AIStatus content={this.state.status.content} delay={this.state.status.delay} />
					</div>
				)}
				<span className="corner-type-text">{this.props.title}px</span>
			</div>
		);
	}
}

export default CornerType;
