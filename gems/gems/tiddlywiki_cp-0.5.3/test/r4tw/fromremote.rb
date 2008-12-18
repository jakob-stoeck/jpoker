
require 'test/unit'

$LOAD_PATH << ".."
require 'r4tw'

class FromRemote < Test::Unit::TestCase

  def setup
    @tw = make_tw { source_url }    
  end

  def test_it
    @tw.add_tiddler_from_remote_tw("http://www.tiddlywiki.com/#HelloThere")
    assert_equal( @tw.get_tiddler("HelloThere").name, "HelloThere" )
    assert_equal( @tw.get_tiddler("HelloThere").modifier, "JeremyRuston" )
  end

end
