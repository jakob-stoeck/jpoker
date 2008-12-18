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

  def test_tiddler_css
    t = TiddlyWikiCp.new
    tiddler = Tiddler.new
    assert_equal(false, t.tiddler_css?(tiddler))
    tiddler.from_scratch({'tiddler', 'StyleSheet'})
    assert_equal(TiddlyWikiCp::TIDDLER_CSS, t.tiddler_css?(tiddler))
    tiddler.from_scratch({'tiddler', 'Styles'})
    assert_equal(TiddlyWikiCp::TIDDLER_CSS, t.tiddler_css?(tiddler))
  end

  def test_css2directory
    t = TiddlyWikiCp.new
    tiddler = 'DesignStyle'
    uri = "#{this_dir(__FILE__)}/content/universe.html#" + tiddler
    t.css2directory(uri, 'spit')
    assert(File.exists?('spit/' + tiddler + '.' + TiddlyWikiCp::TIDDLER_CSS))
    assert(File.exists?('spit/' + tiddler + '.' + TiddlyWikiCp::TIDDLER_CSS + '.div'))
  end

  def test_css2file
    assert(TiddlyWikiCp.new.respond_to?(:css2file))
  end

  def test_css2tiddlywiki
    assert(TiddlyWikiCp.new.respond_to?(:css2tiddlywiki))
  end
end

end # module TiddlywikiCp
# Local Variables:
# compile-command: "RUBYLIB='../lib/tiddlywiki_cp:../lib' ruby test_tiddler_css.rb"
# End:
