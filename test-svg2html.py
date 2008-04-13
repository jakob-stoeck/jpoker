#!@PYTHON@
# -*- mode: python -*-
#
# Copyright (C) 2008 Johan Euphrosine <proppy@aminche.com>
# Copyright (C) 2008 Loic Dachary <loic@dachary.org>
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

import unittest

from svg2html import SVG2HTML
from svg2html import SVG2CSS

class SVG2Gtk(unittest.TestCase):
    def test_SVG2HTML(self):
        svg_string = '<svg xmlns:xlink="http://www.w3.org/1999/xlink" id="game_window" width="800" height="600"><g id="g1"><image id="test" x="0" y="1" width="2" height="3" xlink:href="test.png"/></g></svg>'
        html_string = '<html><head></head><body><div id="game_window"><div id="g1"><div id="test{id}" class="ptable_test"></div></div></div></body></html>'
        self.assertEquals(html_string, str(SVG2HTML(svg_string)))
    def test_SVG2CSS(self):
        svg_string = '<svg xmlns:xlink="http://www.w3.org/1999/xlink" id="game_window" width="800" height="600"><g><image id="test" x="0" y="1" width="2" height="3" xlink:href="test.png"/></g></svg>'
        css_string = '.ptable_test { width:2px; height:3px; position:absolute; top:1px; left:0px; background-image:url("test.png"); }\n'
        self.assertEquals(css_string, str(SVG2CSS(svg_string)))
        
if __name__ == '__main__':
    unittest.main()

# Interpreted by emacs
# Local Variables:
# compile-command: "python test-svg2html.py"
# End:
