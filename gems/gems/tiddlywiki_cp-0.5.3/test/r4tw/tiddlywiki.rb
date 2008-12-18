
require 'test/unit'

$LOAD_PATH << "..";
require 'r4tw'

class TiddlyWikiTest < Test::Unit::TestCase

  def setup
  
    # these are 2.1 TW
    @tw1 = make_tw { source_file "#{this_dir(__FILE__)}/empties/2.1.3.html" }    
    @tw2 = make_tw { source_file "#{this_dir(__FILE__)}/withcontent/empty2.html" }
    
    # these two are 2.2 beta TW
    @tw3 = make_tw { source_file "#{this_dir(__FILE__)}/empties/2.2.0.beta5.html" }
    @tw4 = make_tw { source_file "#{this_dir(__FILE__)}/withcontent/2.2.0.beta5.html" }

    @tw5 = make_tw { source_file "#{this_dir(__FILE__)}/withcontent/22b5index.html" }

  end

  def test_load_empty

    # should be the case that reading and writing a TW
    # doesn't change it
    assert_equal(File.read("#{this_dir(__FILE__)}/empties/2.1.3.html"),@tw1.to_s)
    assert_equal(File.read("#{this_dir(__FILE__)}/withcontent/empty2.html"),@tw2.to_s)
    
    assert_equal(File.read("#{this_dir(__FILE__)}/empties/2.2.0.beta5.html"),@tw3.to_s)
    assert_equal(File.read("#{this_dir(__FILE__)}/withcontent/2.2.0.beta5.html"),@tw4.to_s)

    assert_equal(File.read("#{this_dir(__FILE__)}/withcontent/22b5index.html"),@tw5.to_s)

  end
    
  def test_orig_tiddler
  
    # check that we found some tiddlers or not as approriate
            
    assert_equal(0,@tw1.tiddlers.length)            
    
    assert_equal(
      "translations",
      @tw2.get_tiddler("translations").name
      )

    assert_equal(
      "JeremyRuston",
      @tw2.get_tiddler("translations").modifier
      )


    assert_equal(0,@tw3.tiddlers.length)            
    
    assert_equal(2,@tw4.tiddlers.length)            

    assert_equal(
      "SimonBaird",
      @tw4.get_tiddler("Foo").modifier
      )

       
  end   
  
end
