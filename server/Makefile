PY?=python3

BASEDIR=$(CURDIR)
BUILD_SCRIPT=$(BASEDIR)/build-deb.sh
SERVE_SCRIPT=$(BASEDIR)/serve.sh
OUTPUTDIR=$(BASEDIR)/deb-pkg
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
	@echo '   make deb                            create debian pacakge              '
	@echo '                                                                          '

clean:
	[ ! -d $(OUTPUTDIR) ] || rm -rf $(OUTPUTDIR)
	rm -f $(BASEDIR)/*.deb

serve:
	$(SERVE_SCRIPT) -c $(CONFFILE)

test: clean serve

publish:
	$(SERVE_SCRIPT) -c $(PUBLISHCONF)

# Requires build-essential
deb:
	$(BUILD_SCRIPT) -c $(PUBLISHCONF) -o $(OUTPUTDIR)

.PHONY: html help clean serve publish deb
