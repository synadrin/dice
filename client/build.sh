#!/bin/bash

function show_help {
	echo "${0} -c config_file -o output_dir"
}


CONFIG_FILE=""
OUTPUT_DIR=""

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
TEMPLATES_DIR="${TOP_DIR}/templates"

mkdir -p "${OUTPUT_DIR}"
cp -v "${TEMPLATES_DIR}"/*.{css,ico,js,png} "${OUTPUT_DIR}/"

echo "${VERSION}" > "${OUTPUT_DIR}/version.txt"

indexContent=$(cat "${TEMPLATES_DIR}/index.html")
indexContent=${indexContent//"{DEBUG}"/"${DEBUG}"}
indexContent=${indexContent//"{SITENAME}"/"${SITENAME}"}
indexContent=${indexContent//"{SITEURL}"/"${SITEURL}"}
indexContent=${indexContent//"{COPYRIGHT}"/"${COPYRIGHT}"}
indexContent=${indexContent//"{VERSION}"/"${VERSION}"}
indexContent=${indexContent//"{WEBSOCKET_URL}"/"${WEBSOCKET_URL}"}
echo "${indexContent}" > "${OUTPUT_DIR}/index.html"
