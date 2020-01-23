
import cookie from 'react-cookies';
import { applyMiddleware, createStore, compose } from 'redux';
import thunk from 'redux-thunk';

import { fetchComponentTypes, fetchEventGroups, fetchProducts, fetchUserProfile } from '../actions';
import { onMiddleware } from '../middleware';
import rootReducer from '../reducers';


const createLogActionStackTraceMiddleware = (actionTypes=[])=> {
  const logActionStackTraceMiddleware = (storeAPI)=> (next)=> (action)=> {
    if(action.type && actionTypes.includes(action.type)) {
//-/>     	console.log('[|:|] Store', storeAPI.getState());
//       console.trace('[:|:] "%s"', action.type, action);
    }

    return (next(action));
  };

  return (logActionStackTraceMiddleware);
};


const stackTraceMiddleware = createLogActionStackTraceMiddleware(['SET_PLAYGROUND', 'SET_TYPE_GROUP', 'SET_COMPONENT']);


// const store = createStore(rootReducer, applyMiddleware(onMiddleware, thunk));
const store = createStore(rootReducer, compose(applyMiddleware(onMiddleware, thunk, stackTraceMiddleware)));


// start filling store
if (typeof cookie.load('user_id') === 'undefined') {
	cookie.save('user_id', '0', { path : '/', sameSite : false });

} else {
	store.dispatch(fetchUserProfile());
}

store.dispatch(fetchComponentTypes());
store.dispatch(fetchEventGroups());
store.dispatch(fetchProducts());



export default store;
