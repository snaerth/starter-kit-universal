import { combineReducers } from 'redux';
import { reducer as form } from 'redux-form';
import authReducer from './components/auth/reducer';
import editorReducer from './components/mediumEditor/reducer';
import logsReducer from './components/logger/reducer';
import usersReducer from './components/users/reducer';
import commonReducer from './common/reducer';

const rootReducer = combineReducers({
  common: commonReducer,
  form,
  auth: authReducer,
  editor: editorReducer,
  logs: logsReducer,
  users: usersReducer,
});

export default rootReducer;
