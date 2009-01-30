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
            dialog.dialog({ width: '500px', height: '500px', autoOpen: false, dialog: true, title: 'edit tournament'});
        }
        dialog.jpoker('tourneyAdminEdit', url, tourney, options);
        dialog.dialog('open');
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
        var inputs = $('.jpoker_admin_tourney_params input', element);
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
	$(".jpoker_admin_update button").click(function() {
		tourneyAdminEdit.update(url, element, tourney, options);
	    });
        $('.jpoker_admin_tourney_params select', element).each(function() {
                var name = $(this).attr('name');
                $(this).val(tourney[name]);
            }); 
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
        var html = options.templates.layout.supplant(options.templates);
        return html.supplant(tourney);
    };

    jpoker.plugins.tourneyAdminEdit.defaults = $.extend({
            dateFormat: '%Y/%m/%d-%H:%M',
            path: '/cgi-bin/poker-network/pokersql',
            templates: {
                layout: '<div class=\'jpoker_admin_tourney_params\'>{serial}{reshost_serial}{name}{description_short}{description_long}{players_quota}{players_min}{variant}{betting_structure}{seats_per_game}{player_timeout}{currency_serial}{prizes_min}{bailor_serial}{buy_in}{rake}{sit_n_go}{breaks_first}{breaks_interval}{breaks_duration}{start_time}{register_time}{active}{respawn}</div>{update}',
                variant: '<div class=\'jpoker_admin_variant\'><select name=\'variant\'><option value=\'holdem\'>Holdem</option><option value=\'omaha\'>Omaha</option><option value=\'omaha8\'>Omaha High/Low</option></select></div>',
                betting_structure: '<div class=\'jpoker_admin_betting_structure\'><select name=\'betting_structure\'><option value=\'level-001\'>10 minutes</option></select></div>',
                start_time: '<div class=\'jpoker_admin_start_time\'><input type=\'text\' size=\'14\' value=\'{start_time_string}\' name=\'start_time\'/><button type=\'button\'>pick</button></div>',
                description_short: '<div class=\'jpoker_admin_description_short\'><input name=\'description_short\' title=\'Short description of the tournament. It will be displayed on each line of the tournament list.\' value=\'{description_short}\' /></div>',
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
