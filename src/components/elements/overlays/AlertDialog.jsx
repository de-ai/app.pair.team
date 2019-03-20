
import React, { Component } from 'react';
import './AlertDialog.css'

import ContentModal from './ContentModal';
import { URLs } from '../../../utils/lang';


class AlertDialog extends Component {
	constructor(props) {
		super(props);
		this.state = {
			outro : false
		};

		this.wrapper = null;
	}

	componentDidMount() {
// 		console.log('AlertDialog.componentDidMount()', this.props, this.state);
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
// 		console.log('AlertDialog.componentDidUpdate()', prevProps, this.props, prevState, this.state, snapshot);
	}

	render() {
// 		console.log('AlertDialog.render()', this.props, this.state);

		const { tracking, title, message } = this.props;
		return (
			<div className="alert-dialog-wrapper" ref={(element)=> { this.wrapper = element; }}>
				<ContentModal
					tracking={`${tracking}/${URLs.firstComponent()}`}
					outro={false}
					closeable={true}
					defaultButton="OK"
					title={title}
					onComplete={this.props.onComplete}>
					{message}
				</ContentModal>
			</div>
		);
	}
}

export default AlertDialog;
