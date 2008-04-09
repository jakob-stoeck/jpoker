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

all: tests

LANG = fr jp
LANG_LIST = $(shell echo ${LANG}|sed s/\ /,/)
LANG_DIR = jpoker/l10n
LANG_JSON = $(LANG:%=${LANG_DIR}/jpoker-%.json)

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

tests:
	-rm -fr tests ; jscoverage jpoker tests

cook:
	gem install --include-dependencies --no-rdoc --no-ri --install-dir gems tiddlywiki_cp
	[ -f empty.html ] || wget http://tiddlywiki.com/empty.html
	cp empty.html jpoker/index.html
	GEM_HOME=gems gems/bin/tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-en jpoker/index jpoker/markup jpoker/index.html
	cp empty.html jpoker/index-fr.html
	GEM_HOME=gems gems/bin/tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-fr jpoker/index jpoker/markup jpoker/index-fr.html
	cp empty.html jpoker/index-jp.html
	GEM_HOME=gems gems/bin/tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/index-jp jpoker/index jpoker/markup jpoker/index-jp.html
	cp empty.html jpoker/poker.html
	GEM_HOME=gems gems/bin/tiddlywiki_cp -a jpoker/JpokerPlugin jpoker/poker jpoker/markup jpoker/poker.html

# mimic when a new lang shows
newlang:
	msginit -l fr_FR -o fr.po -i messages.pot
#	msginit -l ja_JP -o jp.po -i messages.pot

clean: 
	rm -fr tests
	rm -fr fr
	rm -f messages.pot empty.html
#	rm -fr ${LANG_DIR}/jpoker-{${LANG_LIST}}.json
	rm -fr {${LANG_LIST}}/LC_MESSAGES/
	rm -fr gems

check:
	cd jpoker ; x-www-browser test-jpoker.html # replace with jaxer when http://bugs.debian.org/cgi-bin/bugreport.cgi?bug=474050 closed

copyright:
	cp COPYRIGHT/copyright.DEBIAN debian/copyright
	cat COPYRIGHT/summary.txt >> debian/copyright
	for license in COPYRIGHT/{GPLv3-notice.txt,MIT-LICENSE.txt,tiddlywiki.txt,bidix.txt,cc-by-sa-2.5-notice.txt,cc-by-sa-3.0-notice.txt} ; do \
		echo ; \
		echo '---------------------------------------' ; \
		echo ; \
		cat $$license ; \
	done >> debian/copyright

mtime:
	for f in `hg manifest`; do touch --date="`hg log -l1 --template '{date|isodate}' $$f`" $$f; done

.PHONY: tests
