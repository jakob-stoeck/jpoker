//
//     Copyright (C) 2010 Loic Dachary <loic@dachary.org>
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
(function($) {
    $.jpoker.plugins.login.templates.login = 
        '<ul class=\'jpoker_login_login\'>' +
        ' <li class=\'jpoker_login_label\'>' +
        '  <div class=\'jpoker_login_name_label\'>{login}</div>' +
        '  <div class=\'jpoker_login_password_label\'>{password}</div>' +
        ' </li>' +
        ' <li class=\'jpoker_login_input\'>' +
        '  <div><input type=\'text\' class=\'jpoker_login_name\' /></div>' +
        '  <div><input type=\'password\' class=\'jpoker_login_password\' /></div>' +
        ' </li>' +
        ' <li class=\'jpoker_login_buttons\'>' +
        '  <div class=\'jpoker_login_submit\'><input type=\'text\' class=\'jpoker_login_submit\' value=\'{go}\' /></div>' +
        '  <div class=\'jpoker_login_signup\'><input type=\'text\' class=\'jpoker_login_signup\' value=\'{signup}\' /></div>' +
        ' </li>' + 
        '</ul>';
    $.jpoker.plugins.serverStatus.templates.players = '<div class=\'jpoker_server_status_players\'> <span class=\'jpoker_server_status_players_count\'>{count}</span> <span class=\'jpoker_server_status_players_label\'>{players}</span> online <span class=\'jpoker_server_status_more\'>more...</span></div>';
})(jQuery);
