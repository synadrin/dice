#!/bin/bash

function show_help {
	echo "${0} -c config_file -o output_dir"
}


CONFIG_FILE=""

while getopts "c:o:" option; do
	case "${option}" in
		c)
			CONFIG_FILE=${OPTARG}
			;;
	esac
done

if [[ -z "${CONFIG_FILE}" ]]; then
	show_help
	exit 1
fi

CONFIG_DIR=$(dirname $(realpath "${CONFIG_FILE}"))
. "${CONFIG_FILE}"

TOP_DIR=$(dirname $(realpath "${0}"))

export DEBUG
export WEBSOCKET_HOSTNAME
export WEBSOCKET_PORT
export WEBSOCKET_USE_TLS
export WEBSOCKET_CERT_FILE
python3 -u "${TOP_DIR}/dice_server.py"
