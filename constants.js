/**
 * Created by zenit1 on 10/11/2016.
 */
"use strict";

const path = require('path');
const os   = require('os');
const home = os.homedir();

const WebRootFolder = process.env.BEAME_INSTA_DOC_ROOT || 'public';

const GatewayControllerPath    = '/beame-gw';
const XprsSigninPath           = `${GatewayControllerPath}/xprs-signin`;
const SigninPath               = `${GatewayControllerPath}/signin`;
const DCLSOfflinePath          = `${GatewayControllerPath}/offline`;
const LoginPath                = `${GatewayControllerPath}/login`;
const LogoutPath               = `${GatewayControllerPath}/logout`;
const ConfigData               = `${GatewayControllerPath}/config-data`;
const LogoutToLoginPath        = `${GatewayControllerPath}/login-reinit`;
const AppSwitchPath            = `${GatewayControllerPath}/choose-app`;
const GwAuthenticatedPath      = `${GatewayControllerPath}/authenticated`;
const RegisterPath             = `${GatewayControllerPath}/register`;
const DirectPath               = `${GatewayControllerPath}/direct-signin`;
const RegisterSuccessPath      = `${GatewayControllerPath}/register-success`;
const beame_server_folder_name = ".beame_server";
const BeameRootPath            = path.join(home, beame_server_folder_name);

const BeameAuthServerLocalPort = 65000;


const ConfigFolder      = "config";
const CredsConfigFolder = "creds";

const AppConfigFileName           = "app_config.json";
const CredsFileName               = "creds.json";
const CustomerAuthServersFileName = "auth_servers.json";
const SqliteDbConfigFileName      = "sqlite_config.json";


const CredsFolderPath             = path.join(BeameRootPath, CredsConfigFolder);
const CredsJsonPath               = path.join(BeameRootPath, CredsConfigFolder, CredsFileName);
const CustomerAuthServersJsonPath = path.join(BeameRootPath, CredsConfigFolder, CustomerAuthServersFileName);
const ConfigFolderPath            = path.join(BeameRootPath, ConfigFolder);
const AppConfigJsonPath           = path.join(BeameRootPath, ConfigFolder, AppConfigFileName);
const SqliteConfigJsonPath        = path.join(BeameRootPath, ConfigFolder, SqliteDbConfigFileName);

const DEFAULT_LOAD_BALANCER_URL = "https://may129m153e6emrn.bqnp2d2beqol13qn.v1.d.beameio.net";

const UniversalLinkUrl = 'https://zxppnyvi3leaqepc.mpk3nobb568nycf5.v1.d.beameio.net/';

const BeameLoginURL = "https://dev.login.beameio.net";

const LoadBalancerURL = process.env.BEAME_LOAD_BALANCER_URL || DEFAULT_LOAD_BALANCER_URL;

const EnvMode = {
	"Gatekeeper":           "Gatekeeper",
	"CentralLogin":         "CentralLogin",
	"DelegatedLoginMaster": "DelegatedLoginMaster",
};

/**
 * Registration sources
 * DON'T TOUCH, should by synchronized with backend services
 * @readonly
 * @enum {Number}
 */
const RegistrationSource = {
	"Unknown":        0,
	"NodeJSSDK":      1,
	"InstaSSL":       2,
	"InstaServerSDK": 3,
	"IOSSDK":         4
};

const RequestType = {
	"RequestWithFqdn":       "RequestWithFqdn",
	"RequestWithParentFqdn": "RequestWithParentFqdn",
	"RequestWithAuthServer": "RequestWithAuthServer",
};

const RegistrationMethod = {
	"Pairing": "Pairing",
	"Email":   "Email",
	"SMS":     "SMS",
};

const DelegatedLoginNotificationAction = {
	"Register":   "register",
	"UnRegister": "unregister"
};
/**
 * Sns Message Types
 * DON'T TOUCH, should by synchronized with backend services
 * @readonly
 * @enum {Number}
 */
const SnsMessageType                   = {
	Cert:   1,
	Revoke: 2,
	Delete: 3
};

const CredentialType = {
	ZeroLevel:                "ZeroLevel",
	GatewayServer:            "GatewayServer",
	BeameAuthorizationServer: "BeameAuthorizationServer",
	MatchingServer:           "MatchingServer",
	ExternalMatchingServer:   "ExternalMatchingServer",
	ExternalLoginServer:      "ExternalLoginServer",
	CustomerAuthServer:       "CustomerAuthServer"
};


const DbProviders = {
	"Sqlite":    "sqlite",
	"Couchbase": "couchbase"
};


const SetupServices = {
	"Admin":           {code: "ADMIN"},
	"MobilePhoto":     {code: "MOBILE_PHOTO", port: 65510},
	"MobileStream":    {code: "MOBILE_STREAM", port: 65511},
	"SampleChat":      {code: "SAMPLE_CHAT", port: 65512},
	"SampleFileShare": {code: "SAMPLE_FILE_SHARE", port: 65513},
	"RaspberryLight":  {code: "RASPBERRY_LIGHT", port: 65514}
};

const CookieNames = {
	"Logout":       "beame_logout_url",
	"Logout2Login": "beame_logout_to_login_url",
	"Login":        "beame_login_url",
	"CentralLogin": "beame_central_login_url",
	"Service":      "beame_service",
	"RegData":      "beame_reg_data",
	"Proxy":        "proxy_enabling_token",
	"UserInfo":     "beame_userinfo",
	"LoginData":    "usrInData"
};

module.exports = {
	BeameAuthServerLocalPort,
	RequestType,
	RegistrationMethod,
	RegistrationSource,
	EnvMode,
	LoadBalancerURL,
	BeameLoginURL,
	CredentialType,
	SnsMessageType,
	DelegatedLoginNotificationAction,
	SetupServices,
	DbProviders,
	CookieNames,
	AuthMode: {
		"SESSION":   "Session",
		"PROVISION": "Provision"
	},
	WebRootFolder,
	GatewayControllerPath,
	GwAuthenticatedPath,
	SigninPath,
	XprsSigninPath,
	LoginPath,
	LogoutPath,
	ConfigData,
	LogoutToLoginPath,
	AppSwitchPath,
	DCLSOfflinePath,
	RegisterPath,
	DirectPath,
	RegisterSuccessPath,
	UniversalLinkUrl,
	BeameRootPath,

	AppConfigFileName,
	CredsFileName,
	CustomerAuthServersFileName,
	SqliteDbConfigFileName,

	CredsFolderPath,
	CredsJsonPath,
	CustomerAuthServersJsonPath,
	ConfigFolderPath,
	AppConfigJsonPath,
	SqliteConfigJsonPath
};
