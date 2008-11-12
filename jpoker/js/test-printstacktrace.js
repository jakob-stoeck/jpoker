//
//     Copyright (C) 2008 Loic Dachary <loic@dachary.org>
//     Copyright (C) 2008 Johan Euphrosine <proppy@aminche.com>
//
//     This program is free software: you can redistribute it and/or modify
//     it under the terms of the GNU General Public License as published by
//     the Free Software Foundation, either version 3 of the License, or
//     (at your option) any later version.
//
//     This program is distributed in the hope that it will be useful,
//     but WITHOUT ANY WARRANTY; without even the implied warranty of
//     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//     GNU General Public License for more details.
//
//     You should have received a copy of the GNU General Public License
//     along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

module("printstacktrace");

test("mode", function() {
        expect(1);
        equals("firefox other opera".indexOf(printStackTrace.prototype.mode()) >= 0,true);
    });

test("firefox", function() {
        var mode = printStackTrace.prototype.mode();
        var e = [];
        e.push({ stack: 'discarded()...\nf1(1,"abc")@file.js:40\n()@file.js:41\n@:0  \nf44()@file.js:494'});
        if(mode == 'firefox') {
            function discarded() {
                try {(0)()} catch (exception) {
                    e.push(exception);
                }
            };
            function f1(arg1, arg2) {
                discarded();
            };
            var f2 = function() {
                f1(1, "abc");
            };
            f2();
        }
        expect(4 * e.length);
        for(var i = 0; i < e.length; i++) {
            var message = printStackTrace.prototype.firefox(e[i]);
            var message_string = message.join("\n");
            //            equals(message_string, '', 'debug');
            equals(message_string.indexOf('discarded'), -1, 'discarded');
            equals(message[0].indexOf('f1(1,"abc")') >= 0, true, 'f1');
            equals(message[1].indexOf('{anonymous}()') >= 0, true, 'f2 anonymous');
            equals(message[2].indexOf('@:0'), -1, '@:0 discarded');
        }
    });
