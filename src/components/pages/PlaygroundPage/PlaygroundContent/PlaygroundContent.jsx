import React, { Component } from "react";
import "./PlaygroundContent.css";

import { ContextMenuTrigger } from "react-contextmenu";
import FontAwesome from "react-fontawesome";
import { connect } from "react-redux";
import { Resizable } from "react-resizable";
import ResizeObserver from "react-resize-observer";

import PlaygroundComment from "../PlaygroundComment";
import ComponentMenu from "./ComponentMenu";
import { componentsFromTypeGroup } from "../utils/lookup";
import { Strings } from "lang-js-utils";
import { reformComment } from "../utils/reform";


const CONSTRAIN = 0.875;


class PlaygroundContent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      position: null,
      popover: false,
      bounds: {
        init: null,
        prev: null,
        curr: null,
        next: null
      }
    };
  }

  componentDidMount() {
    console.log('%s.componentDidMount()', this.constructor.name, this.props, this.state);
    // this.calcBounds({ x : 0, y : 0, width : 0, height : 0 });
  }


  componentDidUpdate(prevProps, prevState, snapshot) {
    // console.log('%s.componentDidUpdate()', this.constructor.name, prevProps, this.props, prevState, this.state);
  }

  calcBounds = (rect) => {
    // console.log('%s.calcBounds()', this.constructor.name, { rect });

    const { component } = this.props;
    if (!component) {
      return;
    }

    const { x, y, width, height } = rect;
    let { bounds } = this.state;
    let { init, prev, curr, next } = this.state.bounds;

    const scale = {
      width  : (component) ? (component.meta.bounds.width) / ((width - 48) * CONSTRAIN) : 1,
      height : (component) ? (component.meta.bounds.height) / ((height - 168) * CONSTRAIN) : 1
    };

    // nothing stored yet
    init = init || {
      container: { scale,
        position: { x, y },
        size  : { width, height }
      },
      component: component
        ? { scale,
            position: {
              x: 0,
              y: 0
            },
            size: component
              ? {
                  width: width,
                  height: height
                }
              : null
          }
        : null
    };

    curr = {
      container: { scale,
        position: { x, y },
        size: { width, height }
      },
      component: component
        ? { scale,
            position: {
              x: 0,
              y: 0
            },
            size: {
              width: (width - 40) * CONSTRAIN,
              height: (height - 168) * CONSTRAIN
            }
          }
        : null
    };

    // const scale = (init.component)

    // console.log('%s.calcBounds() --SET STATE', this.constructor.name, { bounds, init : { ...bounds.init, init}, prev : { ...bounds.prev, prev}, curr : { ...bounds.curr, curr}, next : { ...bounds.next, next} });

    bounds = {
      ...bounds,
      init,
      curr,
      prev: { ...bounds.prev, ...prev },
      next: { ...bounds.next, ...next }
    };

    this.setState({ bounds });
  };

  handleComponentPopoverClose = () => {
     console.log('%s.handleComponentPopoverClose()', this.constructor.name);
     
    this.setState({ popover: false }, () => {
      this.props.onPopoverClose();
    });
  };

  handleContentClick = (event, component) => {
    // 		console.log('%s.handleContentClick()', this.constructor.name, { boundingRect : event.target }, { clientX : event.clientX, clientY : event.clientY }, component);
    //  console.log('%s.handleContentClick()', this.constructor.name, component);

    const { cursor } = this.props;
    if (cursor) {
      const position = {
        x: event.clientX - 8 - event.target.getBoundingClientRect().x,
        y: event.clientY - 24 - event.target.getBoundingClientRect().y
      };

      this.setState({ position, popover: true });
    }

    this.props.onComponentClick({ component });
  };

  render() {
    // console.log('%s.render()', this.constructor.name, { state : this.state, initBounds : this.state.bounds.init, currBounds : this.state.bounds.curr });
    // console.log('%s.render()', this.constructor.name, (this.state.bounds && this.state.bounds.init) ? { init : this.state.bounds.init.component, curr : this.state.bounds.curr.component, scale : { x : (this.state.bounds.init.component.size.width / this.state.bounds.curr.component.size.width), y : (this.state.bounds.init.component.size.height / this.state.bounds.curr.component.size.height) } } : null);

    const {
      profile,
      typeGroup,
      playground,
      component,
      cursor,
      mouse
    } = this.props;
    const { position, popover, bounds } = this.state;
    const components = typeGroup
      ? component
        ? [component]
        : componentsFromTypeGroup(playground.components, typeGroup)
      : [];

    const scale = (bounds && bounds.init) ? {
      width  : (bounds.init.container.size.width + 0) / (bounds.curr.container.size.width + 0),
      height : (bounds.init.container.size.height + 0) / (bounds.curr.container.size.height + 0)
    } : null;

    return (
      <div
        className="playground-content"
        data-component={!(!component << 0)}
        data-cursor={cursor}
      >
        <ResizeObserver
          onResize={this.calcBounds}
          onPosition={this.calcBounds}
          onReflow={this.calcBounds}
        />
        {typeGroup && components.length > 0 && (
          <div
            className="playground-content-components-wrapper"
            data-component={component !== null}
          >
            {!component || bounds.curr === null ? (
              <PlaygroundComponentsGrid
                typeGroup={typeGroup}
                components={components}
                onItemClick={this.handleContentClick}
              />
            ) : (
              <PlaygroundComponent
                profile={profile}
                popover={popover}
                bounds={bounds.curr.component}
                maxBounds={bounds.curr.container}
                scale={bounds.curr.component.scale}
                typeGroup={typeGroup}
                component={component}
                onResize={this.handleComponentResize}
                onAddComment={this.props.onAddComment}
                onCloseComment={this.handleComponentPopoverClose}
                onDeleteComment={this.props.onDeleteComment}
                onItemClick={this.handleContentClick}
                onMarkerClick={this.props.onMarkerClick}
              />
            )}
          </div>
        )}
        {cursor && <CommentPinCursor position={mouse.position} />}
        <ComponentMenu
          menuID="component"
          onShow={this.props.onMenuShow}
          onClick={this.props.onMenuItem}
          onAddComment={this.props.onAddComment}
        />
      </div>
    );
  }
}

const CommentPinCursor = props => {
  // 	console.log('CommentPinCursor()', props);

  const { position } = props;
  const style = {
    top: `${position.y - 24}px`,
    left: `${position.x - 8}px`
  };

  return (
    <div className="comment-pin-cursor" style={style}>
      <FontAwesome name="map-marker-alt" />
    </div>
  );
};

const PlaygroundComponent = props => {
  // console.log('PlaygroundComponent()', props);

  const {
    scaling,
    profile,
    popover,
    scale,
    bounds,
    maxBounds,
    typeGroup,
    component
  } = props;
  const {
    id,
    tagName,
    imageData,
    processed,
    comments
  } = component;
  const { position, size } = bounds || component.meta.bounds;
  const { width, height } = size;

  const title =
    component.title === tagName
      ? `${tagName.toUpperCase()} ${Strings.capitalize(typeGroup.title)}`
      : component.title;

  // const scaleStyle = {
  //   // 'transform' : `scale(${(1 / scale.width)}, ${(1 / scale.height)})`
  //   'transform' : `scale(${Math.min((1 / scale.width), (1 / scale.height))})`
  // };

  const fac = Math.max(scale.width, scale.height)
  const offset2 = {
    top    : (height - (component.meta.bounds.height / fac)) * 0.5,
    left   : (width - (component.meta.bounds.width / fac)) * 0.5,
    width  : (component.meta.bounds.width / fac),
    height : (component.meta.bounds.height / fac)
  };

  const offset = {
    top  : 0,
    left : 0
  };

  // console.log('PlaygroundComponent()', offset);

  return (
    <Resizable
      className="playground-component-wrapper"
      axis="both"
      width={width}
      height={height}
      lockAspectRatio={true}
      maxcontraints={[maxBounds.size.width, maxBounds.size.height - 168]}
      onResize={props.onResize}
    >
      <div
        className="playground-component"
        data-processed={processed}
        onClick={event => props.onItemClick(event, component)}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <h5 className="component-title">{title}</h5>

        <ContextMenuTrigger
          disable={!processed}
          id="component"
          component={component}
          collect={props => ({ component: props.component })}
          disableIfShiftIsPressed={true}
        >
          <div
            className="playground-content-component"
            data-id={id}
            style={{ height: `${height}px` }}
          >
            {processed && <img src={imageData || ""} alt={title} />}
          </div>
          {processed && (
            <div className="playground-component-comments-wrapper" data-id={id}>
              {(popover
                ? [
                    ...comments,
                    reformComment({
                      position,
                      id: 0,
                      type: "add",
                      content: "",
                      author: profile
                    })
                  ]
                : comments
              )
                .filter(({ type }) => type !== "init")
                .map((comm, i) => {
                  return (
                    <PlaygroundComment
                      key={i}
                      ind={(comments.length - 1) - i}
                      component={component}
                      comment={comm}
                      scale={scale}
                      position={position}
                      offset={offset}
                      onMarkerClick={props.onMarkerClick}
                      onAdd={props.onAddComment}
                      onDelete={props.onDeleteComment}
                      onClose={props.onCloseComment}
                    />
                  );
                })}
            </div>
          )}
        </ContextMenuTrigger>

        {processed && (
          <div className="component-caption">
            {component.meta.bounds.width}px × {component.meta.bounds.height}px
          </div>
        )}
      </div>
    </Resizable>
  );
};

const PlaygroundComponentsGrid = props => {
  //   console.log('PlaygroundComponentsGrid()', props);

  const { typeGroup, components } = props;
  return (
    <div className="playground-components-grid">
      {components.map((component, i) => {
        const { id, thumbData, tagName, processed } = component;
        const title =
          component.title === tagName
            ? `${tagName.toUpperCase()} ${Strings.capitalize(typeGroup.title)}`
            : component.title;
        return (
          <div
            key={i}
            className="playground-component-wrapper components-grid-item"
            data-id={id}
            onClick={event => props.onItemClick(event, component)}
          >
            <h5 className="component-title">{title}</h5>
            <div className="content-wrapper" data-loaded={processed}>
              <img
                src={thumbData}
                className="components-grid-item-image"
                alt={title}
              />
              {processed && <div className="image-overlay" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const mapStateToProps = (state, ownProps) => {
  return {
    mouse: state.mouse,
    profile: state.userProfile,
    playground: state.playground,
    typeGroup: state.typeGroup,
    component: state.component,
    comment: state.comment
  };
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
