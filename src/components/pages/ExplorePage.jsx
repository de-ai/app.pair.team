
import React, { Component } from 'react';
import './ExplorePage.css';

import axios from "axios/index";
import createjs from 'preload-js';
import cookie from 'react-cookies';
import { Column, Row } from 'simple-flexbox';

import ArtboardItem from '../iterables/ArtboardItem';
import HomeExpo from '../elements/HomeExpo';

class ExplorePage extends Component {
	constructor(props) {
		console.log('ExplorePage.constructor()', props);

		super(props);

		this.state = {
			artboards  : [],
			loadOffset : 0,
			loadAmt    : 24,
			fetching   : false
		};

		this.queue = new createjs.LoadQueue(false);
	}

	componentDidMount() {
		console.log('ExplorePage.componentDidMount()');
		this.queue.on('fileload', this.handleFileLoaded);
		this.handleLoadNext();
	}

	handleLoadNext = ()=> {
		console.log('ExplorePage.handleLoadNext()', this.state.artboards);

		const prevArtboards = (this.state.artboards.length === 12) ? [] : this.state.artboards;
		this.setState({ fetching : true });

		let formData = new FormData();
		formData.append('action', 'EXPLORE');
		formData.append('offset', this.state.loadOffset);
		formData.append('length', this.state.loadAmt);
		axios.post('https://api.designengine.ai/system.php', formData)
			.then((response) => {
				console.log('EXPLORE', response.data);

				const artboards = response.data.artboards.map((artboard) => {
					this.queue.loadFile({
						id  : artboard.id,
						src : artboard.filename.replace('@3x', '@0.25x')
					});

					return ({
						id        : artboard.id,
						pageID    : artboard.page_id,
						uploadID  : artboard.upload_id,
						title     : artboard.title,
						pageTitle : artboard.page_title,
						type      : artboard.type,
						filename  : null,
						meta      : JSON.parse(artboard.meta),
						added     : artboard.added,
						selected  : false
					});
				});

				this.setState({
					artboards  : prevArtboards.concat(artboards),
					fetching   : false,
					loadOffset : this.state.loadOffset + this.state.loadAmt
				});
			}).catch((error) => {
		});
	};

	handleFileLoaded = (event)=> {
		let artboards = [...this.state.artboards];
		artboards.forEach((artboard)=> {
			if (artboard.id === event.item.id) {
				artboard.filename = event.item.src.replace('@0.25x.png', '');
			}
		});

		this.setState({ artboards : artboards });
	};

	render() {
		const { artboards } = this.state;
		const btnClass = (this.state.fetching) ? 'fat-button is-hidden' : 'fat-button';

		return (
			<div className="page-wrapper explore-page-wrapper">
				<HomeExpo onClick={(url)=> this.props.onPage(url)} />

				{(cookie.load('user_id') === '0')
					? (<div>
							<h3>Signup or login</h3>
							<h4>A design project contains all the files for your project, including specifications, parts, and code examples.</h4>
							<div className="explore-page-button-wrapper">
								<button className="adjacent-button" onClick={()=> this.props.onPage('register')}>Sign up with Email</button>
								<button onClick={()=> this.props.onPage('login')}>Login</button>
							</div>
					</div>) : (<div>
						<h3>Create a new design project</h3>
						<h4>A design project contains all the files for your project, including specifications, parts, and code examples.</h4>
						<div className="explore-page-button-wrapper">
							<button onClick={()=> this.props.onPage('new')}>New Project</button>
						</div>
					</div>)
				}

				<Row><h3>{(this.state.fetching ? 'Loading…' : 'Recent')}</h3></Row>
				<Row horizontal="space-between" className="explore-page-artboards-wrapper" style={{flexWrap:'wrap'}}>
					{artboards.map((artboard, i) => {
						return (
							<Column key={i}>
								<ArtboardItem
									title={artboard.title}
									image={artboard.filename}
									onClick={()=> this.props.onArtboardClicked(artboard)} />
							</Column>
						);
					})}
				</Row>
				<Row horizontal="center"><button className={btnClass} onClick={()=> this.handleLoadNext()}>More</button></Row>
			</div>
		);
	}
}

export default ExplorePage;
