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
	cp -a jpoker/index.html jpoker/index-*.html jpoker-binary-${VERSION}
	mkdir jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/themes jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/jquery-1.2.4b.js jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/ui.*.js jpoker-binary-${VERSION}/jquery
	cp -a jpoker/js jpoker-binary-${VERSION}
	cp -a jpoker/css jpoker-binary-${VERSION}
	mkdir jpoker-binary-${VERSION}/l10n
	cp -a jpoker/l10n/*.json jpoker-binary-${VERSION}/l10n
	cp -a jpoker/images jpoker-binary-${VERSION}
	cp -a jpoker/*.swf jpoker-binary-${VERSION}

build: i18n cook mockup check
	-cd jpoker ; x-www-browser index.html

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
	rm -f jpoker/skin/jpoker_[0-9][0-9]_*
	rm -f jpoker/{index,poker,skin}.html ${LANG_TW} ${LANG_SKIN}
	rm -fr ${LANG:%=%/} jpoker/l10n/*.mo
	rm -f jpoker/index.200* jpoker/index-fr.200* jpoker/poker.200* 
	rm -f jpoker/mockup.html
	rm -f jpoker/images/mockup_plain.svg
	rm -f *.pyc
	rm -f ${IMAGES}

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

LANG = en fr ja
LANG_DIR = jpoker/l10n
# 
# because english is the default language, it has no
# associated .json file
#
LANG_JSON = $($(patsubst en,,${LANG}):%=${LANG_DIR}/jpoker-%.json)
LANG_TW = $(LANG:%=jpoker/index-%.html)
LANG_SKIN = $(LANG:%=jpoker/skin-%.html)
IMAGES = jpoker/css/images/jpoker_table/avatar.png \
	 jpoker/css/images/jpoker_table/background.png \
	 jpoker/css/images/jpoker_table/bet.png \
	 jpoker/css/images/jpoker_table/dealer.png \
	 jpoker/css/images/jpoker_table/pot.png \
	 jpoker/css/images/jpoker_table/seat.png \
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

${LANG_DIR}/%.mo: ${LANG_DIR}/jpoker-%.po
	msgfmt --check --output-file $@ $<
	mkdir -p $*/LC_MESSAGES
	cp $@ $*/LC_MESSAGES

${LANG_DIR}/jpoker-%.json: ${LANG_DIR}/%.mo
	: now edit with kbabel $<
	python mo2json.py $* > $@

i18n: ${LANG_JSON}

update_gems: 
	rm -fr gems
	${MAKE} gems/bin/tiddlywiki_cp

# retry at most 4 times if there is an error because gem randomly fails
gems/bin/tiddlywiki_cp: 
	gem install --include-dependencies --no-rdoc --no-ri --install-dir gems tiddlywiki_cp

jpoker/skin-%.html: gems/bin/tiddlywiki_cp 
jpoker/index-%.html: gems/bin/tiddlywiki_cp 
jpoker/index.html: gems/bin/tiddlywiki_cp 
jpoker/poker.html: gems/bin/tiddlywiki_cp 

GEMSCONTEXT=GEM_HOME=gems gems/bin/

skin_tests:
	> jpoker/skin/MainMenu.tiddler
	for t in $$(perl -n -e 'print if(s/config.macros.(jpoker_\d+_.*) =.*/\1/)' jpoker/skin/skin.js) ; do \
		echo "<<$$t>>" > jpoker/skin/$$t.tiddler ; \
		echo 'title="'$$t'" modifier="loic" created="200805032321" changecount="1"' > jpoker/skin/$$t.tiddler.div ; \
		echo " [[$$t]]" >> jpoker/skin/MainMenu.tiddler ; \
	done

EMPTY=tiddlywiki-2.3.html

jpoker/skin-%.html: jpoker/index-*/* jpoker/skin/* jpoker/tiddlers/* jpoker/markup/*
	cp ${EMPTY} $@
	${GEMSCONTEXT}tiddlywiki_cp -a jpoker/skin jpoker/index-$* jpoker/tiddlers jpoker/markup $@

jpoker/skin.html: jpoker/skin-en.html
	cp jpoker/skin-en.html jpoker/skin.html

jpoker/index-%.html: jpoker/JpokerPlugin/* jpoker/index-*/* jpoker/index/* jpoker/tiddlers/* jpoker/markup/*
	cp ${EMPTY} $@
	${GEMSCONTEXT}tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-$* jpoker/index jpoker/tiddlers jpoker/markup $@

jpoker/index.html: jpoker/index-en.html
	cp jpoker/index-en.html jpoker/index.html

jpoker/poker.html: jpoker/JpokerPlugin/* jpoker/poker/* jpoker/markup/*
	cp ${EMPTY} $@
	${GEMSCONTEXT}tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/poker jpoker/markup $@

cook:	jpoker/poker.html ${LANG_TW} jpoker/index.html ${LANG_SKIN} jpoker/skin.html

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
	inkscape --without-gui --export-png=$@ $<

.PHONY: tests sound
