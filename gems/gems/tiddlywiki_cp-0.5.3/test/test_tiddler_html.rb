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
require File.dirname(__FILE__) + '/test_helper.rb'

module TiddlywikiCp

class TestTiddler < Test::Unit::TestCase
  include TiddlyBase

  def test_tiddler_html
    t = TiddlyWikiCp.new
    tiddler = Tiddler.new
    assert_equal(false, t.tiddler_html?(tiddler))
    tiddler.from_scratch({'tiddler', 'TemplateFoo'})
    assert_equal(TiddlyWikiCp::TIDDLER_HTML, t.tiddler_html?(tiddler))
  end

  def test_html2directory
    t = TiddlyWikiCp.new
    tiddler = 'DesignTemplate'
    uri = "#{this_dir(__FILE__)}/content/universe.html#" + tiddler
    t.html2directory(uri, 'spit')
    assert(File.exists?('spit/' + tiddler + '.' + TiddlyWikiCp::TIDDLER_HTML))
    assert(File.exists?('spit/' + tiddler + '.' + TiddlyWikiCp::TIDDLER_HTML + '.div'))
  end

  def test_html2file
    assert(TiddlyWikiCp.new.respond_to?(:html2file))
  end

  def test_html2tiddlywiki
    assert(TiddlyWikiCp.new.respond_to?(:html2tiddlywiki))
  end

end

end # module TiddlywikiCp
# Local Variables:
# compile-command: "RUBYLIB='../lib/tiddlywiki_cp:../lib' ruby test_tiddler_html.rb"
# End:
