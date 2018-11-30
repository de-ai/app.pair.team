
import React, { Component } from 'react';
import './ArtboardTreeItem.css';

class ArtboardTreeItem extends Component {
	constructor(props) {
		super(props);

		this.state = {
			title : this.props.title
		};
	}

	componentDidMount() {
	}

	static getDerivedStateFromProps(nextProps) {
		return ({ title : (nextProps.title.length > 24) ? (nextProps.title.substring(0, 23) + '…') : nextProps.title });
	}

	render() {
		const textClass = (this.props.selected) ? 'artboard-tree-item-text page-tree-item-text-selected' : 'artboard-tree-item-text';

		return (
			<div className="artboard-tree-item">
				<div className={textClass} onClick={()=> this.props.onClick()}>{this.state.title}</div>
			</div>
		);
	}
}

export default ArtboardTreeItem;