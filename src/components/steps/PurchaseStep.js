
import React, { Component } from 'react';
import './PurchaseStep.css';

import { Column, Row } from 'simple-flexbox';

import TemplateItem from '../TemplateItem';

class PurchaseStep extends Component {
	constructor(props) {
		super(props);

		this.state = {
			selectedItems : this.props.selectedItems,
			allItems      : this.props.selectedItems
		};
	}

	handleClick(id, isSelected) {
		console.log("handleClick("+id+", "+isSelected+")");

// 		let self = this;
		let selectedItems = this.state.selectedItems.slice();

		if (isSelected) {
			this.state.allItems.forEach(function(item, i) {
				if (item.id === id) {

					let isFound = false;
					selectedItems.forEach(function(itm, j) {
						if (itm.id === id) {
							isFound = true;
						}
					});

					if (!isFound) {
						selectedItems.push(item);
					}
				}
			});

		} else {
			selectedItems.forEach(function(item, i) {
				if (item.id === id) {
					selectedItems.splice(i, 1);
				}
			});
		}

		this.setState({ selectedItems : selectedItems });
		this.props.onItemToggle(selectedItems);
	}

	onNext() {
		if (this.state.selectedItems.length > 0) {
			this.props.onClick(this.selectedItems);
		}
	}

	render() {
// 		console.log("render() "+JSON.stringify(this.state));
		const items = this.state.allItems.map((item, i, arr) => {
			return (
				<Column key={i}>
					<TemplateItem handleClick={(isSelected)=> this.handleClick(item.id, isSelected)} image={item.filename} title={(i+1)} price={'1.99'} selected={true} />
				</Column>
			);
		});

		const btnClass = (this.state.selectedItems.length > 0) ? 'action-button full-button' : 'action-button full-button disabled-button';

		return (
			<Row vertical="start">
				<Column flexGrow={1} horizontal="center">
					<div className="step-header-text">Confirm your design purchase</div>
					<div className="step-text">Confirm the designs you have selected below.</div>
					<button className={btnClass} onClick={()=> this.onNext()}>Confirm Purchase</button>
					<div className="step-text">By clicking &ldquo;Confirm Purchase&rdquo; I agree to Design Engine AI’s Terms of Service.</div>
					<div className="purchase-item-wrapper">
						<Row horizontal="center" style={{flexWrap:'wrap'}}>
							{items}
						</Row>
					</div>
				</Column>
			</Row>
		);
	}
}

export default PurchaseStep;
