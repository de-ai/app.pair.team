
import React, { Component } from 'react';
import './TopNav.css';

import { connect } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { Row } from 'simple-flexbox';

import TopNavProfile from './TopNavProfile';
// import { isExplorePage, isHomePage, isProjectPage, isUploadPage, isUserLoggedIn } from '../../utils/funcs';
import { isUserLoggedIn } from '../../utils/funcs';
import logo from '../../images/logo-designengine.svg';
import { updateNavigation } from "../../redux/actions";


const mapDispatchToProps = (dispatch)=> {
	return ({
		updateNavigation  : (navIDs)=> dispatch(updateNavigation(navIDs))
	});
};


class TopNav extends Component {
	constructor(props) {
		super(props);

		this.state = {
			sections : [{
				title : 'Free Inspect',
				url   : '/inspect'
			}, {
				title : 'Parts',
				url   : '/parts'
			}, {
				title : 'Colors',
				url   : '/colors'
			}, {
				title : 'Typography',
				url   : '/typography'
			}]
		};
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		console.log('TopNav.componentDidUpdate()', prevProps, this.props, prevState);
	}

	handleLink = (url)=> {
		this.props.updateNavigation({
			uploadID   : 0,
			pageID     : 0,
			artboardID : 0
		});
		this.props.onPage(url);
	};

	render() {
		console.log('TopNav.render()', this.props, this.state);

		const { pathname } = window.location;
		const { sections } = this.state;

		return (
			<div className="top-nav-wrapper">
				<div className="top-nav-column top-nav-column-left"><Row horizontal="start" vertical="center">
					<img onClick={()=> this.props.onPage('')} src={logo} className="top-nav-logo" alt="Design Engine" />
					{(sections.map((section, i)=> <NavLink key={i} to={section.url} className={(pathname.includes(section.url)) ? 'top-nav-link top-nav-link-selected' : 'top-nav-link'}>{section.title}</NavLink>))}

					{/*<div className={(isHomePage() || isProjectPage() || isUploadPage()) ? 'top-nav-link top-nav-link-selected' : 'top-nav-link'} onClick={()=> this.props.onHome()}>Projects</div>*/}
					{/*<div className={(window.location.pathname.includes('/add-ons')) ? 'top-nav-link top-nav-link-selected' : 'top-nav-link'} onClick={()=> this.props.onPage('add-ons')}>Add Ons</div>*/}
					{/*<div className={(isExplorePage()) ? 'top-nav-link top-nav-link-selected' : 'top-nav-link'} onClick={()=> this.props.onPage('explore')}>Explore</div>*/}
					{/*<div className="top-nav-link" onClick={()=> window.open('https://docs.google.com/forms/d/e/1FAIpQLSdYZI6uIqF9D5zW5LmZQqCem6zrXh7THmVVBoOkeAQWm9o6lg/viewform?usp=sf_link')}>Survey</div>*/}
				</Row></div>

				<div className="top-nav-column top-nav-column-right">
					<Row horizontal="end" vertical="center">
						{(!isUserLoggedIn())
							? (<div>
									<button className="top-nav-button adjacent-button" onClick={()=> this.props.onPage('register')}>Sign Up</button>
									<button className="top-nav-button" onClick={()=> this.props.onPage('login')}>Login</button>
								</div>)
							: (<Row vertical="center">
									<TopNavProfile
										onPage={this.props.onPage}
										onLogout={this.props.onLogout}
									/>
							</Row>)}
					</Row>
				</div>
			</div>
		);
	}
}

export default connect(null, mapDispatchToProps)(TopNav);
