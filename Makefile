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
#     along with this program.  If not, see <http:#www.gnu.org/licenses/>.
#
all: i18n cook mockup check
	-cd jpoker ; x-www-browser index.html

LANG = fr ja
LANG_LIST = $(shell echo ${LANG}|sed s/\ /,/)
LANG_DIR = jpoker/l10n
LANG_JSON = $(LANG:%=${LANG_DIR}/jpoker-%.json)
LANG_TW = $(LANG:%=jpoker/index-%.html)

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

gems/bin/tiddlywiki_cp: 
	gem install --include-dependencies --no-rdoc --no-ri --install-dir gems tiddlywiki_cp

empty.html:
	wget http://tiddlywiki.com/empty.html

jpoker/index-%.html: gems/bin/tiddlywiki_cp empty.html jpoker/JpokerPlugin/* jpoker/index-*/* jpoker/index/* jpoker/markup/*
	cp empty.html $@
	GEM_HOME=gems gems/bin/tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-$* jpoker/index jpoker/markup $@

jpoker/index.html:  gems/bin/tiddlywiki_cp empty.html jpoker/JpokerPlugin/* jpoker/index-en/* jpoker/index/* jpoker/markup/*
	cp empty.html $@
	GEM_HOME=gems gems/bin/tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-en jpoker/index jpoker/markup $@

jpoker/poker.html:  gems/bin/tiddlywiki_cp empty.html jpoker/JpokerPlugin/* jpoker/poker/* jpoker/markup/*
	cp empty.html $@
	GEM_HOME=gems gems/bin/tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/poker jpoker/markup $@

cook:	jpoker/poker.html jpoker/index.html ${LANG_TW}

# mimic when a new lang shows
newlang:
	msginit -l fr_FR -o fr.po -i messages.pot
#	msginit -l ja_JP -o jp.po -i messages.pot

clean: 
	rm -fr tests gems
	rm -f messages.pot empty.html
	rm -f jpoker/{index.html,poker.html} ${LANG_TW}
#	rm -fr ${LANG_DIR}/jpoker-{${LANG_LIST}}.json
	rm -fr {${LANG_LIST}}/
	rm -f jpoker/index.200* jpoker/index-fr.200* jpoker/poker.200* 
	rm -f jpoker/mockup.{css,html,json}
	rm -f *.pyc

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
jpoker/mockup.html: jpoker/images/mockup.svg
	python svgflatten.py < jpoker/images/mockup.svg | python svg2html.py --json > jpoker/mockup.json || true
	python svgflatten.py < jpoker/images/mockup.svg | python svg2html.py --html | tidy -indent 2>/dev/null > jpoker/mockup.html || true
	perl -pi -e 's:</head>:<link href="mockup.css" rel="stylesheet" type="text/css" /></head>:' jpoker/mockup.html
	python svgflatten.py < jpoker/images/mockup.svg | python svg2html.py --css > jpoker/mockup.css

.PHONY: tests
