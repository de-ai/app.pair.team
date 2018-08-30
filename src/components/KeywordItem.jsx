
import React, { Component } from 'react';
import './KeywordItem.css';

import axios from "axios/index";

import AIStatus from './elements/AIStatus';

class KeywordItem extends Component {
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

	showStatus(coords, content) {
		let self = this;
		let status = {
			isVisible : true,
			content : content,
			coords : coords,
		};
		this.setState({ status : status });

		setTimeout(function() {
			let status = {
				isVisible : false,
				content   : '',
				coords    : {
					x : 0,
					y : 0
				},
			};
			self.setState({ status : status });
		}, 3125);
	}

	handleClick() {
		let self = this;
		const isSelected = !this.state.isSelected;
		this.setState({ isSelected : isSelected });
		this.props.onClick(isSelected);

		if (isSelected) {
			this.showStatus({x:2.125, y:0}, 'Loading…');
			axios.get('http://192.241.197.211/aws.php?action=COMPREHEND&phrase=' + this.props.title)
				.then((response)=> {
					console.log("COMPREHEND", JSON.stringify(response.data));
					self.showStatus({x:0, y:0}, 'Sentiment: ' + response.data.comprehend.sentiment.outcome);
				}).catch((error) => {
			});
		}
	}

	render() {
		const className = (this.state.isSelected) ? 'keyword-item keyword-item-selected' : 'keyword-item';
		const marginOffset = (this.divWrapper) ? (this.divWrapper.clientWidth < 200) ? (200 - this.divWrapper.clientWidth) * -0.5 : (this.divWrapper.clientWidth - 200) * 0.5 : 0;
		if (this.divWrapper && this.state.isSelected) console.log(this.divWrapper.clientWidth, marginOffset);

		return (
			<div onClick={()=> this.handleClick()} className={className} ref={(element)=> { this.divWrapper = element; }}>
				{this.state.status.isVisible && (
					<div className="ai-status-wrapper" style={{marginLeft:marginOffset + 'px'}}>
						<AIStatus content={this.state.status.content} coords={this.state.status.coords} />
					</div>
				)}
				<span className="keyword-item-text">{this.props.title}</span>
			</div>
		);
	}
}

export default KeywordItem;
