#!/bin/bash

function show_help {
	echo "${0} -c config_file"
}

function parse_file {
	if [[ -z "${1}" || -z "${2}" ]]; then
		return 1
	fi

	fileContent=$(cat "${1}")
	fileContent=${fileContent//"{DEBUG}"/"${DEBUG}"}
	fileContent=${fileContent//"{WEBSOCKET_HOSTNAME}"/"${WEBSOCKET_HOSTNAME}"}
	fileContent=${fileContent//"{WEBSOCKET_PORT}"/"${WEBSOCKET_PORT}"}
	fileContent=${fileContent//"{WEBSOCKET_USE_TLS}"/"${WEBSOCKET_USE_TLS}"}
	fileContent=${fileContent//"{WEBSOCKET_CERT_FILE}"/"${WEBSOCKET_CERT_FILE}"}
	fileContent=${fileContent//"{WEBSOCKET_CERT_KEY_FILE}"/"${WEBSOCKET_CERT_KEY_FILE}"}
	fileContent=${fileContent//"{VERSION}"/"${VERSION}"}
	echo "${fileContent}" > "${2}"
}


CONFIG_FILE=""

while getopts "c:o:" option; do
	case "${option}" in
		c)
			CONFIG_FILE=${OPTARG}
			;;
		o)
			OUTPUT_DIR=${OPTARG}
			;;
	esac
done

if [[ -z "${CONFIG_FILE}" || -z "${OUTPUT_DIR}" ]]; then
	show_help
	exit 1
fi


CONFIG_DIR=$(dirname $(realpath "${CONFIG_FILE}"))
. "${CONFIG_FILE}"

TOP_DIR=$(dirname $(realpath "${0}"))

mkdir -p "${OUTPUT_DIR}/DEBIAN" "${OUTPUT_DIR}/opt/dice"

parse_file "${TOP_DIR}/control.in" "${OUTPUT_DIR}/DEBIAN/control"
parse_file "${TOP_DIR}/dice.service.in" "${OUTPUT_DIR}/opt/dice/dice.service"
cp -v "${TOP_DIR}/dice_game.py" "${TOP_DIR}/dice_server.py" "${OUTPUT_DIR}/opt/dice/"

dpkg-deb --build "${OUTPUT_DIR}" "${TOP_DIR}/"
