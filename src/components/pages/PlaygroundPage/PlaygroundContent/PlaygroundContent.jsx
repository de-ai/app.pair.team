
import React, { Component } from 'react';
import './PlaygroundContent.css';

import { ContextMenuTrigger } from 'react-contextmenu';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';

import PlaygroundComment from '../PlaygroundComment';
import ComponentMenu from './ComponentMenu';
import { convertStyles, inlineStyles } from '../utils/css';
import packComponents, { calcSize } from '../utils/packing';
import { reformComment } from '../utils/reform';


class PlaygroundContent extends Component {
	constructor(props) {
		super(props);

		this.state = {
			position : null,
			popover  : false
		};
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
// 		console.log('%s.componentDidUpdate()', this.constructor.name, prevProps, this.props, prevState, this.state);

// 		if (this.props.comment && !prevProps.comment) {
// 			this.setState({ popover : true });
// 		}
	}

	handleComponentPopoverClose = ()=> {
// 		console.log('%s.handleComponentPopoverClose()', this.constructor.name);
		this.setState({ popover : false }, ()=> {
			this.props.onPopoverClose();
		});
	};

	handleContentClick = (event, component)=> {
// 		console.log('%s.handleContentClick()', this.constructor.name, { boundingRect : event.target }, { clientX : event.clientX, clientY : event.clientY }, component);
		console.log('%s.handleContentClick()', this.constructor.name, component);

		const { cursor } = this.props;
		if (cursor) {
			const position = {
				x : event.clientX - event.target.getBoundingClientRect().left,
				y : event.clientY - event.target.getBoundingClientRect().top,
			};

			this.setState({ position,
				popover : true
			});
		}

		this.props.onComponentClick({ component });
	};

	render() {
// 		console.log('%s.render()', this.constructor.name, this.props, this.state);

		const { typeGroup, playground, component, cursor, mouse, profile } = this.props;
		const { position, popover } = this.state;

		const components = (component) ? [component] : (typeGroup) ? playground.components.filter(({ typeID })=> (typeID === typeGroup.id)) : playground.components;
		const packedRects = (playground) ? packComponents(components) : [];

		const maxSize = calcSize(packedRects);
		const wrapperStyle = {
			width  : `${maxSize.width}px`,
			height : `${maxSize.height}px`
		};

		return (<div className="playground-content" data-cursor={cursor}>
			<div className="playground-content-components-wrapper" style={wrapperStyle}>
				{(components.map((comp, i)=> {
					const pos = {
						x : packedRects.find(({ id })=> (id === comp.id)).x,
						y : packedRects.find(({ id })=> (id === comp.id)).y,
					};

					const style = {
						top  : `${pos.y}px`,
						left : `${pos.x}px`
					};

					const content = inlineStyles(comp.html, comp.styles);
					const comments = (popover && component.id === comp.id) ? [ ...comp.comments, reformComment({ position,
						id      : 0,
						type    : 'add',
						content : '',
						author  : profile
					})] : comp.comments;

					return (<div key={i} className="playground-content-component-wrapper" onClick={(event)=> this.handleContentClick(event, comp)} style={style}>
						<ContextMenuTrigger id="component" disableIfShiftIsPressed={true}>
							<div className="playground-content-component" data-id={comp.id} style={convertStyles(comp.rootStyles)} dangerouslySetInnerHTML={{ __html : content }} />

							<div className="playground-content-component-comment-wrapper" data-id={comp.id} >
								{(comments.filter(({ type })=> (type !== 'init')).map((comm, ii)=> {
									return (<PlaygroundComment key={`${i}_${ii}`} ind={(comp.comments.length - 1) - ii} component={comp} comment={comm} position={position} onMarkerClick={this.props.onMarkerClick} onAddComment={this.props.onAddComment} onDelete={this.props.onDeleteComment} onClose={this.handleComponentPopoverClose} />);
								}))}
							</div>
						</ContextMenuTrigger>
					</div>);
				}))}
			</div>

			{(cursor) && (<CommentPinCursor position={mouse.position} />)}
			<ComponentMenu menuID="component" component={component} onShow={this.props.onMenuShow} onClick={this.props.onMenuItem} onAddComment={this.props.onAddComment}/>
		</div>);
	}
}


const CommentPinCursor = (props)=> {
// 	console.log('CommentPinCursor()', props);

	const { position } = props;
	const style = {
		top  : `${position.y}px`,
		left : `${position.x}px`
	};

	return (<div className="comment-pin-cursor" style={style}>
		<FontAwesome name="map-marker-alt" />
	</div>);
};


const mapStateToProps = (state, ownProps)=> {
	return ({
		mouse      : state.mouse,
		profile    : state.userProfile,
		playground : state.playground,
		typeGroup  : state.typeGroup,
		component  : state.component,
		comment    : state.comment
	});
};


export default connect(mapStateToProps)(PlaygroundContent);



/*
// Object.fromEntries()
const obj = {a: 1, b: 2, c: 3}
const result = Object.fromEntries(
Object.entries(obj).map(
  ([key, value]) => [key, value * 2]
))
// {a: 2, b: 4, c: 6}
*/