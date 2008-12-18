Gem::Specification.new do |s|
  s.name = %q{tiddlywiki_cp}
  s.version = "0.5.3"

  s.required_rubygems_version = nil if s.respond_to? :required_rubygems_version=
  s.authors = ["Loic Dachary"]
  s.cert_chain = nil
  s.date = %q{2008-04-08}
  s.default_executable = %q{tiddlywiki_cp}
  s.description = %q{copy tiddlers to files and vice versa}
  s.email = %q{loic@dachary.org}
  s.executables = ["tiddlywiki_cp"]
  s.extra_rdoc_files = ["History.txt", "Manifest.txt", "README.txt", "test/content/tiddly_version_2_1.txt", "test/content/tiddly_version_2_2.txt", "test/content/tiddly_version_2_3.txt"]
  s.files = ["COPYING", "History.txt", "Manifest.txt", "README.txt", "Rakefile", "bin/tiddlywiki_cp", "lib/tiddlywiki_cp.rb", "lib/tiddlywiki_cp/converters.rb", "lib/tiddlywiki_cp/file2file.rb", "lib/tiddlywiki_cp/file2tiddler.rb", "lib/tiddlywiki_cp/r4tw.rb", "lib/tiddlywiki_cp/tiddler2directory.rb", "lib/tiddlywiki_cp/tiddler2file.rb", "lib/tiddlywiki_cp/tiddler2tiddlywiki.rb", "lib/tiddlywiki_cp/tiddler_css.rb", "lib/tiddlywiki_cp/tiddler_html.rb", "lib/tiddlywiki_cp/tiddler_js.rb", "lib/tiddlywiki_cp/tiddlywiki2file.rb", "lib/tiddlywiki_cp/version.rb", "scripts/txt2html", "setup.rb", "test/content/a", "test/content/a.div", "test/content/b", "test/content/d/CVS", "test/content/e", "test/content/e.div", "test/content/html_entities.html", "test/content/ignored#", "test/content/test_fetch.html", "test/content/tiddly_version_2_1.txt", "test/content/tiddly_version_2_2.txt", "test/content/tiddly_version_2_3.txt", "test/content/universe.html", "test/content/2.3.0.html", "test/r4tw/addtag.rb", "test/r4tw/all.rb", "test/r4tw/createfrom.rb", "test/r4tw/empties/2.1.3.html", "test/r4tw/empties/2.2.0.beta5.html", "test/r4tw/fromremote.rb", "test/r4tw/fromurl.rb", "test/r4tw/shadows.rb", "test/r4tw/tiddler.rb", "test/r4tw/tiddlerfromurl.rb", "test/r4tw/tiddlywiki.rb", "test/r4tw/utils.rb", "test/r4tw/withcontent/2.2.0.beta5.html", "test/r4tw/withcontent/22b5index.html", "test/r4tw/withcontent/empty2.html", "test/r4tw/withcontent/nothing.js", "test/r4tw/write_all_tiddlers_to.rb", "test/test_all.rb", "test/test_helper.rb", "test/test_tiddler_css.rb", "test/test_tiddler_html.rb", "test/test_tiddler_js.rb", "test/test_tiddlywiki_cp.rb", "website/files/ChangeLog.tiddler", "website/files/ChangeLog.tiddler.div", "website/files/DefaultTiddlers.tiddler", "website/files/DefaultTiddlers.tiddler.div", "website/files/Introduction.tiddler", "website/files/Introduction.tiddler.div", "website/files/MainMenu.tiddler", "website/files/MainMenu.tiddler.div", "website/files/SiteSubtitle.tiddler", "website/files/SiteSubtitle.tiddler.div", "website/files/SiteTitle.tiddler", "website/files/SiteTitle.tiddler.div", "website/files/Usage.tiddler", "website/files/Usage.tiddler.div", "website/files/WebDavPlugin.js", "website/files/WebDavPlugin.js.div", "website/index.html", "website/index.xml"]
  s.has_rdoc = true
  s.homepage = %q{http://tiddlywikicp.rubyforge.org}
  s.rdoc_options = ["--main", "README.txt"]
  s.require_paths = ["lib"]
  s.required_ruby_version = Gem::Requirement.new("> 0.0.0")
  s.rubyforge_project = %q{tiddlywikicp}
  s.rubygems_version = %q{1.2.0}
  s.summary = %q{copy tiddlers to files and vice versa}
  s.test_files = ["test/test_all.rb"]

  if s.respond_to? :specification_version then
    current_version = Gem::Specification::CURRENT_SPECIFICATION_VERSION
    s.specification_version = 1

    if current_version >= 3 then
    else
    end
  else
  end
end
