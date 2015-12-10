#!/bin/bash
if [ -z "$HOME" ]; then
	echo "ERROR: 'HOME' environment variable is not set!"
	exit 1
fi
# Source https://github.com/bash-origin/bash.origin
. "$HOME/.bash.origin"
function init {
	eval BO_SELF_BASH_SOURCE="$BO_READ_SELF_BASH_SOURCE"
	BO_deriveSelfDir ___TMP___ "$BO_SELF_BASH_SOURCE"
	local __BO_DIR__="$___TMP___"

	__BO_DIR__CONTAINER_CIRCLECI__="$__BO_DIR__"


	# Automatically install on first use.
	pushd "$__BO_DIR__CONTAINER_CIRCLECI__" > /dev/null
	    if [ ! -e "node_modules" ]; then
		    BO_log "$VERBOSE" "Installing dependenceis for 'container-for-circleci' ..."
	    	BO_run_npm install
	   	fi
	popd > /dev/null


	function setSecureEnvironmentVariables {
		BO_format "$VERBOSE" "HEADER" "Set circleci secure environment variables ..."

		# TODO: Look for the token in various places.
		if [ -z "$Z0_BUILD_CIRCLECI_API_TOKEN" ]; then
			echo "ERROR: 'Z0_BUILD_CIRCLECI_API_TOKEN' environment variable not set!"
			exit 1
		fi

		BO_run_node "$__BO_DIR__CONTAINER_CIRCLECI__/setSecureEnvironmentVariables.js" $@

		BO_format "$VERBOSE" "FOOTER"
	}
}
init $@