//
//     Copyright (C) 2009 Loic Dachary <loic@dachary.org>
//     Copyright (C) 2009 Johan Euphrosine <proppy@aminche.com>
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

    jpoker.tourneyAdminEdit = function(url, tourney, options) {
        var dialog = $('#jpokerAdminEdit');
        if(dialog.size() != 1) {
            $('body').append('<div id=\'jpokerAdminEdit\' class=\'jpoker_jquery_ui\' />');
            dialog = $('#jpokerAdminEdit');
            dialog.dialog({ width: '700px', height: '500px', autoOpen: false, dialog: true, title: 'edit tournament'});
        }
        dialog.jpoker('tourneyAdminEdit', url, tourney, options);
        dialog.dialog('open');
	$.validator.methods.greaterOrEqual = function(value, element, param) {
	    return parseInt(value) >= parseInt($(param).val());
	};
	$("form", dialog).validate({
		ignoreTitle: true,
		    rules: {
		    players_min: {
			min: 2
			    },
			players_quota: {
			min: 2,
			    greaterOrEqual: '.jpoker_admin_players_min input'
			    },
			seats_per_game: {
			range: [2, 10]
			    },
			player_timeout: {
			min: 30,
			    max: 120
			    },
		},
		    messages: {
		    players_quota: {
			greaterOrEqual: 'Player quota should be greater or equal to player min.'
			    }
		}
	    });
        return dialog;
    };

    //
    // tourneyAdminEdit
    //
    jpoker.plugins.tourneyAdminEdit = function(url, tourney, options) {

        var tourneyAdminEdit = jpoker.plugins.tourneyAdminEdit;
        var opts = $.extend({}, tourneyAdminEdit.defaults, options);

        return this.each(function() {
                var $this = $(this);

                $this.html(tourneyAdminEdit.getHTML(tourney, opts));
                tourneyAdminEdit.decorate(url, $this, tourney, opts);
                return this;
            });
    };

    jpoker.plugins.tourneyAdminEdit.update = function(url, element, tourney, options) {
        var setters = [];
        var inputs = $('.jpoker_admin_tourney_params input[type=text]', element).not('input[readonly]');
        for(var i = 0; i < inputs.length; i++) {
            var name = $.attr(inputs[i], 'name');
            var value = $.attr(inputs[i], 'value');
            if(name == 'start_time' || name == 'register_time') {
                value = Date.parseDate(value, options.dateFormat).valueOf() / 1000;
            }
            if(tourney[name] != value) {
                setters.push(name + ' = \'' + value.toString() + '\'');
                tourney[name] = value;
            }
        }
	if ($('.jpoker_admin_sit_n_go input[type=radio]')[0].checked) {
	    tourney['sit_n_go'] = 'y';
	} else if ($('.jpoker_admin_sit_n_go input[type=radio]')[1].checked) {
	    tourney['sit_n_go'] = 'n';
	}
        $('.jpoker_admin_tourney_params select', element).each(function() {
                var name = $(this).attr('name');
                var value = $('option:selected', this).val();
                if(tourney[name] != value) {
                    setters.push(name + ' = \'' + value.toString() + '\'');
                    tourney[name] = value;
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
            options.callback.updated(tourney);
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
    };

    jpoker.plugins.tourneyAdminEdit.decorate = function(url, element, tourney, options) {

        var tourneyAdminEdit = jpoker.plugins.tourneyAdminEdit;

        element.unbind('keypress').keypress(function(event) {
                if(event.which == 13) {
                    tourneyAdminEdit.update(url, element, tourney, options);
                }
            });
	$('.jpoker_admin_update button').click(function() {
		tourneyAdminEdit.update(url, element, tourney, options);
	    });
        $('.jpoker_admin_tourney_params select', element).each(function() {
                var name = $(this).attr('name');
                $(this).val(tourney[name]);
            }); 
	if (tourney.sit_n_go == 'y') {
	    $('.jpoker_admin_sit_n_go input[type=radio]')[0].checked = true;
	} else {
	    $('.jpoker_admin_sit_n_go input[type=radio]')[1].checked = true;
	}
        $('input[name=start_time],input[name=register_time]', element).dynDateTime({
                showsTime: true,
                    ifFormat: options.dateFormat,
                    align: "TL",
                    electric: false,
                    singleClick: false,
                    button: ".next()" //next sibling
                    });

    };

    jpoker.plugins.tourneyAdminEdit.getHTML = function(tourney, options) {
        tourney.start_time_string = new Date(tourney.start_time*1000).print(options.dateFormat);
        tourney.register_time_string = new Date(tourney.register_time*1000).print(options.dateFormat);
        var html = options.templates.layout.supplant(options.templates);
        return html.supplant(tourney);
    };

    jpoker.plugins.tourneyAdminEdit.defaults = $.extend({
            dateFormat: '%Y/%m/%d-%H:%M',
            path: '/cgi-bin/poker-network/pokersql',
            templates: {
                layout: '<form action=\'javascript://\'><div class=\'jpoker_admin_tourney_params\'>{sit_n_go}{start_time}{register_time}{resthost_serial}{name}{description_short}{description_long}{players_min}{players_quota}{seats_per_game}{variant}{betting_structure}{player_timeout}{currency_serial}{currency_serial_from_date_format}{buy_in}{rake}{prize_min}{bailor_serial}{breaks_first}{breaks_interval}{breaks_duration}{respawn}{active}{serial}</div>{update}</form>',
		serial: '<div class=\'jpoker_admin_serial\'><label>Serial<input name=\'serial\' title=\'Serial of the tournament.\' value=\'{serial}\' readonly=\'true\'  maxlength=\'5\' size=\'5\' /></label></div>',
		resthost_serial: '<div class=\'jpoker_admin_resthost_serial\'><label>Rest host serial<input name=\'resthost_serial\' title=\'Serial of the server.\' value=\'{resthost_serial}\' /></label></div>',
                variant: '<div class=\'jpoker_admin_variant\'><label>Variant<select name=\'variant\'><option value=\'holdem\'>Holdem</option><option value=\'omaha\'>Omaha</option><option value=\'omaha8\'>Omaha High/Low</option></select></label></div>',
                betting_structure: '<div class=\'jpoker_admin_betting_structure\'><label>Betting structure<select name=\'betting_structure\'><option value=\'level-001\'>No limit tournament</option><option value=\'level-10-15-pot-limit\'>Pot limit 10/15</option><option value=\'level-10-20-no-limit\'>No limit 10/20</option><option value=\'level-15-30-no-limit\'>No limit 15/30</option><option value=\'level-2-4-limit\'>Limit 2/4</option></select></label></div>',
                start_time: '<div class=\'jpoker_admin_start_time\'><label>Start time<input type=\'text\' size=\'14\' value=\'{start_time_string}\' name=\'start_time\' title=\'Time and date of the tournament start.\' /><button type=\'button\'>pick</button></label></div>',
                register_time: '<div class=\'jpoker_admin_register_time\'><label>Register time<input type=\'text\' size=\'14\' value=\'{register_time_string}\' name=\'register_time\' title=\'Time and date of the registration.\' /><button type=\'button\'>pick</button></label></div>',
                description_short: '<div class=\'jpoker_admin_description_short\'><label>Description short<input name=\'description_short\' title=\'Short description of the tournament. It will be displayed on each line of the tournament list.\' value=\'{description_short}\' maxlength=\'20\' size=\'20\' /></label></div>',
                description_long: '<div class=\'jpoker_admin_description_long\'><label>Description long<textarea name=\'description_long\' title=\'Description that will be shown on a detailed page about the tournament.\' value=\'{description_long}\' /></label></div>',
		players_quota: '<div class=\'jpoker_admin_players_quota\'><label>Player quota<input name=\'players_quota\' title=\'The maximum number of players allowed to register in the tournament\' value=\'{players_quota}\' maxlength=\'4\' size=\'4\' /></label></div>',
		players_min: '<div class=\'jpoker_admin_players_min\'><label>Player min<input name=\'players_min\' title=\'The minimum number of players to start the tournament. If the number of registered players in the tournament is less than this limit, the tournament is canceled\' value=\'{players_min}\' maxlength=\'4\' size=\'4\' /></label></div>',
		buy_in: '<div class=\'jpoker_admin_buy_in\'><label>Buy in<input name=\'buy_in\' title=\'Tournament buyin in cent.\' value=\'{buy_in}\' maxlength=\'5\' size=\'5\' /></label></div>',
		rake: '<div class=\'jpoker_admin_rake\'><label>Rake<input name=\'rake\' title=\'Tournament rake in cent.\' value=\'{rake}\' maxlength=\'5\' size=\'5\' /></label></div>',
		prize_min: '<div class=\'jpoker_admin_prize_min\'><label>Prize min<input name=\'prize_min\' title=\'Minimum prize pool in cents.\' value=\'{prize_min}\' maxlength=\'5\' size=\'5\' /></label></div>',
		bailor_serial: '<div class=\'jpoker_admin_bailor_serial\'><label>Bailor serial<input name=\'bailor_serial\' title=\'Serial number of the player (serial field of the users table)  who guarantees the minimum prize set in the prize_min field if the total buyin payed by the players is not enough.\' value=\'{bailor_serial}\' maxlength=\'4\' size=\'4\' /></label></div>',
		breaks_first: '<div class=\'jpoker_admin_breaks_first\'><label>Breaks first<input name=\'breaks_first\' title=\'Number of seconds for the first breaks.\' value=\'{breaks_first}\' maxlength=\'5\' size=\'5\' /></label></div>',
		breaks_interval: '<div class=\'jpoker_admin_breaks_interval\'><label>Breaks interval<input name=\'breaks_interval\' title=\'Number of seconds between breaks after the first break.\' value=\'{breaks_interval}\' maxlength=\'5\' size=\'5\' /></label></div>',
		breaks_duration: '<div class=\'jpoker_admin_breaks_duration\'><label>Breaks duration<input name=\'breaks_duration\' title=\'Number of seconds of each break.\' value=\'{breaks_duration}\' maxlength=\'5\' size=\'5\' /></label></div>',
		name: '<div class=\'jpoker_admin_name\'><label>Name<input name=\'name\' title=\'Tourney name\' value=\'{name}\' maxlength=\'10\' size=\'10\' /></label></div>',
		currency_serial: '<div class=\'jpoker_admin_currency_serial\'><label>Currency serial<input name=\'currency_serial\' title=\'Serial of the currency required to pay the buyin.\' value=\'{currency_serial}\' /></label></div>',
		currency_serial_from_date_format: '<div class=\'jpoker_admin_currency_serial_from_date_format\'><label>Currency serial from date format<input name=\'currency_serial_from_date_format\' title=\'Format string to override currency serial from date.\' value=\'{currency_serial_from_date_format}\' maxlength=\'8\' size=\'8\' readonly=\'true\' /></label></div>',
		player_timeout: '<div class=\'jpoker_admin_player_timeout\'><label>Player timeout<input name=\'player_timeout\' title=\'Maximum number of seconds before a player times out when in position.\' value=\'{player_timeout}\' maxlength=\'4\' size=\'4\' /></label></div>',
		seats_per_game: '<div class=\'jpoker_admin_seats_per_game\'><label>Seats per game<input name=\'seats_per_game\' title=\'Number of seats, in the range 2 and 10 included.\' value=\'{seats_per_game}\' maxlength=\'2\' size=\'2\' /></label></div>',
		sit_n_go: '<div class=\'jpoker_admin_sit_n_go\'><label><input name=\'sit_n_go\' title=\'Tourney type\' value=\'y\' type=\'radio\' />Sit and go</label><label><input name=\'sit_n_go\' title=\'Tourney type\' value=\'n\' type=\'radio\' />Regular</label></div>',
		active: '<div class=\'jpoker_admin_active\'><label>Active<input name=\'active\' title=\'Control if the tournament is considered by the server.\' value=\'{active}\'></label></div>',
		respawn: '<div class=\'jpoker_admin_respawn\'><label>Respawn<input name=\'respawn\' title=\'Control if the tournament restarts when complete.\' value=\'{respawn}\'></label></div>',
		update: '<div class=\'jpoker_admin_update\'><button>Update tourney</button></div>'
            },
            callback: {
                display_done: function(element) {
                },
                updated: function(tourney) {
                }
            },
            ajax: function(o) { return jQuery.ajax(o); }
        }, jpoker.defaults);

    //
    // tourneyAdminList
    //
    jpoker.plugins.tourneyAdminList = function(url, options) {

        var tourneyAdminList = jpoker.plugins.tourneyAdminList;
        var opts = $.extend(true, {}, tourneyAdminList.defaults, options);
        url = url + opts.path;

        return this.each(function() {
                var $this = $(this);

                var id = jpoker.uid();
		
                $this.append('<div class=\'jpoker_widget\' id=\'' + id + '\'></table>');
		
		tourneyAdminList.refresh(url, id, opts);
		
                return this;
            });
    };

    jpoker.plugins.tourneyAdminList.refresh = function(url, id, opts) {
	var tourneyAdminList = jpoker.plugins.tourneyAdminList;

	var error = function(xhr, status, error) {
	    throw error;
	};
	
	var success = function(tourneys, status) {
	    var element = document.getElementById(id);
	    if(element) {
		$(element).html(tourneyAdminList.getHTML(id, tourneys, opts));
		$('.jpoker_admin_new a').click(function() {			
			tourneyAdminList.tourneyCreate(url, opts, function() {
				jpoker.plugins.tourneyAdminList.refresh(url, id, opts);
			    });
		    });
		for(var i = 0; i < tourneys.length; i++) {
		    (function(){
			var tourney = tourneys[i];
			$('#admin' + tourney.id + ' .jpoker_admin_edit a').click(function() {
				var edit_options = $.extend(true, {}, opts.tourneyEditOptions);
				edit_options.callback.updated = function(tourney) {
				    jpoker.plugins.tourneyAdminList.refresh(url, id, opts);
				};
				opts.tourneyEdit(url, tourney, edit_options);
			    });
			$('#admin' + tourney.id + ' .jpoker_admin_delete a').click(function() {
				tourneyAdminList.tourneyDelete(url, tourney.id, opts, function() {
					jpoker.plugins.tourneyAdminList.refresh(url, id, opts);
				    });
			    });
			$('#admin' + tourney.id).hover(function(){
				$(this).addClass('hover');
			    },function(){
				$(this).removeClass('hover');
			    });
		    })();
		}
		if(tourneys.length > 0) {
		    var t = opts.templates;
		    var params = {
			container: $('.pager', element),
			positionFixed: false,
			previous_label: t.previous_label.supplant({previous_label: "Previous page"}),
			next_label: t.next_label.supplant({next_label: "Next page"})};
		    $('table', element).tablesorter({widgets: ['zebra'], sortList: opts.sortList}).tablesorterPager(params);
		}
		opts.callback.display_done(element, url, id, opts);
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
    };

    jpoker.plugins.tourneyAdminList.getHTML = function(id, tourneys, options) {
        var t = options.templates;
        var html = [];
        html.push(t.header.supplant({
		    'serial': 'Serial',
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
	    tourney.start_time_string = new Date(tourney.start_time*1000).print(options.dateFormat);
	    tourney.register_time_string = new Date(tourney.register_time*1000).print(options.dateFormat);
            html.push(t.rows.supplant(tourney).replace(/{oddEven}/g, i%2 ? 'odd' : 'even'));
        }
        html.push(t.footer);
        html.push(t.pager);
        return html.join('\n');
    };

    jpoker.plugins.tourneyAdminList.tourneyCreate = function(url, options, callback) {
        var params = {
            'query': 'INSERT INTO tourneys_schedule SET active = \'n\''
        };

        var error = function(xhr, status, error) {
            throw error;
        };

        var success = function(rowcount, status) {
            if(rowcount != 1) {
                throw 'expected ' + params.query + ' to modify exactly one row but it modified ' + rowcount.toString() + ' rows instead';
            }
	    callback();
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
    };

    jpoker.plugins.tourneyAdminList.tourneyDelete = function(url, tourney_serial, options, callback) {
        var params = {
            'query': 'DELETE FROM tourneys_schedule WHERE serial = \''+tourney_serial+'\''
        };

        var error = function(xhr, status, error) {
            throw error;
        };

        var success = function(rowcount, status) {
            if(rowcount != 1) {
                throw 'expected ' + params.query + ' to modify exactly one row but it modified ' + rowcount.toString() + ' rows instead';
            }
	    callback();
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
    };
    
    jpoker.plugins.tourneyAdminList.defaults = $.extend({
            sortList: [[0, 0]],
            dateFormat: '%Y/%m/%d-%H:%M',
            path: '/cgi-bin/poker-network/pokersql',
            string: '',
            templates: {
                header : '<table><thead><tr><th>{serial}</th><th>{description_short}</th><th>{variant}</th><th>{players_quota}</th><th>{buy_in}</th><th class=\'jpoker_admin_edit_header\'></th><th class=\'jpoker_admin_new\'><a href=\'javascript://\'>New</a></th></tr></thead><tbody>',
                rows : '<tr id=\'admin{id}\' title=\'Click to edit\'><td>{serial}</td><td>{description_short}</td><td>{variant}</td><td>{players_quota}</td><td>{buy_in}</td><td class=\'jpoker_admin_edit\'><a href=\'javascript://\'>Edit</a></td><td class=\'jpoker_admin_delete\'><a href=\'javascript://\'>Delete</a></td></tr>',
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
            tourneyEditOptions: $.extend({}, jpoker.plugins.tourneyAdminEdit.defaults),
            tourneyEdit: jpoker.tourneyAdminEdit,
            ajax: function(o) { return jQuery.ajax(o); }
        }, jpoker.defaults);

})(jQuery);
