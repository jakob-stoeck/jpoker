#
# Copyright (c) 2008 Sabin Iacob (m0n5t3r) <iacobs@m0n5t3r.info>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details. 
#
import simplejson as enc
import gettext
def gettext_json(domain, path, lang = []):
    try:
        tr = gettext.translation(domain, path, lang)
        # for unknown reasons, instead of having plural entries like
        # key: [sg, pl1...]
        # tr._catalog has (key, n): pln,
        keys = tr._catalog.keys()
        keys.sort()
        ret = {}
        for k in keys:
            if k == '':
                continue
            v = tr._catalog[k]
            if type(k) is tuple:
                if k[0] not in ret:
                    ret[k[0]] = []
                ret[k[0]].append(v)
            else:
                ret[k] = v
        return enc.dumps(ret, ensure_ascii = False)
    except IOError:
        return None

import sys
print gettext_json(sys.argv[1], '.', [sys.argv[1]]).encode('UTF-8')

