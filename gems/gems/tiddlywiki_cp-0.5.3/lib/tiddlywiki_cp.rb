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
require 'tiddlywiki_cp/r4tw'
require 'tiddlywiki_cp/version'
require 'tiddlywiki_cp/converters'
require 'optparse'
require 'ostruct'
require 'open-uri'
require 'find'

module TiddlywikiCp

  class TiddlyWikiCp

    CONTAINER_DIRECTORY = 'directory'
    CONTAINER_FILE = 'file'
    CONTAINER_TIDDLYWIKI = 'tiddlywiki'
    CONTAINER_TIDDLER = 'tiddler'

    TIDDLER_DEFAULT = CONTAINER_TIDDLER

    attr_reader :file_cache
    attr_reader :tiddlywiki_cache
    attr_accessor :options

    def initialize(*args)
      reset
    end

    def reset() #:nodoc:
      @file_cache = {}
      @tiddlywiki_cache = {}

      @options = OpenStruct.new
      @options.verbose = false
      @options.times = false
      @options.recursive = false
      @options.dry_run = false
      @options.includes = []
      @options.excludes = []
      @options.ignores = ['(CVS|\.hg|\.svn)$', '(#|~|.div)$']
    end

    def main(argv) #:nodoc:
      args = argv.clone
      if parse!(args)
        run(args)
      end
    end

    def parse!(argv) #:nodoc:
      reset
      cmd = File.basename($0, '.*')

      opts = OptionParser.new do |opts|
       
        opts.banner = "Usage: #{cmd} [options] FROM [FROM ...] TO|-"

        opts.separator ""

        opts.on("-r", "--[no-]recursive",
                "recurse into directories and tiddlywikies") do |v|
          @options.recursive = v
        end

        opts.on("-t", "--[no-]times",
                "preserve modification time") do |v|
          @options.times = v
        end

        opts.on("-a", "--all",
                "implies -rt") do 
          @options.times = true
          @options.recursive = true
        end

        opts.on("-i", "--include REGEX", 
                "all files,directories or tiddlers must match regex.",
                "    If specified multiple times, ",
                "    must match at least one of the regex.",
                "    Includes are tested after excludes.") do |regex|
          @options.includes.push(regex)
        end

        opts.on("--exclude REGEX", 
                "all files,directories or tiddlers must NOT match regex.",
                "    If specified multiple times, ",
                "    exclude if matches at least one of the regex.",
                "    Includes are tested after excludes.") do |regex|
          @options.excludes.push(regex)
        end

        opts.on("-v", "--[no-]verbose", "run verbosely") do |v|
          @options.verbose = v
        end

        opts.on("-n", "--[no-]dry-run", "show what would have been transferred") do |v|
          @options.dry_run = v
        end

        opts.on("--version", "show version") do
          puts VERSION::STRING
          return false
        end

        opts.on("--help", "show command usage") do
          puts opts.help
          return false
        end

        opts.separator ""
        opts.separator "Examples:"
        opts.separator ""
        opts.separator "  mkdir /tmp/a ; #{cmd} -a http://tiddlywiki.com/index.html /tmp/a"
        opts.separator "       copies index.html tiddlers in separate files and preserve times."
        opts.separator "       For each tiddler, a .div file contains the meta information."
        opts.separator "       The files are named after their content:"
        opts.separator "       /tmp/a/HelloThere.tiddler"
        opts.separator "       /tmp/a/HelloThere.tiddler.div"
        opts.separator "       /tmp/a/Plugin.js"
        opts.separator "       /tmp/a/Plugin.js.div"
        opts.separator "       /tmp/a/OwnStyle.css"
        opts.separator "       /tmp/a/OwnStyle.css.div"
        opts.separator "       ..."
        opts.separator ""
        opts.separator "  #{cmd} 'http://tiddlylab.bidix.info/#WebDAVSavingPlugin' tiddlywiki.html"
        opts.separator "       copies the WebDAVSavingPlugin tiddler in the existing tiddlywiki.html"
        opts.separator ""
        opts.separator "  #{cmd} http://tiddlywiki.com/index.html /tmp/i.html"
        opts.separator "       copies to a local file "
        opts.separator ""
        opts.separator "  #{cmd} -t myplugin.js tiddlywiki.html"
        opts.separator "       copies the tiddler in the existing tiddlywiki.html tiddlywiki"
        opts.separator "       and use file system modification time"
        opts.separator ""
        opts.separator "  #{cmd} 'http://tiddlylab.bidix.info/#WebDAVSavingPlugin' WebDAVSavingPlugin.js"
        opts.separator "       get a local copy of the WebDAVSavingPlugin tiddler"
        opts.separator ""
        opts.separator "  mkdir A ; #{cmd} -a --include 'WebDAV' --include 'RSS' 'http://tiddlylab.bidix.info/' A"
        opts.separator "       copy all tiddlers with WebDAV or RSS in the url"
        opts.separator ""
        opts.separator "  mkdir A ; #{cmd} -a --exclude 'SEX' 'http://tiddlylab.bidix.info/' A"
        opts.separator "       copy all tiddlers except those with SEX in the url"
        opts.separator ""
        opts.separator "  #{cmd} -a A B C tiddlywiki.html"
        opts.separator "       copy all tiddlers found in the A B and C directories to tiddlywiki.html"
        opts.separator ""
        opts.separator "MarkupPreHead, MarkupPostHead, MarkupPreBody, MarkupPostBody tiddlers:"
        opts.separator ""
        opts.separator "  When copying to a tiddlywiki file, the content of these tiddlers "
        opts.separator "  are copied to the corresponding HTML zones."
        opts.separator ""
        opts.separator "translations, i18n, l10n, linguo:"
        opts.separator ""
        opts.separator "  If a translation plugin such as the one found at "
        opts.separator "  http://trac.tiddlywiki.org/wiki/Translations"
        opts.separator "  is present, the tiddlywiki to which tiddlers are copied"
        opts.separator "  will have its lang and xml:lang attributes updated."
        opts.separator "  Saving the tiddlywiki manually does the same."
        opts.separator ""

      end
      opts.parse!(argv)
      return @options
    end  # parse()

    def run(args) #:nodoc:
      if args.length < 2
        raise "need at least two arguments"
      end

      to = args.pop
      to_container = uri2container(to)
      to_type = uri2type(to)

      from = args2from(args, @options.recursive)
      #
      # more than 2 args but really only 1 because of the pop above
      #
      if from.length > 1 && to_container != CONTAINER_TIDDLYWIKI && to_container != CONTAINER_DIRECTORY
        raise "the destination must be a tiddlywiki or a directory when more than two arguments are given (from = \n" + from.join("\n")
      end

      from.each { |from|
        from_type = uri2type(from)
        method = "#{from_type}2#{to_type}"
        if @options.dry_run or @options.verbose
          puts "copy '#{from}' '#{to}'"
        end
        if ! @options.dry_run
          self.send(method.intern, from, to)
        end
      }

      #
      # sync the tiddlywiki destination file system when done
      #
      if to_container == CONTAINER_TIDDLYWIKI || to_container == CONTAINER_TIDDLER
        uri2tiddlywiki(to).to_file(TiddlyWikiCp.without_fragment(to))
      end

    end

    def args2from(args, recursive) #:nodoc:
      new_args = []
      if recursive
        Find.find(*args) { |uri|
          if File.exists?(uri) && File.ftype(uri) == 'directory'
            next 
          end
          
          if ignore?(uri)
            next
          end

          case uri2container(uri)
            when CONTAINER_FILE
               if File.exists?(uri)
                 if File.exists?("#{uri}.div")
                   new_args.push(uri)
                 else
                   raise Errno::ENOENT, "#{uri}.div"
                 end
               else
                 raise Errno::ENOENT, "#{uri}"
               end

            when CONTAINER_TIDDLYWIKI
                new_args += uri2tiddlywiki(uri).tiddlers.map{|t| uri + "#" + t.name.gsub('/', '%2F')}
            
            when CONTAINER_TIDDLER
                new_args.push(uri)
          end
        }
      else
        args.each do |uri|
          case uri2container(uri)
            when CONTAINER_FILE
               if File.exists?(uri)
                 if File.exists?("#{uri}.div")
                   new_args.push(uri)
                 else
                   raise Errno::ENOENT, "#{uri}.div"
                 end
               else
                 raise Errno::ENOENT, "#{uri}"
               end

            when CONTAINER_TIDDLYWIKI
                new_args.push(uri)
            
            when CONTAINER_TIDDLER
                new_args.push(uri)

            when CONTAINER_DIRECTORY
                raise "#{uri} is a directory"
          end
        end
      end

      new_args.reject! { |uri| ! accept?(uri) }
      return new_args

    end

    def uri2type(uri) #:nodoc:
      type = uri2container(uri)
      if type == CONTAINER_TIDDLER
        print "uri2type '#{uri}' " if @options.verbose
        tiddler = uri2tiddler(uri)
        predicates = methods.select{ |m| m =~ /^tiddler_.*?/ }.sort
        predicates.each do |p|
          got_type = self.send(p.intern, tiddler)
          if got_type
            type = got_type
            break
          else
            print "." if @options.verbose
          end
        end
        print " #{type}\n" if @options.verbose
      end
      return type
    end

    def uri2container(uri) #:nodoc:
      begin
        if File.exists?(uri) && File.ftype(uri) == 'directory'
          uri_container = CONTAINER_DIRECTORY
        elsif tiddlywiki? uri
          if TiddlyWikiCp.tiddler_uri? uri
            uri_container = CONTAINER_TIDDLER
          else
            uri_container = CONTAINER_TIDDLYWIKI
          end
        else
          uri_container = CONTAINER_FILE
        end
      rescue OpenURI::HTTPError, Errno::ECONNREFUSED,  Errno::ENOENT
        uri_container = CONTAINER_FILE
      end
      print "uri2container '#{uri}' -> #{uri_container}\n" if @options.verbose
      return uri_container
    end

    def ignore?(uri)
      @options.ignores.each do |regex|
        return true if uri.match(regex)
      end
      return false
    end

    def accept?(uri)
      @options.excludes.each do |regex|
        return false if uri.match(regex)
      end
      if @options.includes.length > 0
        @options.includes.each do |regex|
          return true if uri.match(regex)
        end
        return false
      else
        return true
      end
    end

    def self.tiddler2filename(directory, uri) #:nodoc:
      fragment = uri.split('#')[1]
      if ! fragment
        raise "missing fragment in #{uri}" 
      end
      return Pathname.new(directory).join(fragment.gsub('/', '%2F')).to_s
    end

    def uri2tiddler(uri) #:nodoc:
      fragment = uri.split('#')[1]
      return uri2tiddlywiki(uri).get_tiddler(fragment)
    end

    def uri2tiddlywiki(uri) #:nodoc:
      uri = TiddlyWikiCp.without_fragment(uri)
      if ! @tiddlywiki_cache.has_key?(uri)
        tiddlywiki = TiddlyWiki.new
        #
        # read all tiddlers verbatim (do not decode content)
        #
        tiddlywiki.raw = read_uri(uri)
        tiddlywiki.instance_eval do
          use_pre_from_raw
          lang_from_raw
          @tiddlers = tiddlywiki.tiddler_divs.map do |tiddler_div|
            Tiddler.new.from_div(tiddler_div, @use_pre)
          end
        end
        @tiddlywiki_cache[uri] = tiddlywiki
      end
      return @tiddlywiki_cache[uri]
    end

    def read_uri(uri) #:nodoc:
      uri = TiddlyWikiCp.without_fragment(uri)

      if ! @file_cache.has_key?(uri)
        @tiddlywiki_cache.delete(uri)
        @file_cache[uri] = open(uri).read
      end
      return @file_cache[uri]
    end

    def write_uri(uri, content) #:nodoc:
      uri = TiddlyWikiCp.without_fragment(uri)
      @tiddlywiki_cache.delete(uri)

      @file_cache[uri] = content
      fd = open(uri, "w")
      fd.write(content)
      fd.close()
    end

    def self.without_fragment(uri) #:nodoc:
      uri.gsub(/#.*/, '')
    end

    def self.tiddler_uri?(uri) #:nodoc:
      return uri.include?('#')
    end

    def tiddlywiki?(uri) #:nodoc:
      content = read_uri(uri)
      return content =~ /var version = \{title: "TiddlyWiki"/ ||
          content =~ /var version = \{major: 2, minor: 1, revision: 3/
    end # tiddlywiki?

  end # TiddlyWikiCp

end
