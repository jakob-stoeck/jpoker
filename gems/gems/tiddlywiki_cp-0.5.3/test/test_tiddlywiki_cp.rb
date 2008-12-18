#
# Copyright (C) 2007, 2008 Loic Dachary <loic@dachary.org>
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
require 'open-uri'

module TiddlywikiCp

class TiddlyWikiCp

  attr_accessor :stdout

  def puts(string)
    if ! defined?(@stdout):
        @stdout = []
    end
    @stdout.push(string)
  end

end

class TestTiddlywikiCp < Test::Unit::TestCase
  include TiddlyBase

  def test_lang_from_raw
    r = TiddlyWiki.new
    assert_equal('en', r.lang)
    #
    # The regexp does not match
    #
    r.raw = ''
    exception = assert_raise RuntimeError do
      r.lang_from_raw
    end
    assert_match(/no match/, exception.message)
    #
    # lang are inconsistent
    #
    r.raw = '<html xml:lang="en" lang="fr"'
    exception = assert_raise RuntimeError do
      r.lang_from_raw
    end
    assert_match(/'en' and 'fr'/, exception.message)
    #
    # success
    #
    r.raw = '<html xml:lang="fr" lang="fr"'
    r.lang_from_raw
    assert_equal('fr', r.lang)
  end

  def test_locale2lang
    r = TiddlyWiki.new
    r.add_tiddler_from({ 'tiddler' => 'fakefrench',
                          'tags' => ['systemConfig'],
                          'text' => 'config.locale = "fr"' })
    raw = r.locale2lang('<html a="f" xml:lang="en" lang="en" ')
    assert_match(/a="f" xml:lang="fr" lang="fr"/, raw)
    #
    # weird config.locale throw exceptions
    #
    r.get_tiddler('fakefrench').fields['text'] = 'config.locale = "f" + "r"';
    exception = assert_raise RuntimeError do
      r.locale2lang('')
    end
    assert_match(/matches but/, exception.message)
  end

  def test_locale
    t = TiddlyWikiCp.new
    uri = "#{this_dir(__FILE__)}/content/universe.html"
    tw = t.uri2tiddlywiki("#{uri}")
    tw.add_tiddler_from({ 'tiddler' => 'fakefrench',
                          'tags' => ['systemConfig'],
                          'text' => 'config.locale = "fr"' })
    assert_match(/lang="fr"/s, tw.to_s)
  end

  def test_main
    t = TiddlyWikiCp.new
    a = "#{this_dir(__FILE__)}/content/a" # existing file without .div
    t.main([a, 'spit/a'])
    assert(File.exists?('spit/a'))
  end

  def test_parse!
    t = TiddlyWikiCp.new

    options = t.parse!([])

    assert_equal(false, options.times)
    assert(t.parse!(['-t']).times)
    assert(t.parse!(['--times']).times)

    assert_equal(false, options.recursive)
    assert(t.parse!(['-r']).recursive)
    assert(t.parse!(['--recursive']).recursive)

    t.reset
    assert_equal(false, options.recursive)
    assert_equal(false, options.times)
    t.parse!(['-a'])
    assert(t.options.recursive)
    assert(t.options.times)
    t.reset
    t.parse!(['--all'])
    assert(t.options.recursive)
    assert(t.options.times)
    t.reset

    assert_equal(false, options.verbose)
    assert(t.parse!(['-v']).verbose)
    assert(t.parse!(['--verbose']).verbose)

    assert_equal(false, options.dry_run)
    assert(t.parse!(['-n']).dry_run)
    assert(t.parse!(['--dry-run']).dry_run)

    assert_equal([], options.includes)
    assert_equal(['a'], t.parse!(['-i', 'a']).includes)
    assert_equal(['a'], t.parse!(['--include', 'a']).includes)

    assert_equal([], options.excludes)
    assert_equal(['a'], t.parse!(['--exclude', 'a']).excludes)

    t.parse!(['--version'])
    assert_equal(VERSION::STRING, t.stdout[0])
    t.stdout = []

    t.parse!(['--help'])
    assert_match('Usage:', t.stdout[0])
    t.stdout = []

    args = ['-t', 'b', 'c']
    options = t.parse!(args)
    assert_equal(['b', 'c'], args)
  end

  def test_run
    t = TiddlyWikiCp.new

    #
    # not enough arguments
    #
    assert_raise RuntimeError do
      t.run([])
    end

    #
    # destination is not a directory/tiddlywiki
    #
    a = "#{this_dir(__FILE__)}/content/a" # fake tiddler file

    assert_equal(TiddlyWikiCp::CONTAINER_FILE, t.uri2container(a))
    assert_raise RuntimeError do
      t.run([a, a, a])
    end
    
    #
    # copy file to file
    #
    a_c = "spit/a" 
    t.run([a, a_c])
    assert(File.exists?(a_c))
    assert(File.exists?("#{a_c}.div"))
    
    #
    # copy file to tiddlywiki
    #
    e = "#{this_dir(__FILE__)}/content/e" # good tiddler file

    tiddlywiki = "#{this_dir(__FILE__)}/content/universe.html" # regular tiddlywiki
    FileUtils.cp(tiddlywiki, "spit/t.html")
    t.run([e, "spit/t.html"])

    t = TiddlyWikiCp.new
    assert_equal('ETiddler', t.uri2tiddlywiki("spit/t.html").get_tiddler('ETiddler').tiddler)

    #
    # dry run
    #
    t.options.dry_run = true
    a_fake = "spit/a_fake"
    t.run([a, a_fake])
    assert(!File.exists?(a_fake))
    assert_equal("copy '#{a}' '#{a_fake}'", t.stdout[0])
  end

  def test_args2from
    t = TiddlyWikiCp.new

    a = "#{this_dir(__FILE__)}/content/a" # fake tiddler file
    b = "#{this_dir(__FILE__)}/content/b" # existing file without .div
    c = "#{this_dir(__FILE__)}/content/c" # no existent file
    d = "#{this_dir(__FILE__)}/content/d" # directory
    i = "#{this_dir(__FILE__)}/content/ignored#" # ignored
    tiddlywiki = "#{this_dir(__FILE__)}/content/universe.html" # regular tiddlywiki
    tiddler = "#{this_dir(__FILE__)}/content/universe.html#Implementation" # regular tiddler

    #
    # Non recursive
    #
    t.options.excludes = []
    assert_equal([a], t.args2from([a], false))
    t.options.excludes.push('a$')
    assert_equal([], t.args2from([a], false))

    assert_raises Errno::ENOENT do
      t.args2from([b], false)
    end

    assert_raises Errno::ENOENT do
      t.args2from([c], false)
    end

    assert_equal([tiddlywiki], t.args2from([tiddlywiki], false))
    assert_equal([tiddler], t.args2from([tiddler], false))

    assert_raises RuntimeError do
      t.args2from([d], false)
    end

    #
    # Recursive
    #
    t.options.excludes = []
    assert_equal([a], t.args2from([a], true))
    t.options.excludes.push('a$')
    assert_equal([], t.args2from([a], true))

    assert_equal([], t.args2from([i], true))

    assert_raises Errno::ENOENT do
      t.args2from([b], true)
    end

    assert_raises Errno::ENOENT do
      t.args2from([c], true)
    end

    title = '#Implementation'
    t.options.includes = [title]
    assert_equal([tiddlywiki + title], t.args2from([tiddlywiki], true))

    assert_equal([tiddler], t.args2from([tiddler], true))

    assert_equal([], t.args2from([d], true))

  end

  def test_uri2type
    t = TiddlyWikiCp.new
    assert_equal(TiddlyWikiCp::TIDDLER_JS, t.uri2type("#{this_dir(__FILE__)}/content/universe.html#GenerateRssHijack"))
    assert_equal(TiddlyWikiCp::TIDDLER_DEFAULT, t.uri2type("#{this_dir(__FILE__)}/content/universe.html#Scope"))
  end
  
  def test_uri2container
    t = TiddlyWikiCp.new
    assert_equal(TiddlyWikiCp::CONTAINER_TIDDLYWIKI, t.uri2container("#{this_dir(__FILE__)}/content/universe.html"))
    assert_equal(TiddlyWikiCp::CONTAINER_TIDDLER, t.uri2container("#{this_dir(__FILE__)}/content/universe.html#Implementation"))
    assert_equal(TiddlyWikiCp::CONTAINER_DIRECTORY, t.uri2container("."))
    assert_equal(TiddlyWikiCp::CONTAINER_FILE, t.uri2container("whatever"))
    assert_equal(TiddlyWikiCp::CONTAINER_FILE, t.uri2container("#{this_dir(__FILE__)}/content/html_entities.html"))
  end

  def test_ignore?
    t = TiddlyWikiCp.new
    assert(t.ignore?('a/b/#'))
    assert(t.ignore?('a/b/~'))
    assert(t.ignore?('a/b/foo.div'))
    assert(t.ignore?('a/b/foo.div'))
    assert(t.ignore?('a/b/.svn'))
    assert(t.ignore?('a/b/CVS'))
    assert(t.ignore?('a/b/.hg'))
  end

  def test_accept?
    t = TiddlyWikiCp.new
    assert(t.accept?('a'))

    t.options.includes.push('a')
    assert(t.accept?('a'))
    assert_equal(false, t.accept?('b'))

    t.options.excludes.push('ab')
    assert(t.accept?('a'))
    assert_equal(false, t.accept?('b'))
    assert_equal(false, t.accept?('ab'))
  end
  
  def test_tiddler2filename
    assert_equal('D/a%2Fb%2Fc', TiddlyWikiCp.tiddler2filename('D', 'F#a/b/c'))
    assert_raise RuntimeError do
      TiddlyWikiCp.tiddler2filename('D', 'a/b/c')
    end
  end

  def test_uri2tiddler
    t = TiddlyWikiCp.new
    assert('Rationale', t.uri2tiddler("#{this_dir(__FILE__)}/content/universe.html#Rationale").name)
  end

  def test_uri2tiddlywiki
    t = TiddlyWikiCp.new
    uri = "#{this_dir(__FILE__)}/content/universe.html"
    #
    # read
    #
    tw = t.uri2tiddlywiki("#{uri}#f")
    assert_equal('Implementation', tw.get_tiddler('Implementation').name)
    assert_equal(t.tiddlywiki_cache[uri], tw)
    #
    # check that content is verbatim (not decodeHTML)
    #
    assert_match(/< > \" &/, tw.get_tiddler('Rationale').text)
    #
    # check cache is reused
    #
    tw.get_tiddler('Implementation').rename('Other Implementation')
    tw = t.uri2tiddlywiki("#{uri}#f")
    assert_equal(nil, tw.get_tiddler('Implementation'))
  end

  def test_read_write_uri
    t = TiddlyWikiCp.new
    content = t.read_uri("#{this_dir(__FILE__)}/content/html_entities.html")
    assert_equal(content.length, File.size("#{this_dir(__FILE__)}/content/html_entities.html"))
    t.write_uri("spit/out.html", content)
    assert_equal(File.size("#{this_dir(__FILE__)}/content/html_entities.html"), File.size("spit/out.html"))
    assert_equal(t.file_cache["spit/out.html"], File.read("spit/out.html"))

    assert_raise  Errno::ENOENT do
      t.read_uri("unlikely_to_exists")
    end

    assert_raise OpenURI::HTTPError, Errno::ECONNREFUSED do
      t.read_uri('http://127.0.0.1/unlikely_to_exists')
    end
  end

  def test_without_fragment
    assert_equal('http://a.com/', TiddlyWikiCp.without_fragment('http://a.com/#f'))
    assert_equal('/dir/file', TiddlyWikiCp.without_fragment('/dir/file#f'))
    assert_equal('/dir/file', TiddlyWikiCp.without_fragment('/dir/file'))
  end

  def test_tiddler_uri?
    assert_equal(false, TiddlyWikiCp.tiddler_uri?('http://domain.com/'))
    assert_equal(false, TiddlyWikiCp.tiddler_uri?('/dir/file.html'))
    assert(TiddlyWikiCp.tiddler_uri?('http://domain.com/#tiddler'))
  end

  def test_tiddlywiki?
    t = TiddlyWikiCp.new
    assert(t.tiddlywiki?("#{this_dir(__FILE__)}/content/tiddly_version_2_3.txt"))
    assert(t.tiddlywiki?("#{this_dir(__FILE__)}/content/tiddly_version_2_2.txt"))
    assert(t.tiddlywiki?("#{this_dir(__FILE__)}/content/tiddly_version_2_1.txt"))
    assert_equal(nil, t.tiddlywiki?("#{this_dir(__FILE__)}/content/html_entities.html"))
  end

  def test_tiddler2file
    t = TiddlyWikiCp.new
    a = "#{this_dir(__FILE__)}/content/universe.html#Implementation"
    t.tiddler2file(a, "-")
    assert(t.stdout.select{ |l| l =~ /Implementation/ })
    t.options.times = true
    tiddler = t.uri2tiddlywiki(a).get_tiddler('Implementation')
    t.tiddler2file(a, "spit/a")
    assert(Time.convertFromYYYYMMDDHHMM(tiddler.modified), File.mtime("spit/a"))
  end

  def test_file2tiddler
    #
    # Write to file
    #
    t = TiddlyWikiCp.new
    a = "#{this_dir(__FILE__)}/content/universe.html#Implementation"
    tiddler = t.uri2tiddler(a)
    original_modified = tiddler.modified
    t.tiddler2file(a, "spit/a")
    #
    # Read back
    #
    t = TiddlyWikiCp.new
    t.options.times = true
    t.file2tiddler("spit/a", a)
    tiddler = t.uri2tiddler(a)
    assert(original_modified != tiddler.modified)
    assert(Time.convertFromYYYYMMDDHHMM(tiddler.modified), File.mtime("spit/a"))
    #
    # Write and read a JS file
    #
    j = "#{this_dir(__FILE__)}/content/universe.html#TiddlyLightBoxPlugin"
    original = t.uri2tiddler(j).text
    t.tiddler2file(j, "spit/b")
    t.file2tiddler("spit/b", j)
    t.tiddler2file(j, "spit/c")
    t.uri2tiddler(j).fields['text'] = 'NONE'
    t.file2tiddler("spit/c", j)
    assert_match(/lightBoxTitle \{padding:0px/, original)
    transformed = t.uri2tiddler(j).text
    assert_match(/TiddlyLightBoxStyles=\"/, original)
    assert_equal(original, transformed)
  end

  def test_file2markuptiddler
    t = TiddlyWikiCp.new
    [ "#{this_dir(__FILE__)}/content/universe.html", 
      "#{this_dir(__FILE__)}/content/2.3.0.html" ].each do |uri| 
      tw = t.uri2tiddlywiki("#{uri}")
      TiddlyWiki::TIDDLER2MARKUP.each_pair do |tiddler, markup|
        mark = "XXX#{tiddler}XXX"
        tw.add_tiddler_from({ 'tiddler' => tiddler, 'text' => mark})
        if tiddler == 'MarkupPostBody' && tw.version > 22
          markup = 'POST-SCRIPT'
        end
        assert_match(/#{markup}-START.*#{mark}.*#{markup}-END/sm, tw.to_s)
      end
    end
  end

  def test_tiddler2directory
    t = TiddlyWikiCp.new
    t.tiddler2directory("#{this_dir(__FILE__)}/content/universe.html#Implementation", "spit")
    assert(File.exists?('spit/Implementation.tiddler'))
  end

  def test_tiddler2tiddlywiki
    u = "#{this_dir(__FILE__)}/content/universe.html"
    t = TiddlyWikiCp.new
    FileUtils.cp(u, "spit/t.html")
    tiddler = t.uri2tiddlywiki(u).get_tiddler("Implementation")
    tiddler.rename('NEW')
    t.tiddler2tiddlywiki("#{u}#NEW", "spit/t.html")
    assert(t.uri2tiddlywiki("spit/t.html").get_tiddler("NEW"))
  end

  def test_tiddlywiki2file
    t = TiddlyWikiCp.new
    t.tiddlywiki2file("#{this_dir(__FILE__)}/content/universe.html", "spit/u.html")
    assert(File.exists?('spit/u.html'))
  end

end

end # module TiddlywikiCp
# Local Variables:
# compile-command: "RUBYLIB='../lib/tiddlywiki_cp:../lib' ruby test_tiddlywiki_cp.rb"
# End:
