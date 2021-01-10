PY?=python3

BASEDIR=$(CURDIR)
BUILD_SCRIPT=$(BASEDIR)/build.sh
OUTPUTDIR=$(BASEDIR)/output
CONFFILE=$(BASEDIR)/dev.conf
PUBLISHCONF=$(BASEDIR)/pub.conf

help:
	@echo 'Makefile for Dice server                                                  '
	@echo '                                                                          '
	@echo 'Usage:                                                                    '
	@echo '   make html                           (re)generate the web site          '
	@echo '   make clean                          remove the generated files         '
	@echo '   make publish                        generate using production settings '
	@echo '   make serve                          start websockets server            '
	@echo '   make test                           generate and serve the website     '
	@echo '                                                                          '

clean:
	[ ! -d $(OUTPUTDIR) ] || rm -rf $(OUTPUTDIR)

serve:
	$(BUILD_SCRIPT) -o $(OUTPUTDIR) -c $(CONFFILE)

test: clean serve

publish:
	$(BUILD_SCRIPT) -o $(OUTPUTDIR) -c $(PUBLISHCONF)

.PHONY: html help clean serve publish
