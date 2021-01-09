PY?=python3

BASEDIR=$(CURDIR)
BUILD_SCRIPT=$(BASEDIR)/build.sh
OUTPUTDIR=$(BASEDIR)/html
CONFFILE=$(BASEDIR)/dev.conf
PUBLISHCONF=$(BASEDIR)/pub.conf

SSH_HOST=vps01.macneils.ca
SSH_PORT=22
SSH_USER=tmacneil
SSH_TARGET_DIR=/srv/www/dice.pixelcards.ca

help:
	@echo 'Makefile for Dice website                                                 '
	@echo '                                                                          '
	@echo 'Usage:                                                                    '
	@echo '   make html                           (re)generate the web site          '
	@echo '   make clean                          remove the generated files         '
	@echo '   make publish                        generate using production settings '
	@echo '   make serve [PORT=8000]              serve site at http://localhost:8000'
	@echo '   make test                           generate and serve the website     '
	@echo '   make rsync_upload                   upload the web site via rsync+ssh  '
	@echo '                                                                          '

html:
	$(BUILD_SCRIPT) -o $(OUTPUTDIR) -c $(CONFFILE)

clean:
	[ ! -d $(OUTPUTDIR) ] || rm -rf $(OUTPUTDIR)

serve:
ifdef PORT
	cd $(OUTPUTDIR) && $(PY) -m http.server $(PORT)
else
	cd $(OUTPUTDIR) && $(PY) -m http.server
endif

test: clean html serve

publish:
	$(BUILD_SCRIPT) -o $(OUTPUTDIR) -c $(PUBLISHCONF)

rsync_upload: publish
	rsync -e "ssh -p $(SSH_PORT)" -P -rvzc --delete $(OUTPUTDIR)/ $(SSH_USER)@$(SSH_HOST):$(SSH_TARGET_DIR) --cvs-exclude

.PHONY: html help clean serve publish rsync_upload
