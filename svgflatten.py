#!/usr/bin/python
# -*- mode: python -*-
#
# Copyright (C) 2008 Johan Euphrosine <proppy@aminche.com>
# Copyright (C) 2008 Loic Dachary <loic@dachary.org>
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
import re
from xml.dom import minidom
from xml.xpath import Evaluate

def flatten(string):
    doc = minidom.parseString(string)
    for orig in Evaluate('//use', doc):
        xlink = orig.attributes['xlink:href'].nodeValue
        id = orig.attributes['id'].nodeValue
        id_length = len(id)
        nodes = Evaluate('//g[@id="'+xlink[1:]+'"]', doc)
        node = nodes[0]
        copy = node.cloneNode(True)
        for copy_id in Evaluate('.//@id', copy):
            copy_id.nodeValue = id + copy_id.nodeValue[id_length:]
        
        tx, ty = re.match('translate\((-?\d+\.?\d*),(-?\d+\.?\d*)\)', orig.attributes['transform'].nodeValue).groups()
        transform = { 'x': float(tx), 'y': float(ty) }
        for c in [ 'x', 'y' ]:
            for coord in Evaluate('.//@' + c, copy):
                coord.nodeValue = str(int(float(coord.nodeValue) + transform[c]))
        orig.parentNode.replaceChild(copy, orig)
    return doc
    
if __name__ == '__main__':
    import sys
    print flatten(sys.stdin.read()).toxml()
    sys.exit(0)
