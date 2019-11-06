
import cookie from 'react-cookies';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

import { fetchComponentTypes, fetchEventGroups, fetchUserProfile } from '../actions';
import rootReducer from '../reducers/index';
import { onMiddleware } from '../middleware'


const store = createStore(rootReducer, applyMiddleware(onMiddleware, thunk));


if (typeof cookie.load('user_id') === 'undefined') {
	cookie.save('user_id', '0', { path : '/' });

} else {
	store.dispatch(fetchUserProfile());
}

store.dispatch(fetchComponentTypes());
store.dispatch(fetchEventGroups());


export default store;
