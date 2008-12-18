
require 'test/unit'

$LOAD_PATH << ".."; require 'r4tw'

# might need some work here for 2.2 beta ???????

class ShadowTest < Test::Unit::TestCase

  def setup
    @tw = make_tw {
      source_file "#{this_dir(__FILE__)}/empties/2.1.3.html"    
    }
  end

  def test_shadow
    @tw.add_shadow_tiddler Tiddler.new.from_scratch({'tiddler'=>'foo','text'=>'bar'})
    #@tw.to_file "shadowtest.html"
    #
    assert_match(
      /^config.shadowTiddlers\["foo"\] = "bar";/m,
      @tw.to_s
    )
    
  end

end
