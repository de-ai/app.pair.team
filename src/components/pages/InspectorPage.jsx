
import React, { Component } from 'react';
import './InspectorPage.css';
import 'react-tabs/style/react-tabs.css';
import '../elements/react-tabs.css';

import axios from 'axios';
import CopyToClipboard from 'react-copy-to-clipboard';
import cookie from 'react-cookies';
import Dropzone from 'react-dropzone';
import { Column, Row } from 'simple-flexbox';

// import Dropdown from '../elements/Dropdown';
import SliceItem from '../iterables/SliceItem';
import SliceToggle from '../elements/SliceToggle';
import Popup from '../elements/Popup';

//import { randomElement } from '../../utils/lang.js';

const artboardsWrapper = React.createRef();
const canvasWrapper = React.createRef();
const canvas = React.createRef();

class InspectorPage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			x: 0.5,
			y: 0.5,
			scale: 1.0,
			uploadID      : this.props.match.params.uploadID,
			pageID        : this.props.match.params.pageID,
			artboardID    : this.props.match.params.artboardID,
			sliceID       : this.props.match.params.sliceID,
			slice         : null,
			hoverSlice    : null,
			page          : null,
			artboards     : [],
			files         : [],
			selectedTab   : 0,
			tooltip       : 'Loading…',
			hoverOffset   : null,
			scrollOffset  : {
				x : 0,
				y : 0
			},
			offset        : null,
			scrolling     : false,
			code          : {
				html   : '',
				syntax : ''
			},
			comment       : '',
			visibleTypes  : {
				slice      : false,
				hotspot    : false,
				textfield  : false,
				group      : false,
				all        : true
			},
			languages     : [{
				id       : 0,
				title    : 'Add Ons',
				selected : true,
				key      : 'languages'
			}, {
				id       : 1,
				title    : 'CSS/HTML',
				selected : false,
				key      : 'languages'
			}, {
				id       : 2,
				title    : 'React CSS',
				selected : false,
				key      : 'languages'
			}, {
				id       : 3,
				title    : 'LESS',
				selected : false,
				key      : 'languages'
			}],
			popup : {
				visible : false,
				content : ''
			}
		};

		this.lastScroll = 0;
		this.scrollInterval = null;
		this.rerender = 0;
		this.antsOffset = 0;
		this.antsInterval = null;

		this.zoomNotches = [
			0.03,
			0.06,
			0.13,
			0.25,
			0.50,
			1.00,
			1.75,
			3.00
		];

		cookie.save('upload_id', this.props.match.params.uploadID, { path : '/' });
	}

	handlePanAndZoom = (x, y, scale) => {
		this.setState({ x, y, scale });
	};

	handlePanMove = (x, y) => {
		this.setState({ x, y });
	};

	transformPoint({ x, y }) {
		return {
			x: 0.5 + this.state.scale * (x - this.state.x),
			y: 0.5 + this.state.scale * (y - this.state.y)
		};
	}


	componentDidMount() {
		this.refreshData();
		this.antsInterval = setInterval(this.redrawAnts, 75);

		document.addEventListener('keydown', this.handleKeyDown.bind(this));
		document.addEventListener('wheel', this.handleWheelStart.bind(this));
	}

	componentDidUpdate(prevProps) {
// 		console.log('componentDidUpdate()', prevProps, this.props);
		if (this.props.match.params.artboardID !== prevProps.match.params.artboardID) {
			this.refreshData();
			return (null);
		}

		if (canvas.current) {
			this.updateCanvas();
		}
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKeyDown.bind(this));
		clearInterval(this.antsInterval);
	}

	refreshData = ()=> {
		const { pageID, artboardID, sliceID } = this.props.match.params;
		this.setState({
			pageID     : pageID,
			artboardID : artboardID,
			slice      : sliceID,
			tooltip    : 'Loading…'
		});

		let formData = new FormData();
		formData.append('action', 'PAGE');
		formData.append('page_id', '' + pageID);
		axios.post('https://api.designengine.ai/system.php', formData)
			.then((response)=> {
// 				console.log('PAGE', response.data);
				const page = response.data.page;

				formData.append('action', 'ARTBOARDS');
				formData.append('upload_id', '');
				formData.append('page_id', '' + pageID);
				formData.append('slices', '0');
				axios.post('https://api.designengine.ai/system.php', formData)
					.then((response)=> {
						console.log('ARTBOARDS', response.data);

						const artboards = response.data.artboards.map((artboard, i)=> ({
							id        : artboard.id,
							pageID    : artboard.page_id,
							title     : artboard.title,
							filename  : artboard.filename,
							meta      : JSON.parse(artboard.meta),
							views     : artboard.views,
							downloads : artboard.downloads,
							added     : artboard.added,
							system    : artboard.system,
							slices    : artboard.slices.map((item) => ({
								id       : item.id,
								title    : item.title,
								type     : item.type,
								filename : item.filename,
								meta     : JSON.parse(item.meta),
								added    : item.added
							})),
							comments  : artboard.comments
						}));

						formData.append('action', 'FILES');
						formData.append('upload_id', '' + this.state.uploadID);
						axios.post('https://api.designengine.ai/system.php', formData)
							.then((response)=> {
								console.log('FILES', response.data);

								const files = response.data.files.map((file) => ({
									id       : file.id,
									title    : file.title,
									filename : file.filename,
									contents : file.contents,
									added    : file.added
								})).concat([
									{
										id       : 0,
										title    : 'CSS',
										filename : 'CSS',
										contents : null,
										added    : null
									}, {
										id       : 0,
										title    : 'React CSS',
										filename : 'React CSS',
										contents : null,
										added    : null
									}
								]);

								this.setState({
									files     : files,
									page      : page,
									artboards : artboards,
									tooltip   : ''
								});
							}).catch((error) => {
						});
					}).catch((error) => {
				});
			}).catch((error) => {
		});
	};

	onDrop(files) {
		console.log('onDrop()', files);
		if (files.length > 0 && files[0].name.split('.').pop() === 'zip') {
				let self = this;
				const config = {
					headers : {
						'content-type' : 'multipart/form-data'
					}, onUploadProgress : function (progressEvent) {
						const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
						self.setState({ percent : percent });

						if (progressEvent.loaded === progressEvent.total) {
							self.onUploadComplete();
						}
					}
				};

				files.forEach(file => {
					let formData = new FormData();
					formData.append('file', file);

					axios.post('http://cdn.designengine.ai/files/upload.php?user_id=' + cookie.load('user_id') + '&upload_id=' + this.state.uploadID, formData, config)
						.then((response) => {
							console.log("UPLOAD", response.data);
						}).catch((error) => {
					});
				});

		} else {
			const popup = {
				visible : true,
				content : 'error::Only zip archives are support at this time.'
			};
			this.setState({ popup : popup });
		}
	}

	onUploadComplete = ()=> {
		let formData = new FormData();
		formData.append('action', 'FILES');
		formData.append('upload_id', '' + this.state.uploadID);
		axios.post('https://api.designengine.ai/system.php', formData)
			.then((response)=> {
				console.log('FILES', response.data);

				const files = response.data.entries.map((file) => ({
					id       : file.id,
					title    : file.title,
					filename : file.filename,
					contents : file.contents,
					added    : file.added
				}));

				this.setState({ files : files });
			}).catch((error) => {
		});

		this.setState({
			uploading      : false,
			uploadComplete : true
		});
	};

	handleKeyDown = (event)=> {
		if (event.keyCode === 187) {
			this.handleZoom(1);

		} else if (event.keyCode === 189) {
			this.handleZoom(-1);
		}
	};

	handleSliceToggle = (type)=> {
		let visibleTypes = this.state.visibleTypes;
		Object.keys(visibleTypes).forEach(function(key) {
			visibleTypes[key] = false;

		});
		visibleTypes[type] = true;
		this.setState({ visibleTypes : visibleTypes });
	};

	handleTab = (ind)=> {
		console.log('handleTab');
		this.setState({ selectedTab : ind });
	};

	handleCodeCopy = ()=> {
		const popup = {
			visible : true,
			content : 'Copied to Clipboard!'
		};
		this.setState({ popup : popup });
	};

	handleContribute = ()=> {

	};

	handleCommentChange = (event)=> {
		event.persist();
		if (/\r|\n/.exec(event.target.value)) {
			this.submitComment(event);

		} else {
			this.setState({ [event.target.name] : event.target.value })
		}
	};

	submitComment = (event)=> {
		event.preventDefault();

		if (this.state.comment.length > 0) {
			let formData = new FormData();
			formData.append('action', 'ADD_COMMENT');
			formData.append('user_id', cookie.load('user_id'));
			formData.append('artboard_id', '' + this.state.artboardID);
			formData.append('content', this.state.comment);
			axios.post('https://api.designengine.ai/system.php', formData)
				.then((response) => {
					console.log('ADD_COMMENT', response.data);
					this.setState({ comment : '' });
					this.refreshData();
				}).catch((error) => {
			});
		}
	};

	handleVote = (commentID, score)=> {
		let formData = new FormData();
		formData.append('action', 'VOTE_COMMENT');
		formData.append('user_id', cookie.load('user_id'));
		formData.append('comment_id', commentID);
		formData.append('value', score);
		axios.post('https://api.designengine.ai/system.php', formData)
			.then((response) => {
				console.log('VOTE_COMMENT', response.data);
				this.refreshData();
			}).catch((error) => {
		});
	};

	handleWheelStart = (event)=> {
// 		console.log(event.type, event.deltaX, event.deltaY, event.target);
		//console.log('wheel', artboardsWrapper.current.clientWidth, artboardsWrapper.current.clientHeight, artboardsWrapper.current.scrollTop, artboardsWrapper.current.scrollLeft);

// 		event.preventDefault();

		this.lastScroll = (new Date()).getUTCSeconds();
		clearTimeout(this.scrollInterval);
		this.scrollInterval = setTimeout(this.handleWheelStop, 50);


		if (!this.state.scrolling) {
			this.setState({ scrolling : true });
		}

		if (event.ctrlKey) {
			this.setState({ scale : Math.min(Math.max(this.state.scale - (event.deltaY * 0.0025), 0.03), 3).toFixed(2) });

		} else {
			if (artboardsWrapper.current) {
// 				artboardsWrapper.current.scrollTop += event.deltaY;
// 				artboardsWrapper.current.scrollLeft += event.deltaX;

				this.setState({
					scrollOffset : {
						x : artboardsWrapper.current.scrollLeft,
						y : artboardsWrapper.current.scrollTop
					}
				});
			}
		}
	};

	handleWheelStop = ()=> {
		clearTimeout(this.scrollInterval);
		this.setState({ scrolling : false });
	};

	handleDrag = (event)=> {
		//console.log(event.type, event.target);
		if (event.type === 'mousedown') {


		} else if (event.type === 'mousemove') {
// 			this.forceUpdate();

		} else if (event.type === 'mouseup') {
// 			this.setState({ canvasVisible : true });
		}
	};

	handleMouseDown = ()=> {
// 		this.setState({ canvasVisible : false });
	};

	handleMouseUp = ()=> {
// 		this.setState({ canvasVisible : true });
	};

	handleArtboardOver = (event)=> {
// 		console.log('handleArtboardOver()', event.target);
		const artboardID = event.target.getAttribute('data-id');

		let formData = new FormData();
		formData.append('action', 'SLICES');
		formData.append('artboard_id', event.target.getAttribute('data-id'));
		axios.post('https://api.designengine.ai/system.php', formData)
			.then((response) => {
// 				console.log('SLICES', response.data);

				let artboards = this.state.artboards;
				artboards.forEach((artboard)=> {
					if (artboard.id === artboardID && artboard.slices.length === 0) {
						artboard.slices = response.data.slices.map((item) => ({
							id       : item.id,
							title    : item.title,
							type     : item.type,
							filename : item.filename,
							meta     : JSON.parse(item.meta),
							added    : item.added
						}));
					}
				});

				this.setState({ artboards : artboards });
			}).catch((error) => {
		});
	};

	handleArtboardOut = (event)=> {
// 		console.log('handleArtboardOut()', event.target);
		const artboardID = event.target.getAttribute('data-id');

// 		let artboards = this.state.artboards;
// 		artboards.forEach((artboard)=> {
// 			if (artboard.id === artboardID) {
// 				artboard.slices = [];
// 			}
// 		});
//
// 		this.setState({ artboards : artboards });
	};

	handleZoom = (direction)=> {
		const { scale } = this.state;

		if (direction === 0) {
			this.setState({ scale : this.zoomNotches[5] });

		} else {
			let ind = -1;
			this.zoomNotches.forEach((amt, i)=> {
				if (scale === amt) {
					ind = i;
				}
			});

			if (ind === -1) {
				let diff = 3;
				this.zoomNotches.forEach((amt, i)=> {
					if (Math.abs(amt - scale) < diff) {
						diff = Math.abs(amt - scale);
						ind = i;
					}
				});
			}

			this.setState({ scale : this.zoomNotches[Math.min(Math.max(0, ind + direction), this.zoomNotches.length - 1)] });
		}


		//this.setState({ scale : (direction === 0) ? 0.5 : Math.min(Math.max(scale + (direction * 0.02), 0.5), 2) });
		this.updateCanvas();
	};

	handleSliceRollOver = (ind, slice, offset)=> {
		const scrollOffset = {
			x : (offset.x > artboardsWrapper.current.clientWidth) ? offset.x - artboardsWrapper.current.scrollLeft : offset.x,
			y : (offset.y > artboardsWrapper.current.clientHeight) ? offset.y - artboardsWrapper.current.scrollTop : offset.y
		};

		this.setState({
			hoverSlice  : slice,
			hoverOffset : scrollOffset
		});
	};

	handleSliceRollOut = (ind, slice)=> {
		this.setState({
			hoverSlice : null
		});
	};

	handleSliceClick = (ind, slice, offset)=> {
		let files = this.state.files;

		let html = '';
		let syntax = '';

		html += '{';
		html += '&nbsp;&nbsp;position: absolute;\n';
		html += '&nbsp;&nbsp;top: ' + slice.meta.frame.origin.y + 'px;\n';
		html += '&nbsp;&nbsp;left: ' + slice.meta.frame.origin.x + 'px;\n';
		html += '&nbsp;&nbsp;width: ' + slice.meta.frame.size.width + 'px;\n';
		html += '&nbsp;&nbsp;height: ' + slice.meta.frame.size.height + 'px;\n';
		if (slice.type === 'textfield') {
			html += '&nbsp;&nbsp;font-family: "' + 'San Francisco Text' + '", sans-serif;\n';
			html += '&nbsp;&nbsp;font-size: ' + slice.meta.font.size + 'px;\n';
			html += '&nbsp;&nbsp;color: ' + slice.meta.font.color.toUpperCase() + ';\n';
			html += '&nbsp;&nbsp;letter-spacing: ' + slice.meta.font.kerning.toFixed(2) + 'px;\n';
			html += '&nbsp;&nbsp;line-height: ' + slice.meta.font.lineHeight + 'px;\n';
			html += '&nbsp;&nbsp;text-align: ' + 'left' + ';\n';

		} else if (slice.type === 'slice') {
			html += '&nbsp;&nbsp;background: url("' + slice.filename.split('/').pop() + '@3x.png");\n';
		}
		html += '}';

		syntax = html.replace(/&nbsp;/g, '').replace(/<br \/>/g, '\n');

		files[files.length - 2].contents = JSON.stringify('.' + slice.title.replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '').toLowerCase() + ' ' + [html.slice(0, 1), '\n', html.slice(1)].join(''));

		syntax = syntax.replace(/: (.+?);/g, ':\'$1\',').replace(/(-.)/g, function(v){ return (v[1].toUpperCase()); }).replace(/,\n}/, '}');
		html = syntax;

		files[files.length - 1].contents = JSON.stringify(html);

		this.setState({
			slice  : slice,
			offset : offset,
			files  : files
		});
	};

	handleDownload = ()=> {
		if (cookie.load('user_id') === '0') {
			cookie.save('msg', 'download these parts.', { path : '/' });
			this.props.onPage('login');

		} else {
			const filePath = 'http://cdn.designengine.ai/artboard.php?artboard_id=' + this.state.artboard.id;
			let link = document.createElement('a');
			link.href = filePath;
			link.download = filePath.substr(filePath.lastIndexOf('/') + 1);
			link.click();
		}
	};

	resetThenSet = (ind, key) => {
		console.log('resetThenSet()', ind, key);
		let tmp = [...this.state[key]];
		tmp.forEach(item => item.selected = false);
		tmp[ind].selected = true;

		const { slice } = this.state;
		let html = '';
		let syntax = '';

		if (slice) {
			if (ind === 1 || ind === 2) {
				html += (ind === 2) ? '{' : '.' + slice.title.replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+/, '').replace(/-+$/, '').toLowerCase() + ' {<br />';
				html += '&nbsp;&nbsp;position: absolute;<br />';
				html += '&nbsp;&nbsp;top: ' + slice.meta.frame.origin.y + 'px;<br />';
				html += '&nbsp;&nbsp;left: ' + slice.meta.frame.origin.x + 'px;<br />';
				html += '&nbsp;&nbsp;width: ' + slice.meta.frame.size.width + 'px;<br />';
				html += '&nbsp;&nbsp;height: ' + slice.meta.frame.size.height + 'px;<br />';
				if (slice.type === 'textfield') {
					html += '&nbsp;&nbsp;font-family: "' + 'San Francisco Text' + '", sans-serif;<br />';
					html += '&nbsp;&nbsp;font-size: ' + slice.meta.font.size + 'px;<br />';
					html += '&nbsp;&nbsp;color: ' + slice.meta.font.color.toUpperCase() + ';<br />';
					html += '&nbsp;&nbsp;letter-spacing: ' + slice.meta.font.kerning + 'px;<br />';
					html += '&nbsp;&nbsp;line-height: ' + slice.meta.font.lineHeight + 'px;<br />';
					html += '&nbsp;&nbsp;text-align: ' + 'left' + ';<br />';

				} else if (slice.type === 'slice') {
					html += '&nbsp;&nbsp;background: url("' + slice.filename.split('/').pop() + '@3x.png");<br />';
				}
				html += '}';

				syntax = html.replace(/&nbsp;/g, '').replace(/<br \/>/g, '\n');

				if (ind === 2) {
					syntax = syntax.replace(/: (.+?);/g, ':\'$1\',').replace(/(-.)/g, function(v){ return (v[1].toUpperCase()); });
					html = syntax;
				}
			}
		}

		this.setState({
			[key] : tmp,
			code  : {
				html   : html,
				syntax : syntax
			}
		});
	};

	updateCanvas = ()=> {
		const { scale, offset } = this.state;
		const slice = this.state.slice;
		const context = canvas.current.getContext('2d');
		context.clearRect(0, 0, canvas.current.clientWidth, canvas.current.clientHeight);

// 		context.fillStyle = 'rgba(0, 0, 0, 0.25)';
// 		context.fillRect(0, 0, canvas.current.clientWidth, canvas.current.clientHeight);

		if (slice) {
			const selectedSrcFrame = slice.meta.frame;
			const selectedOffset = {
				x : 100 + offset.x,
				y : 50 + offset.y
			};

			const selectedFrame = {
				origin : {
					x : selectedOffset.x + Math.round(selectedSrcFrame.origin.x * scale),
					y : selectedOffset.y + Math.round(selectedSrcFrame.origin.y * scale)
				},
				size   : {
					width  : Math.round(selectedSrcFrame.size.width * scale),
					height : Math.round(selectedSrcFrame.size.height * scale)
				}
			};

			//console.log('updateCanvas()', selectedOffset, selectedFrame);

			context.fillStyle = (slice.type === 'slice') ? 'rgba(255, 181, 18, 0.5)' : (slice.type === 'hotspot') ? 'rgba(62, 84, 255, 0.5)' : (slice.type === 'textfield') ? 'rgba(255, 88, 62, 0.5)' : 'rgba(62, 255, 109, 0.5)';
			context.fillRect(selectedFrame.origin.x, selectedFrame.origin.y, selectedFrame.size.width, selectedFrame.size.height);
			context.fillStyle = '#00ff00';
			context.fillRect(selectedFrame.origin.x, selectedFrame.origin.y - 13, selectedFrame.size.width, 13);
			context.fillRect(selectedFrame.origin.x - 30, selectedFrame.origin.y, 30, selectedFrame.size.height);

			context.font = '10px AndaleMono';
			context.fillStyle = '#ffffff';
			context.textAlign = 'center';
			context.textBaseline = 'bottom';
			context.fillText(selectedSrcFrame.size.width + 'PX', selectedFrame.origin.x + (selectedFrame.size.width * 0.5), selectedFrame.origin.y - 1);

			context.textAlign = 'right';
			context.textBaseline = 'middle';
			context.fillText(selectedSrcFrame.size.height + 'PX', selectedFrame.origin.x - 2, selectedFrame.origin.y + (selectedFrame.size.height * 0.5));

			context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
			context.beginPath();
			context.setLineDash([4, 2]);
			context.lineDashOffset = this.antsOffset;
			context.strokeRect(selectedFrame.origin.x, selectedFrame.origin.y, selectedFrame.size.width, selectedFrame.size.height);
		}

		if (this.state.hoverSlice) {
			let visible = false;
			let self = this;
			Object.keys(this.state.visibleTypes).forEach(function(key) {
				if (self.state.visibleTypes[key] && self.state.hoverSlice.type === key) {
					visible = true;
				}
			});

			if (this.state.visibleTypes.all) {
				visible = true;
			}

			if (visible) {
				const srcFrame = this.state.hoverSlice.meta.frame;

				const frame = {
					origin : {
						x : 100 + this.state.hoverOffset.x + Math.round(srcFrame.origin.x * scale),
						y : 50 + this.state.hoverOffset.y + Math.round(srcFrame.origin.y * scale)
					},
					size   : {
						width  : Math.round(srcFrame.size.width * scale),
						height : Math.round(srcFrame.size.height * scale)
					}
				};

				//console.log('updateCanvas()', srcFrame, offset, frame);

				context.fillStyle = 'rgba(0, 0, 0, 0.5)';
				context.fillStyle = (this.state.hoverSlice.type === 'slice') ? 'rgba(255, 181, 18, 0.5)' : (this.state.hoverSlice.type === 'hotspot') ? 'rgba(62, 84, 255, 0.5)' : (this.state.hoverSlice.type === 'textfield') ? 'rgba(255, 88, 62, 0.5)' : 'rgba(62, 255, 109, 0.5)';
				context.fillRect(frame.origin.x, frame.origin.y, frame.size.width, frame.size.height);
				context.strokeStyle = 'rgba(0, 255, 0, 1.0)';
				context.beginPath();
				context.setLineDash([4, 2]);
				context.lineDashOffset = 0;//-this.antsOffset;
				context.moveTo(0, frame.origin.y);
				context.lineTo(canvas.current.clientWidth, frame.origin.y);
				context.moveTo(0, frame.origin.y + frame.size.height);
				context.lineTo(canvas.current.clientWidth, frame.origin.y + frame.size.height);
				context.moveTo(frame.origin.x, 0);
				context.lineTo(frame.origin.x, canvas.current.clientHeight);
				context.moveTo(frame.origin.x + frame.size.width, 0);
				context.lineTo(frame.origin.x + frame.size.width, canvas.current.clientHeight);
				context.stroke();

				context.setLineDash([1, 0]);
				context.lineDashOffset = 0;
				context.fillStyle = 'rgba(0, 0, 0, 0.0)';
				context.fillRect(frame.origin.x, frame.origin.y, frame.size.width, frame.size.height);
				context.strokeStyle = '#00ff00';
				context.beginPath();
				context.moveTo(0, 0);
				context.strokeRect(frame.origin.x, frame.origin.y, frame.size.width, frame.size.height);
				// 		  context.lineWidth = 2;
				context.stroke();

				context.fillStyle = '#00ff00';
				context.fillRect(frame.origin.x, frame.origin.y - 13, frame.size.width, 13);
				context.fillRect(frame.origin.x - 30, frame.origin.y, 30, frame.size.height);

				context.font = '10px AndaleMono';
				context.fillStyle = '#ffffff';
				context.textAlign = 'center';
				context.textBaseline = 'bottom';
				context.fillText(srcFrame.size.width + 'PX', frame.origin.x + (frame.size.width * 0.5), frame.origin.y - 1);

				context.textAlign = 'right';
				context.textBaseline = 'middle';
				context.fillText(srcFrame.size.height + 'PX', frame.origin.x - 2, frame.origin.y + (frame.size.height * 0.5));
//
// 				context.fillStyle = 'rgba(0, 255, 0, 1)';
// 				context.textAlign = 'right';
// 				context.textBaseline = 'top';
// 				context.fillText(srcFrame.origin.x + 'px', frame.origin.x - 2, 1);
//
// 				context.textAlign = 'left';
// 				context.fillText((srcFrame.origin.x + srcFrame.size.width) + 'px', (frame.origin.x + frame.size.width) + 2, 1);
//
// 				context.textBaseline = 'bottom';
// 				context.fillText(srcFrame.origin.y + 'px', 1, frame.origin.y);
//
// 				context.textBaseline = 'top';
// 				context.fillText((srcFrame.origin.y + srcFrame.size.height) + 'px', 1, frame.origin.y + frame.size.height);
			}
		}
	};

	redrawAnts = ()=> {
		if (this.antsOffset++ > 16) {
			this.antsOffset = 0;
		}

		if (canvas.current) {
			this.updateCanvas();
		}
	};


	render() {
		const tsOptions = {
			year   : 'numeric',
			month  : 'numeric',
			day    : 'numeric'
		};

		const { page, artboards, slice, files } = this.state;
		const { visibleTypes } = this.state;
		const { scale } = this.state;

		let self = this;
		if (this.rerender === 0) {
			this.rerender = 1;
			setTimeout(function() {
				self.forceUpdate();
			}, 1000);
		}

		const wrapperStyle = {
			position        : 'absolute',
			width           : (artboards.length > 0) ? Math.floor(artboards.length * (50 + (artboards[0].meta.frame.size.width * this.state.scale)) * 0.75) : 0,
			height          : (artboards.length > 0) ? Math.floor(artboards.length * (50 + (artboards[0].meta.frame.size.height * this.state.scale)) * 0.75) : 0,
// 			transform       : (artboards.length > 0) ? 'translate(' + ((3 * (50 + (artboard.meta.frame.size.width * this.state.scale))) * -0.5) + 'px, ' + ((artboard.meta.frame.size.height * this.state.scale) * 0.5) + 'px)' : 'translate(0px, 0px)'
			transform       : (artboards.length > 0) ? 'translate(100px, 50px)' : 'translate(0px, 0px)'
		};

		const canvasStyle = {
			top     : (-50 + this.state.scrollOffset.y) + 'px',
			left    : (-100 + this.state.scrollOffset.x) + 'px',
			display : (this.state.scrolling) ? 'none' : 'block'
		};

		let maxH = 0;
		let offset = {
			x : 0,
			y : 0
		};

		let heroes = [];
		let slices = [];

		let size = {
			width  : 0,
			height : 0
		};

// 		for (let i=0; i<((artboards.length > 0) ? Math.min(artboards.length, 10) : 0); i++) {
		for (let i=0; i<artboards.length; i++) {
			const artboard = artboards[i];

			if (Math.floor(i % 5) === 0) {
				offset.x = 0;
				offset.y += maxH + 50;
				maxH = 0;
			}

			if (artboard.meta.frame.size.height * scale > maxH) {
				maxH = artboard.meta.frame.size.height * scale;
			}

			const heroStyle = {
				position       : 'absolute',
				top            : Math.floor(offset.y) + 'px',
				left           : Math.floor(offset.x) + 'px',
				width          : Math.floor(scale * artboard.meta.frame.size.width) + 'px',
				height         : Math.floor(scale * artboard.meta.frame.size.height) + 'px',
				background     : '#000000 url("' + artboard.filename + '") no-repeat center',
				backgroundSize : 'cover',
				border         : '2px dotted #00ff00'
			};

			const sliceWrapperStyle = {
				position : 'absolute',
				top      : Math.floor(offset.y) + 'px',
				left     : Math.floor(offset.x) + 'px',
				width    : (scale * artboard.meta.frame.size.width) + 'px',
				height   : (scale * artboard.meta.frame.size.height) + 'px'
			};

			const backgroundSlices = artboard.slices.map((slice, i) => {
				return ((slice.type === 'group') ?
					<SliceItem
						key={i}
						id={slice.id}
						title={slice.title}
						type={slice.type}
						filled={visibleTypes[slice.type]}
						visible={(!this.state.scrolling)}
						top={slice.meta.frame.origin.y}
						left={slice.meta.frame.origin.x}
						width={slice.meta.frame.size.width}
						height={slice.meta.frame.size.height}
						scale={scale}
						offsetX={offset.x}
						offsetY={offset.y}
						onRollOver={(offset)=> this.handleSliceRollOver(i, slice, offset)}
						onRollOut={()=> this.handleSliceRollOut(i, slice)}
						onClick={(offset) => this.handleSliceClick(i, slice, offset)} />
					: null);
			});

			const hotspotSlices = artboard.slices.map((slice, i) => {
				return ((slice.type === 'hotspot') ?
					<SliceItem
						key={i}
						id={slice.id}
						title={slice.title}
						type={slice.type}
						filled={visibleTypes[slice.type]}
						visible={(!this.state.scrolling)}
						top={slice.meta.frame.origin.y}
						left={slice.meta.frame.origin.x}
						width={slice.meta.frame.size.width}
						height={slice.meta.frame.size.height}
						scale={scale}
						offsetX={offset.x}
						offsetY={offset.y}
						onRollOver={(offset)=> this.handleSliceRollOver(i, slice, offset)}
						onRollOut={()=> this.handleSliceRollOut(i, slice)}
						onClick={(offset) => this.handleSliceClick(i, slice, offset)} />
					: null);
			});

			const textfieldSlices = artboard.slices.map((slice, i) => {
				return ((slice.type === 'textfield') ?
					<SliceItem
						key={i}
						id={slice.id}
						title={slice.title}
						type={slice.type}
						filled={visibleTypes[slice.type]}
						visible={(!this.state.scrolling)}
						top={slice.meta.frame.origin.y}
						left={slice.meta.frame.origin.x}
						width={slice.meta.frame.size.width}
						height={slice.meta.frame.size.height}
						scale={scale}
						offsetX={offset.x}
						offsetY={offset.y}
						onRollOver={(offset)=> this.handleSliceRollOver(i, slice, offset)}
						onRollOut={()=> this.handleSliceRollOut(i, slice)}
						onClick={(offset) => this.handleSliceClick(i, slice, offset)} />
					: null);
			});

			const sliceSlices = artboard.slices.map((slice, i) => {
				return ((slice.type === 'slice') ?
					<SliceItem
						key={i}
						id={slice.id}
						title={slice.title}
						type={slice.type}
						filled={visibleTypes[slice.type]}
						visible={(!this.state.scrolling)}
						top={slice.meta.frame.origin.y}
						left={slice.meta.frame.origin.x}
						width={slice.meta.frame.size.width}
						height={slice.meta.frame.size.height}
						scale={scale}
						offsetX={offset.x}
						offsetY={offset.y}
						onRollOver={(offset)=> this.handleSliceRollOver(i, slice, offset)}
						onRollOut={()=> this.handleSliceRollOut(i, slice)}
						onClick={(offset) => this.handleSliceClick(i, slice, offset)} />
					: null);
			});

			heroes.push(
				<div>
					<div style={heroStyle}>
						<div className="inspector-page-caption">{artboard.title}</div>
					</div>
				</div>
			);

			slices.push(
				<div className="inspector-page-hero-slices-wrapper" style={sliceWrapperStyle} onMouseOver={this.handleArtboardOver} onMouseOut={this.handleArtboardOut}>
					<div data-id={artboard.id} className="inspector-page-background-wrapper">{backgroundSlices}</div>
					<div className="inspector-page-hotspot-wrapper">{hotspotSlices}</div>
					<div className="inspector-page-textfield-wrapper">{textfieldSlices}</div>
					<div className="inspector-page-slice-wrapper">{sliceSlices}</div>
				</div>
			);

			offset.x += Math.round(50 + (artboard.meta.frame.size.width * scale));
		}


		const styles = (slice && slice.meta.styles && slice.meta.styles.length > 0) ? {
			stroke : (slice.meta.styles[0].border.length > 0) ? {
				color     : slice.meta.styles[0].border[0].color.toUpperCase(),
				position  : slice.meta.styles[0].border[0].position,
				thickness : slice.meta.styles[0].border[0].thickness + 'px'
			} : null,
			shadow : (slice.meta.styles[0].shadow.length > 0) ? {
				color  : slice.meta.styles[0].shadow[0].color.toUpperCase(),
				offset : {
					x : slice.meta.styles[0].shadow[0].offset.x,
					y : slice.meta.styles[0].shadow[0].offset.y
				},
				spread : slice.meta.styles[0].shadow[0].spread + 'px',
				blur   : slice.meta.styles[0].shadow[0].blur + 'px'
			} : null,
			innerShadow : (slice.meta.styles[0].innerShadow.length > 0) ? {
				color  : slice.meta.styles[0].shadow[0].color.toUpperCase(),
				offset : {
					x : slice.meta.styles[0].shadow[0].offset.x,
					y : slice.meta.styles[0].shadow[0].offset.y
				},
				spread : slice.meta.styles[0].shadow[0].spread + 'px',
				blur   : slice.meta.styles[0].shadow[0].blur + 'px'
			} : null
		} : null;

// 		console.log('InspectorPage.render()', scale);
// 		console.log(window.performance.memory);

		return (<div style={{paddingBottom:'30px'}}>
			<div className="page-wrapper inspector-page-wrapper">
				<div className="inspector-page-content">
					<div className="inspector-page-hero-wrapper" ref={artboardsWrapper}>
						{(artboards.length > 0) && (
							<div style={wrapperStyle}>
								{heroes}
								<div className="inspector-page-hero-canvas-wrapper" style={canvasStyle} ref={canvasWrapper}>
									<canvas width={(artboardsWrapper.current) ? artboardsWrapper.current.clientWidth : 0} height={(artboardsWrapper.current) ? artboardsWrapper.current.clientHeight : 0} ref={canvas}>Your browser does not support the HTML5 canvas tag.</canvas>
								</div>
								{slices}
							</div>
						)}
					</div>
					<div className="inspector-page-zoom-wrapper">
						<button className={'inspector-page-float-button' + ((scale >= 3) ? ' button-disabled' : '')} onClick={()=> this.handleZoom(1)}><img className="inspector-page-float-button-image" src={(scale < 3) ? '/images/zoom-in.svg' : '/images/zoom-in_disabled.svg'} alt="+" /></button><br />
						<button className={'inspector-page-float-button' + ((scale <= 0.03) ? ' button-disabled' : '')} onClick={()=> this.handleZoom(-1)}><img className="inspector-page-float-button-image" src={(scale > 0.03) ? '/images/zoom-out.svg' : '/images/zoom-out_disabled.svg'} alt="-" /></button><br />
						<button className={'inspector-page-float-button' + ((scale === 1.0) ? ' button-disabled' : '')} onClick={()=> this.handleZoom(0)}><img className="inspector-page-float-button-image" src={(scale !== 1.0) ? '/images/zoom-reset.svg' : '/images/zoom-reset_disabled.svg'} alt="0" /></button>
					</div>
					<div className="inspector-page-toggle-wrapper">
						<SliceToggle type="hotspot" selected={visibleTypes.hotspot} onClick={()=> this.handleSliceToggle('hotspot')} />
						<SliceToggle type="slice" selected={visibleTypes.slice} onClick={()=> this.handleSliceToggle('slice')} />
						<SliceToggle type="textfield" selected={visibleTypes.textfield} onClick={()=> this.handleSliceToggle('textfield')} />
						<SliceToggle type="group" selected={visibleTypes.group} onClick={()=> this.handleSliceToggle('group')} />
						<SliceToggle type="" selected={(visibleTypes.all)} onClick={()=> this.handleSliceToggle('all')} />
					</div>
				</div>
				<div className="inspector-page-panel">
					<div className="inspector-page-panel-content-wrapper">
						<div style={{overflowX:'auto'}}>
							<ul className="inspector-page-panel-tab-wrapper">
								{(files.map((file, i) => {
									return (<li className={'inspector-page-panel-tab' + ((this.state.selectedTab === i) ? ' inspector-page-panel-tab-selected' : '')} onClick={()=> this.handleTab(i)}>{file.title}</li>);
								}))}
							</ul>
						</div>
						<div className="inspector-page-panel-tab-content-wrapper">
							{(files.map((file, i) => {
								return ((i === this.state.selectedTab) ? <div className="inspector-page-panel-tab-content"><span dangerouslySetInnerHTML={{ __html : (file.contents) ? String(JSON.parse(file.contents)).replace(/ /g, '&nbsp;').replace(/\n/g, '<br />') : '' }} /></div> : null);
							}))}
						</div>
					</div>
					<div className="inspector-page-panel-button-wrapper">
						<button className="inspector-page-panel-button adjacent-button">Copy</button>
						<Dropzone className="inspector-page-dz-wrapper" onDrop={this.onDrop.bind(this)}>
							<button className="inspector-page-panel-button">Contribute</button>
						</Dropzone>
					</div>
					<div className="inspector-page-panel-content-wrapper">
						<ul className="inspector-page-panel-tab-wrapper">
							<li className={'inspector-page-panel-tab inspector-page-panel-tab-selected'}>Specs</li>
							<li className={'inspector-page-panel-tab'}>Parts</li>
						</ul>
						<div className="inspector-page-panel-tab-content-wrapper">
							<div className="inspector-page-panel-tab-content">
								<div className="inspector-page-panel-info-wrapper">
									{/*<Row><Column flexGrow={1}>System</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(artboard && artboard.system) ? artboard.system.title : ''}</Column></Row>*/}
									{/*<Row><Column flexGrow={1}>Author</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val"><a href={'mailto:' + ((artboard && artboard.system) ? artboard.system.author : '#')} style={{textDecoration:'none'}}>{(artboard && artboard.system) ? artboard.system.author : ''}</a></Column></Row>*/}
									{/*<Row><Column flexGrow={1}>Page</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(page) ? page.title : ''}</Column></Row>*/}
									{/*<Row><Column flexGrow={1}>Artboard</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(artboard) ? artboard.title : ''}</Column></Row>*/}
									{/*<Row><Column flexGrow={1}>Name</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? slice.title : ''} {(slice) ? '(' + slice.type.replace(/(\b\w)/gi, function(m) {return (m.toUpperCase());}) + ')' : ''}</Column></Row>*/}
									<Row><Column flexGrow={1}>Name:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? slice.title : ''}</Column></Row>
									{/*<Row><Column flexGrow={1}>Type</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? slice.type.replace(/(\b\w)/gi, function(m) {return (m.toUpperCase());}) : ''}</Column></Row>*/}
									{/*<Row><Column flexGrow={1}>Date:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? (new Intl.DateTimeFormat('en-US', tsOptions).format(Date.parse(slice.added))) : ''}</Column></Row>*/}
									<Row>
										<Column flexGrow={1} flexBasis={1}>Export Size:</Column>
										<Row flexGrow={1} flexBasis={1} className="inspector-page-panel-info-val">
											<div style={{width:'50%'}}>W: {(slice) ? slice.meta.frame.size.width : 0}px</div>
											<div style={{width:'50%', textAlign:'right'}}>H: {(slice) ? slice.meta.frame.size.height : 0}px</div>
										</Row>
									</Row>
									<Row>
										<Column flexGrow={1} flexBasis={1}>Position:</Column>
										<Row flexGrow={1} flexBasis={1} className="inspector-page-panel-info-val">
											<div style={{width:'50%'}}>X: {(slice) ? slice.meta.frame.origin.x : 0}px</div>
											<div style={{width:'50%', textAlign:'right'}}>Y: {(slice) ? slice.meta.frame.origin.y : 0}px</div>
										</Row>
									</Row>
									{/*<Row><Column flexGrow={1}>Scale</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(scaleSize + 'x')}</Column></Row>*/}
									<Row><Column flexGrow={1}>Rotation</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? slice.meta.rotation : 0}&deg;</Column></Row>
									<Row><Column flexGrow={1}>Opacity</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? (slice.meta.opacity * 100) : 100}%</Column></Row>
									<Row><Column flexGrow={1}>Fill:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? slice.meta.fillColor.toUpperCase() : ''}</Column></Row>
									<Row><Column flexGrow={1}>Border:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{''}</Column></Row>
									{(slice && slice.type === 'textfield') && (<div>
										{/*<Row><Column flexGrow={1}>Font</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice.meta.font.family) ? slice.meta.font.family : ''}</Column></Row>*/}
										<Row><Column flexGrow={1}>Font:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">San Francisco Text</Column></Row>
										<Row><Column flexGrow={1}>Font size:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice.meta.font.size + 'px')}</Column></Row>
										<Row><Column flexGrow={1}>Font color:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice.meta.font.color) ? slice.meta.font.color.toUpperCase() : ''}</Column></Row>
										<Row><Column flexGrow={1}>Text Alignment:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice.meta.font.lineHeight) ? (slice.meta.font.lineHeight + 'px') : ''}</Column></Row>
										<Row><Column flexGrow={1}>Font Line Height:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice.meta.font.lineHeight) ? (slice.meta.font.lineHeight + 'px') : ''}</Column></Row>
										<Row><Column flexGrow={1}>Font Letter Spacing:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice.meta.font.kerning) ? (slice.meta.font.kerning.toFixed(2) + 'px') : ''}</Column></Row>
										<Row><Column flexGrow={1}>Horizontal Alignment:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{'Left'}</Column></Row>
										<Row><Column flexGrow={1}>Vertical Alignment:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{'Top'}</Column></Row>
									</div>)}
									{(styles) && (<div>
										<Row><Column flexGrow={1}>Stroke:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(styles.stroke) ? (styles.stroke.position.toLowerCase().replace(/(\b\w)/gi, function(m) { return m.toUpperCase(); }) + ' S: ' + styles.stroke.thickness + ' ' + styles.stroke.color) : ''}</Column></Row>
										<Row><Column flexGrow={1}>Shadow:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(styles.shadow) ? ('X: ' + styles.shadow.offset.x + ' Y: ' + styles.shadow.offset.y + ' B: ' + styles.shadow.blur + ' S: ' + styles.shadow.spread) : ''}</Column></Row>
										<Row><Column flexGrow={1}>Inner Shadow:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(styles.innerShadow) ? ('X: ' + styles.innerShadow.offset.x + ' Y: ' + styles.innerShadow.offset.y + ' B: ' + styles.innerShadow.blur + ' S: ' + styles.shadow.spread) : ''}</Column></Row>
										<Row><Column flexGrow={1}>Blur:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(styles.innerShadow) ? ('X: ' + styles.innerShadow.offset.x + ' Y: ' + styles.innerShadow.offset.y + ' B: ' + styles.innerShadow.blur + ' S: ' + styles.shadow.spread) : ''}</Column></Row>
									</div>)}
									{(slice && slice.meta.padding) && (<Row>
										<Column flexGrow={1} flexBasis={1}>Padding:</Column>
										<Row flexGrow={1} flexBasis={1} className="inspector-page-panel-info-val">
											<div style={{width:'50%'}}>{(slice) ? slice.meta.padding.top : 0}px</div>
											<div style={{width:'50%'}}>{(slice) ? slice.meta.padding.left : 0}px</div>
											<div style={{width:'50%', textAlign:'right'}}>{(slice) ? slice.meta.padding.bottom : 0}px</div>
											<div style={{width:'50%', textAlign:'right'}}>{(slice) ? slice.meta.padding.right : 0}px</div>
										</Row>
									</Row>)}
									<Row><Column flexGrow={1}>Inner Padding:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{''}</Column></Row>
									<Row><Column flexGrow={1}>Blend:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? slice.meta.blendMode.toLowerCase().replace(/(\b\w)/gi, function(m) { return m.toUpperCase(); }) : ''}</Column></Row>
									<Row><Column flexGrow={1}>Date:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(slice) ? (new Intl.DateTimeFormat('en-US', tsOptions).format(Date.parse(slice.added))) : ''}</Column></Row>
									<Row><Column flexGrow={1}>Author:</Column><Column flexGrow={1} horizontal="end" className="inspector-page-panel-info-val">{(page) ? page.author : ''}</Column></Row>
								</div>
							</div>
						</div>
					</div>
					<div className="inspector-page-panel-button-wrapper">
						<button className="inspector-page-panel-button adjacent-button">Copy</button>
						<button className="inspector-page-panel-button">Download</button>
					</div>
				</div>

				{this.state.popup.visible && (
					<Popup content={this.state.popup.content} onComplete={()=> this.setState({ popup : { visible : false, content : '' }})} />
				)}
			</div>

			{(this.state.tooltip !== '') && (<div className="inspector-page-tooltip">
				{this.state.tooltip}
			</div>)}
		</div>);
	}
}

export default InspectorPage;
