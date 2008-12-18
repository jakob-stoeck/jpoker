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

    def tiddler2file(from, to)
      tiddler = uri2tiddlywiki(from).get_tiddler(from.split('#')[1])
      if to == '-' 
        puts tiddler.text
      else
        fields_string = tiddler.to_fields_string(true)
        fields_string.join(' ').to_file("#{to}.div")
        tiddler.text.to_file(to)
        if @options.times
          if tiddler.modified
            modified = Time.convertFromYYYYMMDDHHMM(tiddler.modified)
            File.utime(modified, modified, to)
            File.utime(modified, modified, "#{to}.div")
          end
        end
      end
    end

  end

end
