
require 'test/unit'

$LOAD_PATH << ".."; require 'r4tw'

class TiddlerFromUrl < Test::Unit::TestCase

  def setup
    @tw = make_tw {
      source_file "#{this_dir(__FILE__)}/empties/2.1.3.html"
    }
  end

  def test_it
    @tw.add_tiddler_from_url(
        "http://svn.tiddlywiki.org/Trunk/contributors/SimonBaird/mptw/trunk/noupgrade/MonkeyPirateTiddlyWiki.tiddler",
        {'tiddler'=>'MPTW'}
      )
    # @tw.to_file "zz"
    assert_equal( @tw.get_tiddler("MPTW").name, "MPTW" )
  end

end
