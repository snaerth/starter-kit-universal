/* eslint-disable no-console */

import express from 'express';
import { resolve as pathResolve } from 'path';
import appRootDir from 'app-root-dir';
import Proxy from './middleware/proxy';
import middleware from './middleware';
import reactApplication from './middleware/reactApplication';
import clientBundle from './middleware/clientBundle';
import serviceWorker from './middleware/serviceWorker';
import offlinePage from './middleware/offlinePage';
import errorHandlers from './middleware/errorHandlers';
import enforceHttps from './middleware/enforceHttps';
import config from '../config';

// https://github.com/facebook/react/issues/812#issuecomment-172929366
process.env = JSON.parse(JSON.stringify(process.env));

// Api target
const target = `${config('apiProtocol')}://${config('apiHost')}:${config('apiPort')}`;

// Create our express based server.
const app = express();

// Apply middleware to app
app.use(middleware());

// Don't expose any software information to potential hackers.
app.disable('x-powered-by');

// Initialize proxy server
Proxy({ app, target });

// Register our service worker generated by our webpack config.
// We do not want the service worker registered for development builds, and
// additionally only want it registered if the config allows.
if (process.env.BUILD_FLAG_IS_DEV === 'false' && config('serviceWorker.enabled')) {
  app.get(`/${config('serviceWorker.fileName')}`, serviceWorker);
  app.get(
    `${config('bundles.client.webPath')}${config('serviceWorker.offlinePageFileName')}`,
    offlinePage,
  );
}

// Proxy hot module reload development server when flagged to do so.
if (process.env.BUILD_FLAG_IS_DEV === 'true' && config('clientDevProxy')) {
  app.use(require('./middleware/devServerProxy').default);
}

if (process.env.BUILD_FLAG_IS_DEV === 'false' && config('enforceHttps')) {
  app.use(enforceHttps);
}

// Configure serving of our client bundle.
app.use(config('bundles.client.webPath'), clientBundle);

// Configure static serving of our "public" root http path static files.
// Note: these will be served off the root (i.e. '/') of our application.
app.use(express.static(pathResolve(appRootDir.get(), config('publicAssetsPath'))));
app.use('/media', express.static(pathResolve(appRootDir.get(), config('secondPublicAssetsPath'))));

// The React application middleware.
app.get('*', reactApplication);

// Error Handler middlewares.
app.use(...errorHandlers);

// Create an http listener for our express app.
const listener = app.listen(config('port'), () =>
  console.log(`Server listening on port ${config('port')}`));

// We export the listener as it will be handy for our development hot reloader,
// or for exposing a general extension layer for application customisations.
export default listener;
