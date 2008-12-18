
require 'test/unit'
require 'fileutils'
require 'pathname'

$LOAD_PATH << "..";
require 'r4tw'

class TiddlyWikiTest < Test::Unit::TestCase

  def setup
  
    @tw = make_tw { source_file "#{this_dir(__FILE__)}/withcontent/2.2.0.beta5.html" }
    FileUtils.remove_dir 'spit' if File.exists? 'spit'
    Dir.mkdir 'spit'
    
  end

  def teardown
    FileUtils.remove_dir 'spit'
  end

  def test_text
    @tw.add_tiddler_from('tiddler' => 'js tiddler',
                         'text' => ';',
                         'tags' => 'systemConfig',
                         'modified' => Time.now.convertToYYYYMMDDHHMM
                         )
    @tw.write_all_tiddlers_to 'spit'
    @tw.tiddlers.each do |t|
      if t.tags and t.tags.include? "systemConfig"
        type = 'js'
      else
        type = 'tiddler'
      end
      file = "#{this_dir(__FILE__)}/spit/#{t.name}.#{type}"
      assert_equal(t.text, File.read(file))
      if t.modified
          assert_equal(t.modified, File.mtime(file).convertToYYYYMMDDHHMM)
      end
    end
  end   
  
  def test_divs
    @tw.write_all_tiddlers_to('spit', true)
    @tw.tiddlers.each do |t|
      file = "#{this_dir(__FILE__)}/spit/#{t.name}.tiddler"
      assert_equal(t.text, File.read(file))
      assert_equal(t.to_fields_string(true).join(' '), File.read("#{file}.div"))
    end
  end   
  
  def test_slash
    slash_title = 'title with / in / the name'
    @tw.add_tiddler_from('tiddler' => slash_title,
                         'text' => 'ABC'
                         )
    @tw.write_all_tiddlers_to('spit', true)
    assert(File.exists?('spit/title with %2F in %2F the name.tiddler'))
  end   
  
end
