//
//     Copyright (C) 2009 Loic Dachary <loic@dachary.org>
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
    var jpoker = $.jpoker;

    jpoker.admin = function(selector) {
        $(selector).jpoker('tourneyAdminList', '', {})
    };

    //
    // tourneyAdminList
    //
    jpoker.plugins.tourneyAdminList = function(url, options) {

        var tourneyAdminList = jpoker.plugins.tourneyAdminList;
        var opts = $.extend({}, tourneyAdminList.defaults, options);
        url = url + opts.path;

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();
		
                $this.append('<div class=\'jpoker_widget jpoker_admin_' + opts.css_tag + 'tourney_list\' id=\'' + id + '\'></table>');
                var error = function(xhr, status, error) {
                    throw error;
                };

                var success = function(tourneys, status) {
                    var element = document.getElementById(id);
                    if(element) {
                        $(element).html(tourneyAdminList.getHTML(id, tourneys, opts));
                        tourneyAdminList.decorate(url, id, tourneys, opts);
                        opts.callback.display_done(element);
                    }
                };

                var params = {
                    'query': 'SELECT * FROM tourneys_schedule WHERE active = \'n\'',
                    'output': 'rows'
                };
                opts.ajax({
                        async: false,
                            mode: 'queue',
                            timeout: 30000,
                            url: url + '?' + $.param(params),
                            type: 'GET',
                            dataType: 'json',
                            global: false,
                            success: success,
                            error: error
                    });
                return this;
            });
    };

    jpoker.plugins.tourneyAdminList.update = function(url, id, tourney, options) {
        var element = $('#admin' + tourney.id);
        if(element.length > 0) {
            var setters = [];
            var inputs = $('input', element);
            for(var i = 0; i < inputs.length; i++) {
                var name = $.attr(inputs[i], 'name');
                var value = $.attr(inputs[i], 'value');
                if(name == 'start_time' || name == 'register_time') {
                    value = Date.parseDate(value, options.date_format).valueOf() / 1000;
                }
                if(tourney[name] != value) {
                    setters.push(name + ' = \'' + value.toString() + '\'');
                }
            }
            $('select', element).each(function() {
                    var name = $(this).attr('name');
                    var value = $('option:selected', this).val();
                    if(tourney[name] != value) {
                        setters.push(name + ' = \'' + value.toString() + '\'');
                    }
                });

            if(setters.length == 0) {
                return undefined;
            }
            
            var params = {
                'query': 'UPDATE tourneys_schedule SET ' + setters.join(',') + ' WHERE serial = ' + tourney.serial.toString()
            };

            var error = function(xhr, status, error) {
                throw error;
            };

            var success = function(rowcount, status) {
                if(rowcount != 1) {
                    throw 'expected ' + params.query + ' to modify exactly one row but it modified ' + rowcount.toString() + ' rows instead';
                }
            };

            options.ajax({
                    async: false,
                        mode: 'queue',
                        timeout: 30000,
                        url: url + '?' + $.param(params),
                        type: 'GET',
                        dataType: 'json',
                        global: false,
                        success: success,
                        error: error
                        });
            return true;
        } else {
            return false;
        }
    };

    jpoker.plugins.tourneyAdminList.decorate = function(url, id, tourneys, options) {

        var element = document.getElementById(id);
        var tourneyAdminList = jpoker.plugins.tourneyAdminList;

        for(var i = 0; i < tourneys.length; i++) {
            (function(){
                var tourney = tourneys[i];
                var row = $('#admin' + tourney.id);
                row.keypress(function(event) {
                        if(event.which == 13) {
                            var element = document.getElementById(id);
                            tourneyAdminList.update(url, id, tourney, options);
                        }
                    });
                $('select', row).each(function() {
                        var name = $(this).attr('name');
                        $(this).val(tourney[name]);
                    }); 
                $('input[name=start_time],input[name=register_time]', row).dynDateTime({
                        showsTime: true,
                            ifFormat: options.date_format,
                            align: "TL",
                            electric: false,
                            singleClick: false,
                            button: ".next()" //next sibling
                            });

            })();
        }
        if(tourneys.length > 0) {
            var t = options.templates;
            var params = {
                container: $('.pager', element),
                positionFixed: false,
                previous_label: t.previous_label.supplant({previous_label: "Previous page"}),
                next_label: t.next_label.supplant({next_label: "Next page"})};
            $('table', element).tablesorter({widgets: ['zebra'], sortList: options.sortList}).tablesorterPager(params);
        }
    };

    jpoker.plugins.tourneyAdminList.getHTML = function(id, tourneys, options) {
        var t = options.templates;
        var html = [];
        html.push(t.header.supplant({
		    'players_quota': "Players Quota",
                        'players_abbrev':"Play.",
                        'breaks_first':"Break First",
                        'name':"Name",
                        'description_short':"Description",
                        'start_time':"Start Time",
                        'breaks_interval':"Breaks Interval",
                        'breaks_interval_abbrev':"Brk.",
                        'variant':"Variant",
                        'betting_structure':"Betting Structure",
                        'currency_serial':"Currency",
                        'buy_in':"Buy In",
                        'breaks_duration':"Breaks Duration",
                        'sit_n_go':"Sit'n'Go",
			'player_timeout':"Player Timeout",
                        'player_timeout_abbrev':"Time"
                        }));
        for(var i = 0; i < tourneys.length; i++) {
            var tourney = tourneys[i];
            if(!('game_id' in tourney)) {
                tourney.game_id = tourney.serial;
                tourney.id = tourney.game_id + id;
                tourney.buy_in /= 100;
	    }
	    tourney.start_time_string = new Date(tourney.start_time*1000).print(options.date_format);
            html.push(t.rows.supplant(tourney).replace(/{oddEven}/g, i%2 ? 'odd' : 'even'));
        }
        html.push(t.footer);
        html.push(t.pager);
        return html.join('\n');
    };

    jpoker.plugins.tourneyAdminList.snippets = {
        'variants': '<select name=\'variant\'><option value=\'holdem\'>Holdem</option><option value=\'omaha\'>Omaha</option><option value=\'omaha8\'>Omaha High/Low</option></select>',
        'betting_structure': '<select name=\'betting_structure\'><option value=\'level-001\'>10 minutes</option></select>',
        'start_time': '<input type=\'text\' value=\'{start_time_string}\' name=\'start_time\'/><button type=\'button\'>pick</button>'
    };

    jpoker.plugins.tourneyAdminList.defaults = $.extend({
            sortList: [[0, 0]],
            date_format: '%Y/%m/%d-%H:%M',
            path: '/cgi-bin/poker-network/pokersql',
            string: '',
            css_tag: '',
            templates: {
                header : '<table><thead><tr><th>{description_short}</th><th>{variant}</th><th>{players_quota}</th><th>{buy_in}</th><th>{start_time}</th></tr></thead><tbody>',
                rows : '<tr id=\'admin{id}\' class=\'{oddEven}\'><td><input name=\'description_short\' title=\'Short description of the tournament. It will be displayed on each line of the tournament list.\' value=\'{description_short}\' /></td><td>' + jpoker.plugins.tourneyAdminList.snippets.variants + '</td><td>{players_quota}</td><td>{buy_in}</td><td>' + jpoker.plugins.tourneyAdminList.snippets.start_time + '</td></tr>',
                footer : '</tbody></table>',
                link: '<a href=\'{link}\'>{name}</a>',
                pager: '<div class=\'pager\'><input class=\'pagesize\' value=\'10\'></input><ul class=\'pagelinks\'></ul></div>',
                next_label: '{next_label} >>>',
                previous_label: '<<< {previous_label}'
            },
            callback: {
                display_done: function(element) {
                }
            },
            ajax: function(o) { return jQuery.ajax(o); }
        }, jpoker.defaults);

})(jQuery);
