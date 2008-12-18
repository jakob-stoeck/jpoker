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

    def file2tiddler(from, to)
      content = read_uri(from)

      tiddlywiki = uri2tiddlywiki(to)
      tiddler = Tiddler.new
      #
      # set tiddler meta data
      #
      div_from = "#{from}.div"
      div = File.read(div_from).to_s
      Tiddler.parse_attributes(div, tiddler.fields)
      #
      # set tiddler content
      #
      tiddler.fields['text'] = content
      #
      # set tiddler times
      #
      if @options.times
        tiddler.fields['modified'] = File.mtime(from).convertToYYYYMMDDHHMM
      end
      #
      # add_tiddler implies remove tiddler
      #
      tiddlywiki.add_tiddler(tiddler)
    end

    alias file2tiddlywiki file2tiddler

  end

end
