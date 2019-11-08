
import React, { Component } from 'react';
import './PlaygroundContent.css';

import { ContextMenuTrigger } from 'react-contextmenu';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';

import ComponentComment from './ComponentComment';
import ComponentMenu from './ComponentMenu';


const inlineStyles = (html, styles)=> {
	const style = Object.keys(styles).map((key)=> (`${key}:${styles[key]}`)).join('; ').replace(/"/g, '\'');
	return ((/style="(.+?)"/i.test(html)) ? `${html.replace(/style="/, `style="${style} `)}` : html.replace(/>/, ` style="${style}">`).replace(/ class=.+?"/, ''));
};


class PlaygroundContent extends Component {
	constructor(props) {
		super(props);

		this.state = {
			components : [],
			position   : null,
			offset     : null,
			popover    : false
		};
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
// 		console.log('%s.componentDidUpdate()', this.constructor.name, prevProps, this.props, prevState, this.state);

		if (this.props.comment && !prevProps.comment) {
			this.setState({ popover : true });
		}
	}

	handleComponentPopoverClose = ()=> {
// 		console.log('%s.handleComponentPopoverClose()', this.constructor.name);
		this.setState({ popover : false }, ()=> {
			this.props.onPopoverClose();
		});
	};

	handleCommentClick = (event, comment)=> {
// 		console.log('%s.handleCommentClick()', this.constructor.name, event.target.parentNode.parentNode, event.target.parentNode.parentNode.parentNode, comment);
		event.preventDefault();
		event.stopPropagation();

		this.setState({
			offset  : {
				x : event.target.getBoundingClientRect().left,
				y : event.target.getBoundingClientRect().top
			},
			popover : true
		});

		const componentID = (event.target.parentNode.parentNode.parentNode.hasAttribute('data-id')) ? event.target.parentNode.parentNode.parentNode.getAttribute('data-id') : event.target.parentNode.parentNode.getAttribute('data-id');
		this.props.onCommentClick({ comment, componentID });
	};

	handleContentClick = (event, component)=> {
// 		console.log('%s.handleContentClick()', this.constructor.name, { boundingRect : event.target }, this.props.mouse.position, component);

		const { cursor } = this.props;
		if (cursor) {
			const offset = this.props.mouse.position;
			const position = {
				x : offset.x - event.target.getBoundingClientRect().left,
				y : offset.y - event.target.getBoundingClientRect().top,
			};

			this.props.onComponentClick({ component });
			this.setState({ position, offset,
				popover : true
			});

		} else {
			this.props.onComponentClick({ component });
		}
	};

	render() {
// 		console.log('%s.render()', this.constructor.name, this.props, this.state);

		const { typeGroup, playground, component, comment, cursor, mouse } = this.props;
		const { offset, popover } = this.state;

		const components = (component) ? [component] : (typeGroup) ? playground.components.filter(({ typeID })=> (typeID === typeGroup.id)) : playground.components;

		return (<div className="playground-content" data-cursor={cursor}>
			<div className="playground-content-components-wrapper">
				{(components.map((comp, i)=> {
					//const html = comp.html.replace(/\\"/g, '"').replace(/ class=.+?"/, ` style="${Object.keys(comp.styles).map((key)=> (`${key}:${comp.styles[key]}`)).join('; ').replace(/"/g, '\'')}"`);

					/*
					const obj = {a: 1, b: 2, c: 3}
					const result = Object.fromEntries(
          Object.entries(obj).map(
            ([key, value]) => [key, value * 2]
          ))
					// {a: 2, b: 4, c: 6}
					*/

					let grp = {};
					comp.children.forEach((child, i)=> {
						const path = [ ...child.path].pop();
						const inline = inlineStyles(child.html, child.styles);

						let sub = Object.fromEntries([[[...path.split(':')].shift(), [inline]]]);
						// find parent & make new sub obj as array
						if ((path.substr(-1) << 0) === 0) {

							if (Object.keys(grp).length === 0) {
								grp = sub;
// 								console.log('=0', grp, sub, child.path);

							} else {
// 								grp = { ...grp,
// 									[child.path[0].split(':')[0]] :
// 								};


// 								const sub = Object.keys(grp).find((key, i)=> (key === child.path[0].split(':')[0]));
// 								console.log('>0', grp, sub, child.path);
							}

						// find object w/ ind 0 & append array
						} else {
// 							console.log('>0', grp, sub, child.path);
						}
					});

					let html = ['', ''];
					comp.children.forEach((child, i)=> {
						const path = [ ...child.path].pop();
						const inline = inlineStyles(child.html, child.styles);

						if ((path.substr(-1) << 0) === 0) {
							html = [`${html[0]}${inline.split('[:]')[0]}`, `${inline.split('[:]')[1]}${html[1]}`];

						} else {
							html = [`${html[0]}`, `${html[1].replace(/><?/, `>${inline.split('[:]').join('').replace('[:]', '')}<`)}`];
						}

// 						console.log(i, path, html);
					});

// 					let children = '';
					const content = inlineStyles(comp.html, comp.styles).replace(/\[:]/, html.join(''));
					return (<div key={i} className="playground-content-component-wrapper" onClick={(event)=> this.handleContentClick(event, comp)}>
						<ContextMenuTrigger id="component" disableIfShiftIsPressed={true}>
							<div className="playground-content-component" data-id={comp.id} dangerouslySetInnerHTML={{ __html : content }} />

							<div className="playground-content-component-comment-wrapper" data-id={comp.id} >
								{(comp.comments.filter(({ type })=> (type !== 'init')).map((comment, i)=> {
									return (<ComponentComment key={i} ind={(comp.comments.length - 1) - i} popover={popover}component={comp} comment={comment} onClose={this.handleComponentPopoverClose} onMarkerClick={this.handleCommentClick} />);
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
		mouse : state.mouse
	});
};


export default connect(mapStateToProps)(PlaygroundContent);
