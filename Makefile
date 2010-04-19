#
#     Copyright (C) 2008 - 2010 Loic Dachary <loic@dachary.org>
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
VERSION=2.0.0

SUBDIRS=jpoker/themes jpoker/sites

all build install clobber clean maintainer-clean check::
	for i in ${SUBDIRS} ; do ${MAKE} -C $$i $@ ; done

dist: build jpoker-binary-${VERSION} 
	tar -cvf jpoker-binary-${VERSION}.tar jpoker-binary-${VERSION}

install:: jpoker-binary-${VERSION}
	mkdir -p ${DESTDIR}usr/share
	cp -a jpoker-binary-${VERSION} ${DESTDIR}usr/share/jpoker

clean:: 
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
	mkdir -p jpoker-binary-${VERSION}/sites/pokersource.eu 
	cp -a jpoker/sites/pokersource.eu/binary jpoker-binary-${VERSION}/sites/pokersource.eu
	mkdir jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/themes jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/jquery-1.2.6.js jpoker-binary-${VERSION}/jquery
	cp -a jpoker/jquery/ui jpoker-binary-${VERSION}/jquery
	cp -a jpoker/js jpoker-binary-${VERSION}
	mkdir -p jpoker-binary-${VERSION}/themes/pokersource.eu-2009
	cp -a jpoker/themes/pokersource.eu-2009/css jpoker-binary-${VERSION}/themes/pokersource.eu-2009
	cp -a jpoker/themes/pokersource.eu-2009/sounds jpoker-binary-${VERSION}/themes/pokersource.eu-2009
	mkdir jpoker-binary-${VERSION}/l10n
	cp -a jpoker/l10n/*.json jpoker-binary-${VERSION}/l10n

build:: i18n check

maintainer-dist: build
	rm -fr jpoker-binary-${VERSION}
	${MAKE} jpoker-binary-${VERSION}
	${MAKE} maintainer-clean
	dir=$$(basename $$(pwd)) ; cd .. ; rm -f jpoker-${VERSION} ; ln -s $$dir jpoker-${VERSION} ; tar --exclude=jpoker-${VERSION}/debian -zcvf jpoker_${VERSION}.orig.tar.gz jpoker-${VERSION}/.

#
# clean all except the "binary" release (i.e. the set of files that 
# are needed to run the application but not the tools used to develop it)
# that is the basis of make all/clean/install. Numerous tools may be 
# needed to rebuild what is removed by this target and maintaining the
# dependencies to these tools may require a significant amount of work
# depending on the GNU/Linux distribution.
#
maintainer-clean::
	rm -fr tests
	rm -f messages.pot 
	rm -fr ${LINGUAS:%=%/} jpoker/l10n/*.mo
	rm -f *.pyc

#
# remove all that cannot be re-generated This is different from the
# maintainer-clean target in one important aspect: it is difficult or
# impractical to re-generate the files within a compile farm. For
# instance, installing the tiddlywiki_cp gem with gem install is
# frowned upon in Debian GNU/Linux, partly because "gem install"
# randomly fails with no good reason (i.e. it will sometime succeed if
# the command is run a second time).
#
clobber:: maintainer-clean
	rm -fr jpoker-binary-${VERSION}*

LINGUAS = $(shell grep -v ^\# jpoker/l10n/LINGUAS)
LANG_DIR = jpoker/l10n

# 
# because english is the default language, it has no
# associated .json file
#
LANG_JSON = $(LINGUAS:%=${LANG_DIR}/jpoker-%.json)

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

# mimic when a new lang shows
newlang:
	msginit -l fr_FR -o fr.po -i messages.pot

check::
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

jslint:
	jslint jpoker/js/jquery.jpoker.js
	jslint jpoker/js/test-jpoker.js
	jslint jpoker/js/skin-jpoker.js
	jslint jpoker/js/printstacktrace.js

.PHONY: tests
