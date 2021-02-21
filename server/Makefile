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
	@echo '   make clean                          remove the generated files         '
	@echo '   make serve                          start websockets server            '
	@echo '   make test                           generate and serve the website     '
	@echo '   make deb                            create debian package              '
	@echo '                                                                          '

clean:
	[ ! -d $(OUTPUTDIR) ] || rm -rf $(OUTPUTDIR)
	rm -f $(BASEDIR)/*.deb

serve:
	$(SERVE_SCRIPT) -c $(CONFFILE)

test: clean serve

# Requires build-essential
deb:
	$(BUILD_SCRIPT) -c $(PUBLISHCONF) -o $(OUTPUTDIR)

.PHONY: help clean serve publish deb
