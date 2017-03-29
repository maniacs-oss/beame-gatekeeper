#!/usr/bin/env zsh

set -eu

err_trap_func() {
	echo "ERROR: Command failed"
}

find_unused_id() {
	typeset -A ids
	for id in $("$@" | awk '{print $2}');do
		ids[$id]=1
	done
	for ((candidate_id=500; candidate_id>0; candidate_id--));do
		if [[ ! ${ids[$candidate_id]-} ]];then
			echo $candidate_id
			return
		fi
	done
	echo "Could not find free ID in output of command: $@" >&2
	exit 1
}

trap err_trap_func ERR

if [[ $EUID -ne 0 ]]; then
   echo "Please run this script as root."
   exit 1
fi

: ${BEAME_GATEKEEPER_USER:=_beame-gatekeeper}
: ${BEAME_GATEKEEPER_GROUP:="$BEAME_GATEKEEPER_USER"}
: ${BEAME_GATEKEEPER_HOME:="/var/${BEAME_GATEKEEPER_USER/_/}"}
: ${BEAME_GATEKEEPER_SVC:=beame-gatekeeper}
: ${BEAME_GATEKEEPER_SYSTEMD_FILE:="/etc/systemd/system/$BEAME_GATEKEEPER_SVC.service"}
: ${BEAME_GATEKEEPER_SYSTEMD_EXTRA:=''}
: ${BEAME_GATEKEEPER_DIR:=${0:A:h:h}}
: ${BEAME_GATEKEEPER_EMBEDED_SDK:="$BEAME_GATEKEEPER_DIR/node_modules/beame-sdk/src/cli/beame.js"}
: ${BEAME_GATEKEEPER_BIN:="$BEAME_GATEKEEPER_DIR/main.js"}

if type node;then
	: ${BEAME_GATEKEEPER_NODEJS_BIN:=$(which node)}
else
	: ${BEAME_GATEKEEPER_NODEJS_BIN:=$(which nodejs)}
fi

if [[ $BEAME_GATEKEEPER_NODEJS_BIN ]];then
	echo "+ Using NodeJS at $BEAME_GATEKEEPER_NODEJS_BIN"
else
	echo "+ NodeJS not found"
	exit 2
fi

echo "+ Checking NodeJS version. Expecting Node 6."
v="$("$BEAME_GATEKEEPER_NODEJS_BIN" -v)"
v="${v:1}"

if [[ $v =~ ^[6]\. ]];then
	echo "+ Node 6 detected - OK"
else
	echo "+ ERROR: Node version $v detected but beame-gatekeeper requires node version 6"
	exit 10
fi

if ! type jq &>/dev/null;then
	echo "+ jq not found. Please install jq."
fi

# http://serverfault.com/questions/182347/add-daemon-account-on-os-x

if dscl . -read "/Groups/$BEAME_GATEKEEPER_GROUP" &>/dev/null;then
	echo "+ Group $BEAME_GATEKEEPER_GROUP already exists"
else
	echo "+ Adding group for Beame Gatekeeper: $BEAME_GATEKEEPER_GROUP"
	gid=$(find_unused_id dscl . -ls /Groups gid)
	base_argv=(dscl . -create "/Groups/$BEAME_GATEKEEPER_GROUP")
	"${base_argv[@]}"
	"${base_argv[@]}" Password '*'
	"${base_argv[@]}" PrimaryGroupID "$gid"
	"${base_argv[@]}" RealName "Beame Gatekeeper"
	"${base_argv[@]}" RecordName "$BEAME_GATEKEEPER_GROUP" "${BEAME_GATEKEEPER_GROUP/_/}"
fi

if dscl . -read "/Users/$BEAME_GATEKEEPER_USER" &>/dev/null;then
	echo "+ User $BEAME_GATEKEEPER_USER already exists"
else
	echo "+ Adding user for Beame Gatekeeper: $BEAME_GATEKEEPER_USER"
	uid=$(find_unused_id dscl . -ls /Users uid)
	base_argv=(dscl . -create "/Users/$BEAME_GATEKEEPER_USER")
	"${base_argv[@]}"
	"${base_argv[@]}" NFSHomeDirectory "$BEAME_GATEKEEPER_HOME"
	"${base_argv[@]}" Password '*'
	"${base_argv[@]}" PrimaryGroupID "$(dscl . -read /Groups/"$BEAME_GATEKEEPER_GROUP" PrimaryGroupID | awk '{print $2}')"
	"${base_argv[@]}" RealName "Beame Gatekeeper"
	"${base_argv[@]}" RecordName "$BEAME_GATEKEEPER_USER" "${BEAME_GATEKEEPER_USER/_/}"
	"${base_argv[@]}" UniqueID "$uid"
	"${base_argv[@]}" UserShell /usr/bin/false
	dscl . -delete "/Users/$BEAME_GATEKEEPER_USER" AuthenticationAuthority
	dscl . -delete "/Users/$BEAME_GATEKEEPER_USER" PasswordPolicyOptions
fi

if [[ -d "$BEAME_GATEKEEPER_HOME" ]];then
	echo "+ Beame Gatekeeper home directory $BEAME_GATEKEEPER_HOME already exists"
else
	echo "+ Creating Beame Gatekeeper home directory $BEAME_GATEKEEPER_HOME"
	mkdir "$BEAME_GATEKEEPER_HOME"
	chown "$BEAME_GATEKEEPER_USER":"$BEAME_GATEKEEPER_GROUP" "$BEAME_GATEKEEPER_HOME"
fi

if SHELL=/bin/zsh sudo -H -u "$BEAME_GATEKEEPER_USER" -s '[[ -e ~/.beame ]]';then
	echo "+ .beame directory for user $BEAME_GATEKEEPER_USER exists. Not getting credentials."
else
	echo "+ .beame directory for user $BEAME_GATEKEEPER_USER does not exist. Getting credentials."

	if [[ ${1-} ]];then
		echo "+ Using provided token: $1"
		token="$1"
	else
		echo "+ Token not provided as command line argument. Looking for root (top level) credentials to create token with."
		if [[ ${SUDO_USER-} ]];then
			echo "+ Taking root credentials user from SUDO_USER"
			ROOT_CREDENENTIALS_USER=$SUDO_USER
		else
			ROOT_CREDENENTIALS_USER=$(id -un)
		fi
		echo "+ Root credentials user: $ROOT_CREDENENTIALS_USER"
		ROOT_CREDENENTIALS_HOME="$(dscl . -read /Users/"$ROOT_CREDENENTIALS_USER" NFSHomeDirectory | awk '{print $2}')"
		echo "+ Root credentials home directory: $ROOT_CREDENENTIALS_HOME"

		echo "+ Searching for root credentials"
		ROOT_CREDENENTIALS=$(sudo -H -u "$ROOT_CREDENENTIALS_USER" -s "'$BEAME_GATEKEEPER_NODEJS_BIN' '$BEAME_GATEKEEPER_EMBEDED_SDK' creds list --format json" | jq -r '.[].metadata.fqdn' | grep -E '^.{16}.v1.p.beameio.net' | grep -v '^$' | head -n 1)
		exit 100
		if [[ $ROOT_CREDENENTIALS ]]; then
			echo "+ Root FQDN detected: $ROOT_CREDENENTIALS"
			echo "+ Getting token as child of $ROOT_CREDENENTIALS"
			token=$(su -c "'$BEAME_GATEKEEPER_NODEJS_BIN' '$BEAME_GATEKEEPER_EMBEDED_SDK' creds getRegToken --fqdn '$ROOT_CREDENENTIALS' --name 'Gatekeeper-$HOSTNAME'" "$ROOT_CREDENENTIALS_USER")
			echo "+ Got token: $token"
		else
			echo "+ Root credentials were not found (creds list had no matching entries) and no token supplied. Can not create token."
			echo "----------------------------------------------------------------------------------------------------"
			echo "Please go to https://ypxf72akb6onjvrq.ohkv8odznwh5jpwm.v1.p.beameio.net/gatekeeper and complete your registration process"
			echo "then run this script with the token from email:"
			echo "$0 TOKEN_FROM_EMAL"
			echo "----------------------------------------------------------------------------------------------------"
			exit 5
		fi
	fi

	echo "+ Getting Beame Gatekeeper credentials"
	su -s /bin/bash -c "'$BEAME_GATEKEEPER_NODEJS_BIN' '$BEAME_GATEKEEPER_BIN' creds getCreds --regToken '$token'" "$BEAME_GATEKEEPER_USER"
fi

