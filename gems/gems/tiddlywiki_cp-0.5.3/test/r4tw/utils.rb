
require 'test/unit'

$LOAD_PATH << ".."
require 'r4tw'

class UtilsTest < Test::Unit::TestCase

  def test_encode_decode
        
    foo = '"<foo>&'
    assert_equal(foo,'&quot;&lt;foo&gt;&amp;'.decodeHTML)
    assert_equal(foo,foo.encodeHTML.decodeHTML)
        
  end
    
  def test_escape_line_breaks    
    
    foo = "hey\nhey"
		assert_equal(foo,"hey\\nhey".unescapeLineBreaks)
		assert_equal(foo,foo.escapeLineBreaks.unescapeLineBreaks)
    
    foo = '\\\\'
		assert_equal(foo,'\\s\\s'.unescapeLineBreaks)
		assert_equal(foo,foo.escapeLineBreaks.unescapeLineBreaks)

  end
    
  def test_dates
    foo = "200712101122"
    bar = Time.convertFromYYYYMMDDHHMM(foo)       
    assert_equal("Mon Dec 10 11:22:00 UTC 2007",bar.to_s)
    assert_equal(foo,bar.convertToYYYYMMDDHHMM)
    
    # this test depends on timezone. I am at GMT+10
    assert_equal("200712102122",bar.convertToLocalYYYYMMDDHHMM)
  end
    
  def test_bracketed
    foo = ["Hello there", "this", "that", "other", "one more"];

    assert_equal(
      foo,
      "[[Hello there]] this that [[other]] [[one more]]".readBrackettedList
      )
            
    assert_equal(
      foo,
      foo.toBrackettedList.readBrackettedList
    )            
        
  end

end

