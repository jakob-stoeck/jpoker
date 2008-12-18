
require 'test/unit'
require 'pathname'

# should be a prettier way to do this..

#this_file = Pathname.new(__FILE__)#.realpath
#this_dir = this_file.dirname

#Dir.chdir this_dir

#Dir["*.rb"].reject{|f| f == "all.rb"}.each do |test_unit|
#  require test_unit
#end


# kiss method

require 'utils'
require 'tiddlywiki'
require 'tiddler'
require 'addtag'
require 'shadows'
require 'tiddlerfromurl'
require 'fromurl'
require 'fromremote'
require 'createfrom'
require 'createfrom'
require 'write_all_tiddlers_to'
