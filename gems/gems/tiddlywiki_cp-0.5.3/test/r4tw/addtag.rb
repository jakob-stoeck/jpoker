
require 'test/unit'

$LOAD_PATH << ".."
require 'r4tw'

class TagTest < Test::Unit::TestCase

  def setup
    @tw = make_tw {
      source_file "#{this_dir(__FILE__)}/empties/2.1.3.html"
      add_tiddler Tiddler.new.from_scratch({'tiddler'=>'foo', 'text'=>'bar'}).add_tag("hey")
    }

    @tw2 = make_tw {
      source_file "#{this_dir(__FILE__)}/empties/2.2.0.beta5.html"
      add_tiddler Tiddler.new.from_scratch({'tiddler'=>'foo', 'text'=>'bar'}).add_tag("hey")
    }


  end

  def test_tag
    assert_match(
      /<div tiddler="foo".*tags="hey">/,
      @tw.to_s
    )

    assert_match(
      /<div title="foo".*tags="hey">/,
      @tw2.to_s
    )


    @tw.get_tiddler("foo").add_tag("now")
    @tw2.get_tiddler("foo").add_tag("now")
    
    assert_match(
      /<div tiddler="foo".*tags="hey now">/,
      @tw.to_s
    )

    assert_match(
      /<div title="foo".*tags="hey now">/,
      @tw2.to_s
    )

    
    # try a rename for fun
    @tw.get_tiddler("foo").rename("bar")
    @tw2.get_tiddler("foo").rename("bar")
    
    assert_match(
      /<div tiddler="bar".*tags="hey now">/,
      @tw.to_s
    )

    assert_match(
      /<div title="bar".*tags="hey now">/,
      @tw2.to_s
    )

    
    # how about a copy
    @tw.add_tiddler(@tw.get_tiddler("bar").copy_to("bar2"))
    @tw2.add_tiddler(@tw.get_tiddler("bar").copy_to("bar2"))
    
    assert_match(
      /<div tiddler="bar".*tags="hey now">/,
      @tw.to_s
    )

    assert_match(
      /<div title="bar".*tags="hey now">/,
      @tw2.to_s
    )


    assert_match(
      /<div tiddler="bar2".*tags="hey now">/,
      @tw.to_s
    )


    assert_match(
      /<div title="bar2".*tags="hey now">/,
      @tw2.to_s
    )


  end

end
