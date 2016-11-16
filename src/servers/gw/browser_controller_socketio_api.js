'use strict';

const socket_io   = require('socket.io');
const beameSDK    = require('beame-sdk');
const Constants   = require('../../../constants');

// TODO: Session renewal?
const messageHandlers = {
	'auth': function(payload) {
		// TODO: check which token
		// TODO: return apps list + session token
		// --- answer ---
		// type: 'authenticated'
		// payload: {success: true/false, apps: [{'App Name': app_d}, ...]}
	},
	'choose': function(payload) {
		// Choose application - redirect app switchig URL on GW, auth token in URL
		// --- answer ---
		// type: 'redirect'
		// payload: {success: true/false, url: ...}
	},
	'logout': function(payload) {
		// Redirect to cookie removing URL on GW
		// --- answer ---
		// type: 'redirect'
		// payload: {success: true/false, logout:true, url: ...}
	}
};

function sendError(client, error) {
	client.emit('data', JSON.stringify({type: 'error', payload: error}));
}

function onConnection(client) {
	// Browser controller will connect here
	console.log('[GW] handleSocketIoConnect');
	client.on('data', data => {
		try {
			data = JSON.parse(data);
		} catch(e) {
			// nothing
		}
		if (!data || !data.type || !data.payload) {
			return sendError(client, 'Data must have "type" and "payload" fields');
		}
		if (!messageHandlers[data.type]) {
			return sendError(client, `Don't know how to handle message of type ${data.type}`);
		}
		client.emit('data', JSON.stringify(messageHandlers[data.type](data.payload)));
	});
}

// server - https.Server
function start(server) {
	const io = socket_io(server, {path: `${Constants.GatewayControllerPath}/socket.io`});
	io.on('connection', onConnection);
}

module.exports = {
	start
};
