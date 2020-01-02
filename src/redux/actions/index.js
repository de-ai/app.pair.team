
import axios from 'axios';
import { Bits, Objects } from 'lang-js-utils';
import cookie from 'react-cookies';

import {
	COMPONENT_TYPES_LOADED,
	EVENT_GROUPS_LOADED,
	SET_REDIRECT_URI,
	USER_PROFILE_ERROR,
	UPDATE_DEEPLINK,
	UPDATE_MOUSE_COORDS,
// 	USER_PROFILE_CACHED,
	USER_PROFILE_LOADED,
	USER_PROFILE_UPDATED,
// 	CONVERTED_DEEPLINK,
	SET_INVITE,
	SET_TEAMS,
	SET_PRODUCTS,
	SET_PLAYGROUND,
	SET_TYPE_GROUP,
	SET_COMPONENT,
	SET_COMMENT,
	TOGGLE_THEME,
	UPD_PATHNAME
} from '../../consts/action-types';
import { LOG_ACTION_PREFIX } from '../../consts/log-ascii';
import { API_ENDPT_URL } from '../../consts/uris';


const logFormat = (action, payload=null, meta='')=> {
	console.log(LOG_ACTION_PREFIX, `ACTION >> ${action}`, (payload || ''), meta);
};

export function fetchComponentTypes() {
	logFormat('fetchComponentTypes()');

	return ((dispatch)=> {
		axios.post(API_ENDPT_URL, {
			action  : 'COMPONENT_TYPES',
			payload : null
		}).then((response) => {
			console.log('COMPONENT_TYPES', response.data);
			dispatch({
				type    : COMPONENT_TYPES_LOADED,
				payload : response.data.component_types
			});

		}).catch((error)=> {
		});
	});
}

export function fetchEventGroups() {
	logFormat('fetchEventGroups()');

	return ((dispatch)=> {
		axios.post(API_ENDPT_URL, {
			action  : 'EVENT_GROUPS',
			payload : null
		}).then((response) => {
			console.log('EVENT_GROUPS', response.data);

			dispatch({
				type    : EVENT_GROUPS_LOADED,
				payload : response.data.event_groups.map((eventGroup)=> {
					const events = eventGroup.event_types;
					delete (eventGroup['event_types']);

					return ({ ...eventGroup, events });
				})
			});

		}).catch((error)=> {
		});
	});
}

export function fetchProducts() {
	logFormat('fetchProducts()');

	return ((dispatch)=> {
		axios.post(API_ENDPT_URL, {
			action  : 'PRODUCTS',
			payload : null
		}).then((response) => {
			console.log('PRODUCTS', response.data);

			dispatch({
				type    : SET_PRODUCTS,
				payload : response.data.products.map((product)=> {
					return ({ ...product });
				}).sort((i, j)=> ((i.price < j.price) ? -1 : (i.price > j.price) ? 1 : 0))
			});

		}).catch((error)=> {
		});
	});
}

export function fetchUserProfile() {
	logFormat('fetchUserProfile()');

	return ((dispatch)=> {
		axios.post(API_ENDPT_URL, {
			action  : 'USER_PROFILE',
			payload : { user_id : cookie.load('user_id') << 0 }
		}).then((response) => {
			console.log('USER_PROFILE', response.data);

			Objects.renameKey(response.data.user, 'github_auth', 'github');
			if (response.data.user.github) {
				Objects.renameKey(response.data.user.github, 'access_token', 'accessToken');
			}

			const { id, type, github } = response.data.user;
			dispatch({
				type    : USER_PROFILE_LOADED,
				payload : { ...response.data.user,
					id     : id << 0,
					status : 0x00,
					github : (github) ? { ...github,
						id : github.id << 0
					} : github,
					paid   : type.includes('paid')
				}
			});
		}).catch((error)=> {
		});
	});
}

/*
export function fetchUserHistory(payload) {
	logFormat('fetchUserHistory()', payload);

	return ((dispatch)=> {
		if (payload.profile) {
			const { profile, loadOffset, loadAmt } = payload;

			axios.post(API_ENDPT_URL, {
				action  : 'PLAYGROUND_HISTORY',
				payload : {
					user_id : profile.id,
					offset  : (loadOffset || 0),
					length  : (loadAmt || -1)
				}
			}).then((response) => {
				console.log('PLAYGROUND_HISTORY', response.data);

				const artboards = response.data.artboards.filter((artboard)=> (artboard)).map((artboard)=> ({
					id        : artboard.id << 0,
					pageID    : artboard.page_id << 0,
					uploadID  : artboard.upload_id << 0,
					title     : artboard.page_title,
					pageTitle : artboard.title,
					filename  : artboard.filename,
					creator   : artboard.creator,
					meta      : JSON.parse(artboard.meta),
					added     : artboard.added
				}));

				if (artboards.length > 0) {
					dispatch({
						type    : APPEND_HOME_ARTBOARDS,
						payload : artboards
					});
				}
			}).catch((error)=> {
			});
		}
	});
}
*/

export function fetchTeamLookup(payload) {
	logFormat('fetchTeamLookup()', payload);

	return ((dispatch)=> {
		const { userID } = payload;

		axios.post(API_ENDPT_URL, {
			action  : 'TEAM_LOOKUP',
			payload : {
				user_id : userID
			}
		}).then((response) => {
			console.log('TEAM_LOOKUP', response.data);
			const { teams } = response.data;

			if (teams.length > 0) {
				dispatch({
					type    : SET_TEAMS,
					payload : teams.map((team)=> ({ ...team,
						members : team.members.map((member)=> ({ ...member,
							id : member.id << 0
						}))
					}))
				});
			}
		}).catch((error)=> {
		});
	});
}

export function setInvite(payload) {
	logFormat('setInvite()', payload);
	return ({ payload,
		type : SET_INVITE
	});
}

export function setPlayground(payload) {
	logFormat('setPlayground()', payload);
	return ({ payload,
		type : SET_PLAYGROUND
	});
}

export function setTypeGroup(payload) {
	logFormat('setTypeGroup()', payload);
	return ({ payload,
		type : SET_TYPE_GROUP
	});
}

export function setComponent(payload) {
	logFormat('setComponent()', payload);
	return ({ payload,
		type : SET_COMPONENT
	});
}

export function setComment(payload) {
	logFormat('setComment()', payload);
	return ({ payload,
		type : SET_COMMENT
	});
}

export function setRedirectURI(payload) {
	return ({ payload,
		type : SET_REDIRECT_URI
	});
}

export function toggleTheme(payload=null) {
  logFormat('toggleTheme()', payload);
  return ({ payload,
    type : TOGGLE_THEME
  });
}

export function updatePathname(payload=null) {
  logFormat('updatePathname()', payload);
  return ({ payload,
    type : UPD_PATHNAME
  });
}

export function updateDeeplink(payload) {
	return ({ payload,
		type : UPDATE_DEEPLINK
	});

// 	const cnt = (payload) ? Object.keys(payload).filter((key)=> (payload && typeof payload[key] === 'number')).length : 0;
// 	return ({ payload,
// 		type : (!payload || Object.keys(payload).length !== cnt) ? UPDATE_DEEPLINK : CONVERTED_DEEPLINK
// 	});
}


export function updateMouseCoords(payload) {
// 	logFormat('updateMouseCoords()', payload);
	return ({ payload,
		type : UPDATE_MOUSE_COORDS
	});
}

export function updateUserProfile(payload, force=true) {
	logFormat('updateUserProfile()', payload, force);

	if (payload) {
		Objects.renameKey(payload, 'github_auth', 'github');

		if (payload.github) {
			Objects.renameKey(payload.github, 'access_token', 'accessToken');
		}

		const { id, github } = payload;
		payload = {
			...payload,
			id     : id << 0,
			github : (github) ? {
				...github,
				id : github.id << 0
			} : github
		};

		if (payload.hasOwnProperty('password') && payload.password === '') {
			delete (payload.password);
		}
	}


	if (!force) {
		return((dispatch)=> {
			dispatch({ payload,
				type : USER_PROFILE_UPDATED
			});
		});
	}

	return ((dispatch)=> {
		if (payload) {
			const { id } = payload;
			axios.post(API_ENDPT_URL, {
				action  : 'UPDATE_USER_PROFILE',
				payload : { ...payload,
					user_id  : id,
// 					filename : avatar
				}
			}).then((response) => {
				console.log('UPDATE_USER_PROFILE', response.data);

				const status = parseInt(response.data.status, 16);
				Objects.renameKey(response.data.user, 'github_auth', 'github');
				if (response.data.user.github) {
					Objects.renameKey(response.data.user.github, 'access_token', 'accessToken');
				}

				const { id, username, email, type, github } = response.data.user;
				dispatch({
					type    : (status === 0x00) ? USER_PROFILE_UPDATED : USER_PROFILE_ERROR,
					payload : { ...response.data.user,
						status   : status,
						id       : id << 0,
						username : (Bits.contains(status, 0x01)) ? 'Username Already in Use' : username,
						email    : (Bits.contains(status, 0x10)) ? 'Email Already in Use' : email,
						github : (github) ? { ...github,
							id : github.id << 0
						} : github,
						paid     : type.includes('paid')
					}
				});
			}).catch((error)=> {
			});

		} else {
			cookie.save('user_id', '0', { path : '/', sameSite : false });

			dispatch({
				type    : USER_PROFILE_UPDATED,
				payload : null
			});
		}
	});
}
