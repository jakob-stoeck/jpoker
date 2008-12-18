
require 'test/unit'

$LOAD_PATH << ".."
require 'r4tw'

class FromUrl < Test::Unit::TestCase

  def setup
    
    @foo = fetch_url("http://www.tiddlywiki.com/empty.html")
    
    @tw = make_tw {
      source_url
    }
    
  end

  def test_it
  
    assert_equal(
      @foo,
	  @tw.to_s
	)
	
  end

end
