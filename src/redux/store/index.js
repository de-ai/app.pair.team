
import { push, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import cookie from 'react-cookies';
import { applyMiddleware, createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly';
import thunk from 'redux-thunk';

import { fetchComponentTypes, fetchDevices, fetchProducts, fetchUserProfile } from '../actions';
import * as actionCreators from '../actions';
import { onMiddleware, onMiddlewarePost, showingEntryModal } from '../middleware';
import rootReducer from '../reducers/index';

// import { SET_ROUTE_PATH, SET_TEAM, SET_PLAYGROUND, SET_COMMENT, COMMENT_CREATED } from '../../consts/action-types';
import { Modals, Pages } from '../../consts/uris.js';
import { LOG_STORE_PREFIX, LOG_STORE_POSTFIX } from '../../consts/log-ascii';

export const history = createBrowserHistory();


// const createLogActionStackTraceMiddleware = (actionTypes=[])=> {
//   const logActionStackTraceMiddleware = (storeAPI)=> (next)=> (action)=> {
//     if(action.type && actionTypes.includes(action.type)) {
//     	console.log('[|:|] Store', storeAPI.getState());
//       console.trace('[:|:]%s', 'TYPE:[”%s“] ACTION:[%s] NEXT:[%s] ', action.type, action, next, '[:|:]');
//     }

//     return (next(action));
//   };

//   return (logActionStackTraceMiddleware);
// };


// const stackTraceMiddleware = createLogActionStackTraceMiddleware(['@@router/LOCATION_CHANGE', SET_ROUTE_PATH, SET_TEAM, SET_PLAYGROUND, SET_COMMENT, COMMENT_CREATED]);



const composeEnhancers = composeWithDevTools({ actionCreators, trace : true, traceLimit : 32 }); // const store = createStore(rootReducer, compose(applyMiddleware(onMiddleware, thunk, stackTraceMiddleware)));
// const store = createStore(rootReducer(history), composeEnhancers(applyMiddleware(routerMiddleware(history), onMiddleware, thunk, stackTraceMiddleware)));
const store = createStore(rootReducer(history), composeEnhancers(applyMiddleware(routerMiddleware(history), onMiddleware, thunk)));



// -- orf
// const store = createStore(rootReducer(history), composeWithDevTools(applyMiddleware(routerMiddleware(history), onMiddleware, thunk, stackTraceMiddleware)));


console.log(LOG_STORE_PREFIX, '-=-=-=STORE INIT=-=-=-', { store : store.getState(), cookie : (typeof cookie.load('user_id')) }, LOG_STORE_POSTFIX);
if (typeof cookie.load('user_id') === 'undefined' || (cookie.load('user_id') << 0) === 0) {
  console.log(LOG_STORE_PREFIX, 'cookie UNDEFINED', LOG_STORE_POSTFIX);
  // cookie.save('user_id', '0', { path : '/', sameSite : false });
  const { hash } = store.getState().router.location;

  console.log(LOG_STORE_PREFIX, 'STORE SAYS SHOW MODAL!!!!', { store : store.getState(), modal : showingEntryModal(hash) }, LOG_STORE_POSTFIX);
  if (!showingEntryModal(hash)) {
    store.dispatch(push(`${Pages.TEAM}${Modals.LOGIN}`));
  }

} else {
  store.dispatch(fetchUserProfile());
}

store.dispatch(fetchComponentTypes());
store.dispatch(fetchDevices());
store.dispatch(fetchProducts());

export default store;