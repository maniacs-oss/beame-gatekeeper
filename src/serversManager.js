/**
 * Created by zenit1 on 10/11/2016.
 */
"use strict";
const async = require('async');

const apiConfig   = require('../config/api_config.json');
const beameSDK    = require('beame-sdk');
const module_name = "ServersManager";
const BeameLogger = beameSDK.Logger;
const logger      = new BeameLogger(module_name);

const CommonUtils       = beameSDK.CommonUtils;
const Bootstrapper      = require('./bootstrapper');
const bootstrapper      = Bootstrapper.getInstance();
const Constants         = require('../constants');
const BeameAuthServices = require('./authServices');

class ServersManager {

	constructor(serversSettings, _serviceManager) {

		if (CommonUtils.isObjectEmpty(serversSettings)) {
			logger.error(`Creds settings required`);
			process.exit(1);
		}

		this._serviceManager = _serviceManager;
		this._settings       = serversSettings;
		this._servers        = {};
	}

	start() {


		const _startMatching  = () => {
			return new Promise((resolve, reject) => {

					const externalMatchingFqdn = bootstrapper.externalMatchingFqdn;

					if (!externalMatchingFqdn) {

						new BeameAuthServices(this._settings.BeameAuthorizationServer.fqdn, this._settings.MatchingServer.fqdn);

						const MatchingServer = require('BeameMatchingServer').Server;

						let matching_server = new MatchingServer(this._settings.MatchingServer.fqdn, null, [this._settings.GatewayServer.fqdn, this._settings.BeameAuthorizationServer.fqdn]);

						matching_server.start((error, app) => {
							if (!error) {
								logger.info(`Matching server started on https://${this._settings.MatchingServer.fqdn}`);
								this._servers[Constants.CredentialType.MatchingServer] = app;
								resolve();
							}
							else {
								reject(error);
							}
						});

					}
					else {

						new BeameAuthServices(this._settings.BeameAuthorizationServer.fqdn, externalMatchingFqdn);

						const _registerClientOnMatching = (fqdn) => {

							return new Promise((resolve, reject) => {
									try {
										const ProvisionApi      = beameSDK.ProvApi,
										      BeameAuthServices = require('./authServices'),
										      authServices      = BeameAuthServices.getInstance();


										let sign         = authServices.signData(fqdn),
										    provisionApi = new ProvisionApi(),
										    url          = `${externalMatchingFqdn}${apiConfig.Actions.Matching.RegisterClient.endpoint}/${fqdn}`,
										    data         = {
											    fqdn:       fqdn,
											    public_key: ''
										    };

										provisionApi.postRequest(`https://${url}`, data, (error) => {
											if (error) {
												reject(error);
											}
											else {
												resolve();
											}
										}, sign);
									} catch (e) {
										reject(e);
									}
								}
							);
						};

						bootstrapper.updateCredsFqdn(externalMatchingFqdn, Constants.CredentialType.ExternalMatchingServer)
							.then(_registerClientOnMatching.bind(this, this._settings.GatewayServer.fqdn))
							.then(_registerClientOnMatching.bind(this, this._settings.BeameAuthorizationServer.fqdn))
							.then(resolve).catch(reject);
					}

				}
			);
		};
		const _startBeameAuth = () => {
			return new Promise((resolve, reject) => {
					const BeameAuthServer = require('../src/servers/beame_auth/server');

					let beame_auth_server = new BeameAuthServer(this._settings.BeameAuthorizationServer.fqdn, this._settings.ExternalMatchingServer.fqdn || this._settings.MatchingServer.fqdn);

					beame_auth_server.start((error, app) => {
						if (!error) {
							logger.info(`Beame Auth server started on https://${this._settings.BeameAuthorizationServer.fqdn}`);
							this._servers[Constants.CredentialType.BeameAuthorizationServer] = app;
							resolve()
						}
						else {
							reject(error);
						}
					});
				}
			);
		};
		const _startGateway   = () => {
			return new Promise((resolve, reject) => {
					logger.debug('SETTINGS', this._settings);
					const gws = new (require('./servers/gw/gateway'))(this._settings.GatewayServer.fqdn, this._settings.ExternalMatchingServer.fqdn || this._settings.MatchingServer.fqdn, this._serviceManager);
					gws.start((error, app) => {
						if (!error) {
							logger.info(`Gateway server started on https://${this._settings.GatewayServer.fqdn}`);
							this._servers[Constants.CredentialType.GatewayServer] = app;
							resolve(null);
						}
						else {
							reject(error);
						}
					});
				}
			);
		};

		const _registerCustomerAuthServer = () =>{
			return bootstrapper.registerCustomerAuthServer(this._settings.GatewayServer.fqdn);
		};

		async.parallel([
				callback => {
						_startMatching()
						.then(_startBeameAuth.bind(this))
						.then(_startGateway.bind(this))
						.then(_registerCustomerAuthServer.bind(this))
						.then(callback)
						.catch(error => {
							callback(error)
						});

				},
				callback => {
					let chatApp = new (require('../apps/chat'))();
					chatApp.start();
					callback();
				},
				callback => {
					let fileApp = new (require('../apps/files'))();
					fileApp.start();
					callback();
				},
				callback => {
					let mobilePhotoApp = new (require('../apps/photo'))();
					mobilePhotoApp.start();
					callback();
				},
				callback => {
					let mobileStreamApp = new (require('../apps/stream'))();
					mobileStreamApp.start();
					callback();
				},
				callback => {

					let raspberryApp = new (require('../apps/rasp'))();
					raspberryApp.start();
					callback();
				}
			],
			error => {
				if (error) {

					for (let type in this._servers) {
						//noinspection JSUnfilteredForInLoop
						let server = this._servers[type];

						if (server.stop && typeof  server.stop == "function") {
							server.stop();
						}
					}

					logger.fatal(`server starting error: ${BeameLogger.formatError(error)}`);
				}
				else {
					logger.info(`Servers started successfully`);
				}
			});

	}

	static go(serviceManager, serversSettings) {
		return (new ServersManager(serversSettings, serviceManager)).start();
	}
}


module.exports = ServersManager;
