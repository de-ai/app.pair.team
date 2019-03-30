
import React, { Component } from 'react';
import './AlertDialog.css'

import BaseOverlay from '../BaseOverlay';
import { URLs } from '../../../../utils/lang';


class AlertDialog extends Component {
	constructor(props) {
		super(props);
		this.state = {
			outro : false
		};
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
		return (<BaseOverlay
			tracking={`${tracking}/${URLs.firstComponent()}`}
			outro={false}
			closeable={true}
			defaultButton="OK"
			title={title}
			onComplete={this.props.onComplete}>
			<div className="alert-dialog-content">{message}</div>
		</BaseOverlay>);
	}
}

export default AlertDialog;
