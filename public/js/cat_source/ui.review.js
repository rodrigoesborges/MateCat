/*
 Component: ui.review
 */

Review = {
    enabled : function() {
        return config.enableReview && config.isReview ;
    },
    type : config.reviewType
};

if ( Review.enabled() )
(function(Review, $, undefined) {
    var alertNotTranslatedYet = function( sid ) {
        APP.confirm({
            name: 'confirmNotYetTranslated',
            cancelTxt: 'Close',
            callback: 'openNextTranslated',
            okTxt: 'Open next translated segment',
            context: sid,
            msg: "This segment is not translated yet.<br /> Only translated segments can be revised."
        });
    }

    $.extend(Review, {
        evalOpenableSegment : function(section) {
            if ( isTranslated(section) ) return true ;
            var sid = UI.getSegmentId( section );
            alertNotTranslatedYet( sid ) ;
            $(document).trigger('review:unopenableSegment', section);
            return false ;
        },
    });

    $.extend(UI, {
        setRevision: function( data ){
            APP.doRequest({
//                data: reqData,

                data: data,

//                context: [reqArguments, segment, status],
                error: function() {
                    //UI.failedConnection( this[0], 'setRevision' );
                    UI.failedConnection( data, 'setRevision' );
                },
                success: function(d) {
//                    console.log('d: ', d);
                    $('#quality-report').attr('data-vote', d.data.overall_quality_class);
                    // temp
//                    d.stat_quality = config.stat_quality;
//                    d.stat_quality[0].found = 2;
                    //end temp
//                    UI.populateStatQualityPanel(d.stat_quality);
                }
            });
        },

        clenaupTextFromPleaceholders : function(text) {
            text = text
                .replace( config.lfPlaceholderRegex, "\n" )
                .replace( config.crPlaceholderRegex, "\r" )
                .replace( config.crlfPlaceholderRegex, "\r\n" )
                .replace( config.tabPlaceholderRegex, "\t" )
                .replace( config.nbspPlaceholderRegex, String.fromCharCode( parseInt( 0xA0, 10 ) ) );
            return text;
        },

        trackChanges: function (editarea) {
            var source = UI.currentSegment.find('.original-translation').text();
            source = UI.clenaupTextFromPleaceholders( source );

            var target = $(editarea).text().replace(/(<\s*\/*\s*(g|x|bx|ex|bpt|ept|ph|it|mrk)\s*.*?>)/gi,"");
            var diffHTML = trackChangesHTML( source, target );

            $('.editor .sub-editor.review .track-changes p').html( diffHTML );
        },

        setReviewErrorData: function (d) {
            $.each(d, function (index) {
//                console.log(this.type + ' - ' + this.value);
//                console.log('.editor .error-type input[name=t1][value=' + this.value + ']');
                if(this.type == "Typing") $('.editor .error-type input[name=t1][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Translation") $('.editor .error-type input[name=t2][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Terminology") $('.editor .error-type input[name=t3][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Language Quality") $('.editor .error-type input[name=t4][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Style") $('.editor .error-type input[name=t5][value=' + this.value + ']').prop('checked', true);

            });

        },

        /**
         * Search for the next translated segment to propose for revision.
         * This function searches in the current UI first, then falls back
         * to invoke the server and eventually reload the page to the new
         * URL.
         */
        openNextTranslated: function (sid) {
            sid = sid || UI.currentSegmentId;
            var el = $('#segment-' + sid);

            var translatedList = [];
            var approvedList = [];

            var clickableSelector = UI.targetContainerSelector();

            if ( el.nextAll('.status-translated, .status-approved').length ) {

                translatedList = el.nextAll('.status-translated');
                approvedList   = el.nextAll('.status-approved');


                if ( translatedList.length ) {
                    translatedList.first().find( clickableSelector ).click();
                } else {
                    approvedList.first().find( clickableSelector ).click();

                }

            } else {

                file = el.parents('article');
                file.nextAll(':has(section.status-translated), :has(section.status-approved)').each(function () {

                    var translatedList = $(this).find('.status-translated');
                    var approvedList   = $(this).find('.status-approved');

                    if( translatedList.length ) {
                        translatedList.first().find( clickableSelector ).click();
                    } else {
                        UI.reloadWarning();
                    }

                    return false;

                });
                // else
                if($('section.status-translated, section.status-approved').length) { // find from the beginning of the currently loaded segments

                    translatedList = $('section.status-translated');
                    approvedList   = $('section.status-approved');

                    if( translatedList.length ) {
                        if((translatedList.first().is(UI.currentSegment))) {
                            UI.scrollSegment(translatedList.first());
                        } else {
                            translatedList.first().find( clickableSelector ).click();
                        }
                    } else {
                        if((approvedList.first().is(UI.currentSegment))) {
                            UI.scrollSegment(approvedList.first());
                        } else {
                            approvedList.first().find( clickableSelector ).click();
                        }
                    }

                } else { // find in not loaded segments

                    APP.doRequest({
                        data: {
                            action: 'getNextReviseSegment',
                            id_job: config.job_id,
                            password: config.password,
                            id_segment: sid
                        },
                        error: function() {
                        },
                        success: function(d) {
                            if( d.nextId == null ) return false;
                            UI.render({
                                firstLoad: false,
                                segmentToOpen: d.nextId
                            });
                        }
                    });

                }
            }
        }

    });
})(Review, jQuery);

/**
 * Events
 *
 * Only bind events for specific review type
 */

if ( Review.enabled() && Review.type == 'simple' ) {

    UI.SegmentFooter.registerTab({
        code                : 'review',
        tab_class           : 'review',
        label               : 'Revise',
        activation_priority : 60,
        tab_position        : 50,
        is_enabled    : function(segment) {
            return true;
        },
        tab_markup          : function(segment) {
            return this.label ;
        },
        content_markup      : function(segment) {
            return $('#tpl-review-tab').html();
        },
        is_hidden    : function(segment) {
            return false;
        },
    });

    $('html').on('open', 'section', function() {
        if($(this).hasClass('opened')) {
            $(this).find('.tab-switcher-review').click();
        }
    }).on('start', function() {

        // temp
        config.stat_quality = [
            {
                "type":"Typing",
                "allowed":5,
                "found":1,
                "vote":"Excellent"
            },
            {
                "type":"Translation",
                "allowed":5,
                "found":1,
                "vote":"Excellent"
            },
            {
                "type":"Terminology",
                "allowed":5,
                "found":1,
                "vote":"Excellent"
            },
            {
                "type":"Language Quality",
                "allowed":5,
                "found":1,
                "vote":"Excellent"
            },
            {
                "type":"Style",
                "allowed":5,
                "found":1,
                "vote":"Excellent"
            }
        ];
        // end temp
//        $('#statistics .statistics-core').append('<li id="stat-quality">Overall quality: <span class="quality">Fail</span> <a href="#" class="details">(Details)</a></li>');
//        UI.createStatQualityPanel();
//        UI.populateStatQualityPanel(config.stat_quality);
    }).on('buttonsCreation', 'section', function() {
        var div = $('<ul>' + UI.segmentButtons + '</ul>');

        div.find('.translated').text('APPROVED').removeClass('translated').addClass('approved');
        div.find('.next-untranslated').parent().remove();

        UI.segmentButtons = div.html();
    }).on('click', '.editor .tab-switcher-review', function(e) {
        e.preventDefault();

        $('.editor .submenu .active').removeClass('active');
        $(this).addClass('active');
//        console.log($('.editor .sub-editor'));
        $('.editor .sub-editor.open').removeClass('open');
        if($(this).hasClass('untouched')) {
            $(this).removeClass('untouched');
            if(!UI.body.hasClass('hideMatches')) {
                $('.editor .sub-editor.review').addClass('open');
            }
        } else {
            $('.editor .sub-editor.review').addClass('open');
        }
    }).on('input', '.editor .editarea', function() {
        UI.trackChanges(this);
    }).on('afterFormatSelection', '.editor .editarea', function() {
        UI.trackChanges(this);
    }).on('click', '.editor .outersource .copy', function(e) {
        UI.trackChanges(UI.editarea);
    }).on('click', 'a.approved', function(e) {
        // the event click: 'A.APPROVED' i need to specify the tag a and not only the class
        // because of the event is triggered even on download button
        e.preventDefault();
        UI.tempDisablingReadonlyAlert = true;
        UI.hideEditToolbar();
        UI.currentSegment.removeClass('modified');

        var noneSelected = !((UI.currentSegment.find('.sub-editor.review .error-type input[value=1]').is(':checked'))||(UI.currentSegment.find('.sub-editor.review .error-type input[value=2]').is(':checked')));

        //
        if ( ( noneSelected ) && ( $('.editor .track-changes p span').length) ) {

            $('.editor .tab-switcher-review').click();
            $('.sub-editor.review .error-type').addClass('error');

        } else {

            $('.sub-editor.review .error-type').removeClass('error');

            UI.changeStatus(this, 'approved', 0);  // this does < setTranslation

            var original = UI.currentSegment.find('.original-translation').text();
            var sid = UI.currentSegmentId;
            var err = $('.sub-editor.review .error-type');
            var err_typing = $(err).find('input[name=t1]:checked').val();
            var err_translation = $(err).find('input[name=t2]:checked').val();
            var err_terminology = $(err).find('input[name=t3]:checked').val();
            var err_language = $(err).find('input[name=t4]:checked').val();
            var err_style = $(err).find('input[name=t5]:checked').val();

            UI.openNextTranslated();

            var data = {
                action: 'setRevision',
                    job: config.job_id,
                    jpassword: config.password,
                    segment: sid,
                    original: original,
                    err_typing: err_typing,
                    err_translation: err_translation,
                    err_terminology: err_terminology,
                    err_language: err_language,
                    err_style: err_style
            };

            UI.setRevision( data );

        }
    }).on('click', '.sub-editor.review .error-type input[type=radio]', function(e) {
        $('.sub-editor.review .error-type').removeClass('error');
    }).on('setCurrentSegment_success', function(e, d, id_segment) {
        xEditarea = $('#segment-' + id_segment + '-editarea');
        xSegment = $('#segment-' + id_segment);
        if(d.original == '') d.original = xEditarea.text();
        if(!xSegment.find('.original-translation').length) xEditarea.after('<div class="original-translation" style="display: none">' + d.original + '</div>');
        UI.setReviewErrorData(d.error_data);
        UI.trackChanges(xEditarea);
    });

    $.extend(UI, {
        setRevision: function( data ){
            APP.doRequest({
                data: data,
                error: function() {
                    UI.failedConnection( data, 'setRevision' );
                },
                success: function(d) {
                    $('#quality-report').attr('data-vote', d.data.overall_quality_class);
                }
            });
        },
        trackChanges: function (editarea) {
            var diff = UI.dmp.diff_main(UI.currentSegment.find('.original-translation').text()
                    .replace( config.lfPlaceholderRegex, "\n" )
                    .replace( config.crPlaceholderRegex, "\r" )
                    .replace( config.crlfPlaceholderRegex, "\r\n" )
                    .replace( config.tabPlaceholderRegex, "\t" )
                    //.replace( config.tabPlaceholderRegex, String.fromCharCode( parseInt( 0x21e5, 10 ) ) )
                    .replace( config.nbspPlaceholderRegex, String.fromCharCode( parseInt( 0xA0, 10 ) ) ),
                $(editarea).text().replace(/(<\s*\/*\s*(g|x|bx|ex|bpt|ept|ph|it|mrk)\s*.*?>)/gi,""));

            UI.dmp.diff_cleanupSemantic( diff ) ;

            diffTxt = '';
            $.each(diff, function (index) {

                if(this[0] == -1) {
                    var rootElem = $( document.createElement( 'div' ) );
                    var newElem = $.parseHTML( '<span class="deleted"/>' );
                    $( newElem ).text( this[1] );
                    rootElem.append( newElem );
                    diffTxt += $( rootElem ).html();
                } else if(this[0] == 1) {
                    var rootElem = $( document.createElement( 'div' ) );
                    var newElem = $.parseHTML( '<span class="added"/>' );
                    $( newElem ).text( this[1] );
                    rootElem.append( newElem );
                    diffTxt += $( rootElem ).html();
                } else {
                    diffTxt += this[1];
                }
                $('.editor .sub-editor.review .track-changes p').html(diffTxt);
            });
        },

        setReviewErrorData: function (d) {
            $.each(d, function (index) {
                if(this.type == "Typing") $('.editor .error-type input[name=t1][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Translation") $('.editor .error-type input[name=t2][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Terminology") $('.editor .error-type input[name=t3][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Language Quality") $('.editor .error-type input[name=t4][value=' + this.value + ']').prop('checked', true);
                if(this.type == "Style") $('.editor .error-type input[name=t5][value=' + this.value + ']').prop('checked', true);

            });

        },

        renderAfterConfirm: function (nextId) {
            this.render({
                firstLoad: false,
                segmentToOpen: nextId
            });
        },

        openNextTranslated: function (sid) {
            console.log('openNextTranslated');
            sid = sid || UI.currentSegmentId;
            el = $('#segment-' + sid);

            var translatedList = [];
            var approvedList = [];

            if(el.nextAll('.status-translated').length) { // find in next segments in the current file
                translatedList = el.nextAll('.status-translated');
                if( translatedList.length ) {
                    translatedList.first().find('.editarea').click();
                }

            } else {
                file = el.parents('article');
                file.nextAll(':has(section.status-translated)').each(function () { // find in next segments in the next files

                    var translatedList = $(this).find('.status-translated');

                    if( translatedList.length ) {
                        translatedList.first().find('.editarea').click();
                    } else {
                        UI.reloadWarning();
                    }

                    return false;

                });
                // else
                if($('section.status-translated').length) { // find from the beginning of the currently loaded segments
                    translatedList = $('section.status-translated');

                    if( translatedList.length ) {
                        if((translatedList.first().is(UI.currentSegment))) {
                            UI.scrollSegment(translatedList.first());
                        } else {
                            translatedList.first().find('.editarea').click();
                        }
                    }

                } else { // find in not loaded segments

                    APP.doRequest({
                        data: {
                            action: 'getNextReviseSegment',
                            id_job: config.job_id,
                            password: config.password,
                            id_segment: sid
                        },
                        error: function() {
                        },
                        success: function(d) {
                            if( d.nextId == null ) return false;
                            if($(".modal[data-type='confirm']").length) {
                                $(window).on('statusChanged', function(e) {
                                    UI.renderAfterConfirm(d.nextId);
                                });
                            } else {
                                UI.renderAfterConfirm(d.nextId);
                            }

                        }
                    });
                }
            }
        }
    });
}
