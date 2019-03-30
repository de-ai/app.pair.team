
import React, { Component } from 'react';
import './SetupModal.css';

import axios from 'axios';
import qs from 'qs';
import FontAwesome from 'react-fontawesome';
import { Column, Row } from 'simple-flexbox';

import BaseOverlay from '../BaseOverlay';
import { API_ENDPT_URL } from '../../../../consts/uris';
import { URLs } from '../../../../utils/lang';
import { trackEvent } from '../../../../utils/tracking';
import integrationItems from '../../../../assets/json/integration-items';
import sourceItems from '../../../../assets/json/design-source-items';


const SetupModalGrid = (props)=> {
// 	console.log('SetupModal.SetupModalGrid()', props);

	const { items } = props;
	return (<div className="setup-modal-grid">
		<Row horizontal="center" className="setup-modal-grid-item-wrapper" style={{ flexWrap : 'wrap' }}>
			{items.map((item, i) => {
				return (<Column key={i}>
					<SetupModalGridItem
						title={item.title}
						image={item.filename}
						selected={item.selected}
						onClick={()=> props.onClick(item)} />
				</Column>);
			})}
		</Row>
	</div>);
};


const SetupModalGridItem = (props)=> {
// 	console.log('SetupModal.SetupModalGridItem()', props);

	const { title, image, selected } = props;
	return (<div className={`setup-modal-grid-item${(selected) ? ' setup-modal-grid-item-selected' : ''}`} onClick={()=> props.onClick()}>
		<img className="setup-modal-grid-item-image" src={image} alt={title} />
		<div className="setup-modal-grid-item-overlay" />
		<div className="setup-modal-grid-item-title-wrapper">
			<div className="setup-modal-grid-item-title">{title}</div>
		</div>
		<div className={`setup-modal-grid-item-selected-icon${(selected) ? ' setup-modal-grid-item-selected-icon-visible' : ''}`}><FontAwesome name="check-circle" size="2x" /></div>
	</div>);
};


class SetupModal extends Component {
	constructor(props) {
		super(props);

		this.state = {
			step       : 0,
			gridItems  :[[], []],
			outro      : false,
			submitting : false
		};
	}

	componentDidMount() {
// 		console.log('SetupModal.componentDidMount()', this.props, this.state);

		const { profile } = this.props;
		const gridItems = this.state.gridItems.map((_, i)=> {
			const items = (i === 0) ? sourceItems : integrationItems;
			return (items.map((item)=> (Object.assign({}, item, {
				selected : ((i === 0) ? profile.sources.includes(item.id) : profile.integrations.includes(item.id))
			}))));
		});

		this.setState({ gridItems });
	}

	handleIntegrationItemClick = (integration)=> {
// 		console.log('SetupModal.handleIntegrationItemClick()', integration);

		integration.selected = !integration.selected;
		const gridItems = this.state.gridItems.map((items, i)=> ((i === 1) ? items.map((item)=> ((item.id === integration.id) ? integration : item)) : items));
		this.setState({ gridItems });
	};

	handleSourceItemClick = (source)=> {
// 		console.log('SetupModal.handleSourceItemClick()', source);

		source.selected = !source.selected;
		const gridItems = this.state.gridItems.map((items, i)=> ((i === 0) ? items.map((item)=> ((item.id === source.id) ? source : item)) : items));
		this.setState({ gridItems });
	};

	handleComplete = (submitted)=> {
// 		console.log('SetupModal.handleComplete()', submitted);

		this.setState({ outro : false }, ()=> {
			if (submitted) {
				this.props.onSubmitted();

			} else {
				this.props.onComplete();
			}
		});
	};

	handleNextStep = ()=> {
// 		console.log('SetupModal.handleNextStep()');

		trackEvent('button', 'next');
		this.setState({ step : 1 });
	};

	handlePrevStep = ()=> {
// 		console.log('SetupModal.handlePrevStep()');

		trackEvent('button', 'prev');
		this.setState({ step : 0 });
	};

	handleSkipStep = ()=> {
		console.log('SetupModal.handlePrevStep()');

		trackEvent('button', 'skip');
		this.setState({
			step      : 1,
			gridItems : this.state.gridItems.map((items, i)=> ((i === 0) ? items.map((item)=> (Object.assign({}, item, {
				selected : false
			}))) : items))
		});
	};

	handleSubmit = ()=> {
// 		console.log('SetupModal.handleSubmit()');

		const { profile } = this.props;
		const { gridItems } = this.state;

		this.setState({ submitting : true }, ()=> {
			axios.post(API_ENDPT_URL, qs.stringify({
				action       : 'UPDATE_INTEGRATIONS',
				user_id      : profile.id,
				sources      : [...gridItems].shift().filter((item)=> (item.selected)).map((item)=> (item.id)).join(','),
				integrations : [...gridItems].pop().filter((item)=> (item.selected)).map((item)=> (item.id)).join(',')
			})).then((response) => {
				console.log('UPDATE_INTEGRATIONS', response.data);

				trackEvent('setup', 'success');
				this.setState({ submitting : false });
				this.handleComplete(true);
			}).catch((error)=> {
			});
		});
	};

	render() {
// 		console.log('SetupModal.render()', this.props, this.state);

		const { step, gridItems, outro } = this.state;
		const title = (step === 0) ? 'What design tools is your team using?' : 'What development frameworks is your team using?';
// 		const selectedItems = gridItems[step].filter((item)=> (item.selected));

		return (
			<BaseOverlay
				tracking={`setup/${URLs.firstComponent()}`}
				delay={0}
				outro={outro}
				unblurred={true}
				closeable={true}
				defaultButton={null}
				title={null}
				onComplete={this.handleComplete}>

				<div className="setup-modal-wrapper">
					<div className="setup-modal-header">
						<h1 className="full-width">{title}</h1>
					</div>
					<div className="setup-modal-content-wrapper">
						<SetupModalGrid
							items={gridItems[step]}
							onClick={(item)=> (step === 0) ? this.handleSourceItemClick(item) : this.handleIntegrationItemClick(item)}
						/>

						{(step === 0)
							? (<div className="setup-modal-button-wrapper">
									<button className="adjacent-button" onClick={()=> { trackEvent('button', 'cancel'); this.setState({ outro : true }); }}>Cancel</button>
									<button onClick={()=> this.handleNextStep()}>Next</button>
								</div>)
							: (<div className="setup-modal-button-wrapper">
									<button className="adjacent-button" onClick={()=> this.handlePrevStep()}>Back</button>
									<button onClick={()=> this.handleSubmit()}>Save</button>
								</div>)
						}
					</div>
				</div>
			</BaseOverlay>);
	}
}

export default SetupModal;
