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
require 'tiddlywiki_cp/tiddler_js'

module TiddlywikiCp

class TestTiddler < Test::Unit::TestCase
  include TiddlyBase

  def test_tiddler_js?
    t = TiddlyWikiCp.new
    tiddler = Tiddler.new
    assert_equal(nil, t.tiddler_js?(tiddler))
    tiddler.from_scratch({'tags', ['bla']})
    assert_equal(false, t.tiddler_js?(tiddler))
    tiddler.from_scratch({'tags', ['systemConfig']})
    assert_equal(TiddlyWikiCp::TIDDLER_JS, t.tiddler_js?(tiddler))
  end

  def test_js2directory
    t = TiddlyWikiCp.new
    tiddler = 'GenerateRssHijack'
    uri = "#{this_dir(__FILE__)}/content/universe.html#" + tiddler
    t.js2directory(uri, 'spit')
    assert(File.exists?('spit/' + tiddler + '.' + TiddlyWikiCp::TIDDLER_JS))
    assert(File.exists?('spit/' + tiddler + '.' + TiddlyWikiCp::TIDDLER_JS + '.div'))
  end

  def test_js2file
    assert(TiddlyWikiCp.new.respond_to?(:js2file))
  end

  def test_js2tiddlywiki
    assert(TiddlyWikiCp.new.respond_to?(:js2tiddlywiki))
  end
end

end # module TiddlywikiCp
# Local Variables:
# compile-command: "RUBYLIB='../lib/tiddlywiki_cp:../lib' ruby test_tiddler_js.rb"
# End:
