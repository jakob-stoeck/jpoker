#!/usr/bin/python
# -*- mode: python -*-
#
# Copyright (C) 2008 Johan Euphrosine <proppy@aminche.com>
# Copyright (C) 2007,2008 Loic Dachary <loic@dachary.org>
# Copyright (C) 2006 Mekensleep
#
# Mekensleep
# 24 rue vieille du temple
# 75004 Paris
#       licensing@mekensleep.com
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301, USA.
#

from xml.sax import parseString
from xml.sax.handler import ContentHandler
from xml.dom import minidom
from xml.xpath import Evaluate
import string
import re

class SVGParse(ContentHandler):
    def __init__(self, string): 
        self.root = ""
        self.formats = []
        self.tuples = []
        self.doc = minidom.parseString(string)
        parseString(string, self)
    def __str__(self):
        return string.join(map(lambda format, tuple: format % tuple, self.formats, self.tuples), '')
    def startElement(self, name, attrs):
        if name == "svg":
            self.startElementSvg(attrs)
        elif name == "image":
            self.startElementImage(attrs)
        elif name == "g":
            self.startElementGroup(attrs)
    def startElementGroup(self, attrs):
        pass
    def endElementSvg(self, attrs):
        pass
    def endElementGroup(self, attrs):
        pass
    def endElement(self, name):
        if name == "svg":
            self.endElementSvg(name)
        elif name == "g":
            self.endElementGroup(name)

class SVG2HTML(SVGParse):
    def startElementSvg(self, attrs):
        self.formats.append('<html><head></head><body><div id="%s">')
        self.tuples.append((attrs['id'],))
    def startElementImage(self, attrs):
        self.formats.append('<div id="%s" class="jpoker_ptable_%s"></div>')
        self.tuples.append((attrs['id'],attrs['id']))
    def startElementGroup(self, attrs):
        self.formats.append('<div id="%s">')
        self.tuples.append((attrs['id'],))
    def endElementSvg(self, anem):
        self.formats.append('</div></body></html>')
        self.tuples.append(())
    def endElementGroup(self, anem):
        self.formats.append('</div>')
        self.tuples.append(())

class SVG2JSON(SVGParse):
    def startElementSvg(self, attrs):
        self.formats.append("<div id=\\'%s{id}\\'>")
        self.tuples.append((attrs["id"],))
    def startElementImage(self, attrs):
        self.formats.append("<div id=\\'%s{id}\\' class=\\'jpoker_ptable_%s\\'></div>")
        self.tuples.append((attrs["id"],attrs["id"]))
    def startElementGroup(self, attrs):
        self.formats.append("<div id=\\'%s{id}\\'>")
        self.tuples.append((attrs["id"],))
    def endElementSvg(self, anem):
        self.formats.append("</div>")
        self.tuples.append(())
    def endElementGroup(self, anem):
        self.formats.append("</div>")
        self.tuples.append(())

class SVG2CSS(SVGParse):
    def startElementSvg(self, attrs):
        self.root = attrs['id']
    def startElementImage(self, attrs):
        format = '.jpoker_ptable_%s { width:%spx; height:%spx; position:absolute; top:%spx; left:%spx; background-image:url("images/%s"); }\n'
        self.formats.append(format)
        self.tuples.append((attrs['id'], attrs['width'], attrs['height'], attrs['y'], attrs['x'], attrs['xlink:href']))

if __name__ == '__main__':
    import sys
    if len(sys.argv) == 2:
        if sys.argv[1] == "--html":
            print SVG2HTML(sys.stdin.read())
        elif sys.argv[1] == "--css":
            print SVG2CSS(sys.stdin.read())
        elif sys.argv[1] == "--json":
            print SVG2JSON(sys.stdin.read())
    sys.exit(0)