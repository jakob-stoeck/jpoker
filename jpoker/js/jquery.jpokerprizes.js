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

    jpoker.tourneyAdminEditPrizes = function(url, tourney, options) {
        var dialog = jpoker.tourneyAdminEdit(url, tourney, options);
        dialog.prepend('<div id=\'jpokerAdminEditPrize\' />');
        jpoker.plugins.tourneyAdminEditPrizes.getPrizes(url, options);
        $('#jpokerAdminEditPrize').jpoker('tourneyAdminEditPrizes', url, tourney, options);
    };

    //
    // tourneyAdminEditPrizes
    //
    jpoker.plugins.tourneyAdminEditPrizes = function(url, tourney, options) {

        var tourneyAdminEditPrizes = jpoker.plugins.tourneyAdminEditPrizes;
        var opts = $.extend({}, tourneyAdminEditPrizes.defaults, options);

        return this.each(function() {
                var $this = $(this);

                var error = function(xhr, status, error) {
                    throw error;
                };
                var success = function(prize_serials, status) {
                    var prize_serial;
                    if(prizes_serials.length > 0) {
                        prize_serial = prize_serials[0];
                    } else {
                        prize_serial = undefined;
                    }
                    tourneyAdminEditPrizes.populate($this, tourney, serial_prize, opts);
                };
                var params = {
                    'query': 'SELECT p.serial FROM prizes AS p,tourneys_schedule2prizes AS t WHERE p.serial = t.prizes_serial AND t.tourneys_schedule_serial = %d' % tourney.serial,
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

    jpoker.plugins.tourneyAdminEditPrizes.serial2prize = {};

    jpoker.plugins.tourneyAdminEditPrizes.getPrizes = function(url, options) {
        var error = function(xhr, status, error) {
            throw error;
        };
        var success = function(prizes, status) {
            serial2prize = {}
            for(var i = 0; i < prizes.length; i++) {
                serial2prize[prizes[i].serial] = prizes[i]
            }
            jpoker.plugins.tourneyAdminEditPrizes.serial2prize = serial2prize
        };
        var params = {
            'query': 'SELECT * FROM prizes'
            'output': 'rows'
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
    };

    jpoker.plugins.tourneyAdminEditPrizes.populate = function(element, tourney, prize_serial, options) {
        var options = [];
        var serial2prize = jpoker.plugins.tourneyAdminEditPrizes;
        for(serial in serial2prize) {
            if(prize_serial == undefined) {
                prize_serial = serial;
            }
            options.append(options.templates.option.supplant(serial2prize[serial]));
        }
        var selector = options.templates.selector.supplant({ options: options.join('') }); 
        element.html(options.templates.layout.supplant({ selector: selector }));
        $('select[name=serial]', element).val(prize_serial).change(function() {
                jpoker.plugins.tourneyAdminEditPrizes.update(element, tourney, prize_serial, this.val(), options);
            });
        jpoker.plugins.tourneyAdminEditPrizes.update(element, tourney, prize_serial, prize_serial, options);
    };

    jpoker.plugins.tourneyAdminEditPrizes.update = function(element, tourney, old_prize_serial, new_prize_serial, options) {
        var html = options.templates.prize.supplant(options.templates);
        var serial2prize = jpoker.plugins.tourneyAdminEditPrizes;
        $('.jpoker_prize', element).html(html.supplant(serial2prize[new_prize_serial]));
        
        if(old_prize_serial != new_prize_serial) {
            $('select[name=serial]', element).val(new_prize_serial);
            var params = {
                'query': 'UPDATE tourneys_schedule2prizes SET prize_serial = ' + new_prize_serial.toString() + ' WHERE tourneys_schedule_serial = ' + tourney.serial.toString()
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
        }
    };

    jpoker.plugins.tourneyAdminEditPrizes.defaults = $.extend({
            templates: {
                layout: '{selector}<div class=\'jpoker_prize\'>prize descriptions</div>',
                selector: '<select name=\'serial\'>{options}</select></div>',
                option: '<option value=\'{serial}\'>{name}</option>',
                prize: '{name}{description}{image}{points}',
                image: '<a href=\'{link_url}\'><img src=\'{image_url}\' /></a>'
            },
            callback: {
                display_done: function(element) {
                },
                updated: function(tourney) {
                }
            },
            ajax: function(o) { return jQuery.ajax(o); }
        }, jpoker.defaults);

})(jQuery);
