#
#     Copyright (C) 2008 Loic Dachary <loic@dachary.org>
#
#     This program is free software: you can redistribute it and/or modify
#     it under the terms of the GNU General Public License as published by
#     the Free Software Foundation, either version 3 of the License, or
#     (at your option) any later version.
#
#     This program is distributed in the hope that it will be useful,
#     but WITHOUT ANY WARRANTY; without even the implied warranty of
#     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#     GNU General Public License for more details.
#
#     You should have received a copy of the GNU General Public License
#     along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
VERSION=1.0.14

SHELL = /bin/bash

install: jpoker-binary-${VERSION}
	mkdir -p ${DESTDIR}usr/share
	cp -a jpoker-binary-${VERSION} ${DESTDIR}usr/share/jpoker

all:

dist: jpoker-binary-${VERSION} 
	tar -cvf jpoker-binary-${VERSION}.tar jpoker-binary-${VERSION}

clean: 
	rm -fr jpoker-binary-${VERSION}.tar

#
# all targets below this mark are used to maintain the development environment
# and tools
#
reinstall: 
	rm -fr jpoker-binary-${VERSION}
	${MAKE} install

jpoker-binary-${VERSION}:
	mkdir jpoker-binary-${VERSION}
	cp README.binary jpoker-binary-${VERSION}/README
	cp -a jpoker/index.html jpoker/index-*.html jpoker-binary-${VERSION}
	mkdir jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/themes jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/jquery-1.2.6.js jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/ui jpoker-binary-${VERSION}/jquery
	cp -a jpoker/js jpoker-binary-${VERSION}
	cp -a jpoker/css jpoker-binary-${VERSION}
	mkdir jpoker-binary-${VERSION}/l10n
	cp -a jpoker/l10n/*.json jpoker-binary-${VERSION}/l10n
	cp -a jpoker/images jpoker-binary-${VERSION}
	cp -a jpoker/*.swf jpoker-binary-${VERSION}

build: i18n cook mockup check
	-cd jpoker ; x-www-browser index.html || true

sound:
	cd sound ; make build

maintainer-dist: build
	rm -fr jpoker-binary-${VERSION}
	${MAKE} jpoker-binary-${VERSION}
	${MAKE} maintainer-clean
	dir=$$(basename $$(pwd)) ; cd .. ; rm -f jpoker-${VERSION} ; ln -s $$dir jpoker-${VERSION} ; tar --exclude=jpoker-${VERSION}/debian -zcvf jpoker_${VERSION}.orig.tar.gz jpoker-${VERSION}/*

#
# clean all except the "binary" release (i.e. the set of files that 
# are needed to run the application but not the tools used to develop it)
# that is the basis of make all/clean/install. Numerous tools may be 
# needed to rebuild what is removed by this target and maintaining the
# dependencies to these tools may require a significant amount of work
# depending on the GNU/Linux distribution.
#
maintainer-clean: 
	cd sound ; ${MAKE} clean
	rm -fr tests
	rm -f messages.pot 
	rm -f jpoker/{index,poker}.html ${LANG_TW}
	rm -fr ${LANG:%=%/} jpoker/l10n/*.mo
	rm -f jpoker/index.200* jpoker/index-fr.200* jpoker/poker.200* 
	rm -f jpoker/mockup.html
	rm -f jpoker/images/mockup_plain.svg
	rm -f *.pyc
	rm -f ${IMAGES}
	rm -fr jpoker/standalone

#
# remove all that cannot be re-generated This is different from the
# maintainer-clean target in one important aspect: it is difficult or
# impractical to re-generate the files within a compile farm. For
# instance, installing the tiddlywiki_cp gem with gem install is
# frowned upon in Debian GNU/Linux, partly because "gem install"
# randomly fails with no good reason (i.e. it will sometime succeed if
# the command is run a second time).
#
clobber: maintainer-clean
	rm -fr jpoker-binary-${VERSION}
	rm -fr gems
	rm -fr jpoker/*.swf

LANG_EN=en
LANG_OTHERS=fr ja
LANG=${LANG_EN} ${LANG_OTHERS}
LANG_DIR = jpoker/l10n

STANDALONE_TW = $(LANG:%=jpoker/standalone/index-%.html)
# 
# because english is the default language, it has no
# associated .json file
#
LANG_JSON = $(LANG_OTHERS:%=${LANG_DIR}/jpoker-%.json)
LANG_TW = $(LANG:%=jpoker/index-%.html)
IMAGES = jpoker/css/images/jpoker_table/avatar.png \
	 jpoker/css/images/jpoker_table/background.png \
	 jpoker/css/images/jpoker_table/bet.png \
	 jpoker/css/images/jpoker_table/dealer.png \
	 jpoker/css/images/jpoker_table/pot.png \
	 jpoker/css/images/jpoker_table/seat.png \
	 jpoker/css/images/jpoker_table/seat_position.png \
	 jpoker/css/images/jpoker_table/table.png

messages.pot: jpoker/js/jquery.jpoker.js
	xgettext --extract-all \
		 --lang java \
		 --from-code=UTF-8 \
		 --copyright-holder='Loic Dachary <loic@dachary.org>' \
		 --output=messages.pot \
		 --sort-output \
		 jpoker/js/jquery.jpoker.js

${LANG_DIR}/jpoker-%.po: messages.pot
	msgmerge -s -U $@ messages.pot
	touch $@
	: now edit with kbabel $<

${LANG_DIR}/%.mo: ${LANG_DIR}/jpoker-%.po
	msgfmt --check --output-file $@ $<
	mkdir -p $*/LC_MESSAGES
	cp $@ $*/LC_MESSAGES

${LANG_DIR}/jpoker-%.json: ${LANG_DIR}/%.mo
	python mo2json.py $* > $@

i18n: ${LANG_JSON}

update_gems: 
	rm -fr gems
	${MAKE} gems/bin/tiddlywiki_cp

# retry at most 4 times if there is an error because gem randomly fails
gems/bin/tiddlywiki_cp: 
	gem install --include-dependencies --no-rdoc --no-ri --install-dir gems tiddlywiki_cp

jpoker/index-%.html: gems/bin/tiddlywiki_cp 
jpoker/index.html: gems/bin/tiddlywiki_cp 
jpoker/poker.html: gems/bin/tiddlywiki_cp
#jpoker/standalone/index-%.html : gems/bin/tiddlywiki_cp

GEMSCONTEXT=GEM_HOME=gems gems/bin/

EMPTY=tiddlywiki-2.3.html

jpoker/index-%.html: jpoker/JpokerPlugin/* jpoker/index-*/* jpoker/index/* jpoker/tiddlers/* jpoker/markup/*
	cp ${EMPTY} $@
	${GEMSCONTEXT}tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-$* jpoker/index jpoker/tiddlers jpoker/markup $@

jpoker/index.html: jpoker/index-en.html
	cp jpoker/index-en.html jpoker/index.html

jpoker/poker.html: jpoker/JpokerPlugin/* jpoker/poker/* jpoker/markup/*
	cp ${EMPTY} $@
	${GEMSCONTEXT}tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/poker jpoker/markup $@

#
# Gather css, js and l10n files that are to be inlined in the TiddlyWiki
#
jpoker/standalone-temp-% : jpoker/markup/MarkupPostBody.tiddler jpoker/js/* jpoker/jquery/* jpoker/css/* jpoker/tiddlers-standalone/* i18n mockup
	if [ -d $@ ]; then rm -fr $@;fi
	mkdir $@
	#
	# Parse MarkupPostBody for list of js files, copy them and create .div files.
	cd jpoker; declare -i a=1 ; sed -ne 's/.*src="\([^"]*\)".*/\1/p' < markup/MarkupPostBody.tiddler | while read file ; do printf 'title="%02d_%s" author="script" tags="excludeLists excludeSearch systemConfig"\n' $$a "$$file" > standalone-temp-$*/$${file##*/}.div ; cp $$file standalone-temp-$*/; let a++ ; done
	#
	# Flatten all css files to one file and create a .div file
	ruby getcss.rb jpoker/css/jpoker.css -d $@/jpoker.css
	printf 'title="JpokerStyleSheet" author="script"\n' > $@/"jpoker.css.div";
	#
	# If lang is not en, convert json file to a plugin js file and create .div file
	if [ -a ${LANG_DIR}/jpoker-$*.json ]; then sed "1i\$$.gt.setLang('$*');$$.gt.messages.$*=" ${LANG_DIR}/jpoker-$*.json > $@/"jpoker-$*.js"; printf 'title="%s-JpokerJson" author="script" tags="excludeLists excludeSearch systemConfig"\n' $* > $@/"jpoker-$*.js.div"; fi

#
# Create output folder for standalone files
#
jpoker/standalone:
	if [ ! -d jpoker/standalone ]; then mkdir jpoker/standalone;fi

#
# Create standalone files with inlined CSS, JavaScript and l10n
#
jpoker/standalone/index-%.html: jpoker/JpokerPlugin/* jpoker/index-*/* jpoker/index/* jpoker/tiddlers/* jpoker/tiddlers-standalone/* jpoker/standalone jpoker/standalone-temp-% mockup gems/bin/tiddlywiki_cp
	cp -f ${EMPTY} $@
	${GEMSCONTEXT}tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-$* jpoker/index jpoker/tiddlers jpoker/tiddlers-standalone/* jpoker/standalone-temp-$*/* $@
	# copy images to standalone directory
	cp -R -f jpoker/images jpoker/standalone/images
	cp -R -f jpoker/css/images jpoker/standalone
	cp -R -f jpoker/css/jpoker_jquery_ui/i jpoker/standalone
	rm -fr jpoker/standalone-temp-$*

jpoker/standalone/index.html: jpoker/standalone/index-en.html
	cp jpoker/standalone/index-en.html $@

standalone: ${STANDALONE_TW} jpoker/standalone/index.html

cook:	jpoker/poker.html ${LANG_TW} jpoker/index.html standalone

# mimic when a new lang shows
newlang:
	msginit -l fr_FR -o fr.po -i messages.pot
#	msginit -l ja_JP -o jp.po -i messages.pot

check:
	python test-svg2html.py
	python test-svgflatten.py
	-rm -fr tests ; jscoverage jpoker tests
	-cd tests ; x-www-browser jscoverage.html?test-jpoker.html # replace with jaxer when http://bugs.debian.org/cgi-bin/bugreport.cgi?bug=474050 closed

copyright:
	cp COPYRIGHT/copyright.DEBIAN debian/copyright
	cat COPYRIGHT/summary.txt >> debian/copyright
	for license in COPYRIGHT/{GPLv3-notice.txt,MIT-LICENSE.txt,tiddlywiki.txt,bidix.txt} ; do \
		echo ; \
		echo '---------------------------------------' ; \
		echo ; \
		cat $$license ; \
	done >> debian/copyright

mtime:
	for f in `hg manifest`; do touch --date="`hg log -l1 --template '{date|isodate}' $$f`" $$f; done

mockup: jpoker/mockup.html
jpoker/mockup.html: jpoker/images/mockup_plain.svg
	( \
		echo "// generated with make mockup, DO NOT EDIT" ; \
		echo -n '$$.jpoker.plugins.table.templates.room = ' ; \
		python svgflatten.py < jpoker/images/mockup_plain.svg | python svg2html.py --json || true ; \
	)  > jpoker/js/mockup.js
	python svgflatten.py < jpoker/images/mockup_plain.svg | python svg2html.py --html | tidy -indent 2>/dev/null > jpoker/mockup.html || true
	perl -pi -e 's:</head>:<link href="css/jpoker_table_layout.css" rel="stylesheet" type="text/css" /></head>:' jpoker/mockup.html
	python svgflatten.py < jpoker/images/mockup_plain.svg | python svg2html.py --css > jpoker/css/jpoker_table_layout.css

jpoker/images/mockup_plain.svg: jpoker/images/mockup.svg
	inkscape --without-gui --vacuum-defs --export-plain-svg=jpoker/images/mockup_plain.svg jpoker/images/mockup.svg
	perl -pi -e 's/xmlns="http:\/\/www.w3.org\/2000\/svg"//' jpoker/images/mockup_plain.svg

jpoker/images/mockup.svg: ${IMAGES}

jpoker/css/images/jpoker_table/%.png: jpoker/images/%.svg
	mkdir -p `dirname $@`
	inkscape --without-gui --export-png=$@ $<

jslint:
	jslint jpoker/js/jquery.jpoker.js
	jslint jpoker/js/test-jpoker.js
	jslint jpoker/js/skin-jpoker.js

.PHONY: tests sound jslint
