#
# Copyright (C) 2007 Loic Dachary <loic@dachary.org>
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
module TiddlywikiCp

  class TiddlyWikiCp

    TIDDLER_JS = 'js'

    def tiddler_js?(tiddler) #:nodoc:
      tiddler.tags && tiddler.tags.include?("systemConfig") && TIDDLER_JS
    end

    def js2directory(from, to)
      js2file(from, TiddlyWikiCp.tiddler2filename(to, from) + ".js")
    end

    alias js2file tiddler2file

    alias js2tiddlywiki tiddler2tiddlywiki

  end

end


