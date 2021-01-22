/* 
controller.js
High level code organizer. Refer to the imported files and functionality for details.
 */
'use strict';

const constants = require('./constants');

const server = require('./server-setup');
const events = require('./socket-events');

/* First, set up the web server. */

var io = server.setUpServer();

/* Then, add event listeners to the server socket */

events.setUpSocketEvents(io);