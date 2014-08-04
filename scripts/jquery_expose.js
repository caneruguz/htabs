/*
 *   Jquery Exposé plugin by Alex Schiller
 *   Shrinks the contents of selected element to fit window width in the Mac expose style.
 */
(function($) {
    $.fn.expose = function(options) {

        // Default options
        var settings = $.extend({
            min : 300,
            mithril : null,  // mithril module name to tie to controller variables
            complete : null
        }, options);

        var ctrl = settings.mithril;
        var el = this;   // The element we run the plugin on.

        $(document).keyup(function(e) {
            if (e.keyCode == 27) {$('#exposeOff').click(), $('#exposeFalse').click()}   // esc
        });

        $('#exposeTrue').click(function(){
            ctrl.canReformat = false;
            ctrl.exposeOn = true;
            el.scrollTo(el, 0,  {offset:-1*$('#ht-content').width()});
            $('#exposeTrue').hide();
            $('#exposeFalse').show();

            $('#exLeftNav').show();
            $('#exRightNav').show();

            $('#exposebtns').fadeIn();

            $('#ht-head').slideUp(200);


            $('#exRightNav').css('opacity', 1-el.scrollLeft()/$('#ht-content').width());
            $('#exLeftNav').css('opacity', el.scrollLeft()/$('#ht-content').width());
            $('#ht-content').switchClass("", "dim-background", 200, "easeInOutQuad" );


            var headfinal = $(window).width();
            var wH = $(window).height();
            var wrapperH = wH-40;
            var tab = wrapperH-80;
            var adjheight = tab/2;
            var adjpadding = tab/4;
            var adjbtn = tab*0.25;
            var modlens = 0; // full length of mods
            var modsmin = settings.min;
            var newmodlens = 900; // start with a bit of extra room just in case
            // get size of all mods
            $('#exposebtns').css('bottom', adjbtn + 'px');
            $.each(ctrl.modules(), function(i, module) {
                modlens += module.width + 40;
            });

            // resize all content

            for(var i = 0; i < ctrl.modules().length; i++){
                var o = ctrl.modules()[i];
                var contentWidth = $('#ht-content').width();  // width of the module
                var headWidth = $('#ht-head').width();
                var modwidth = $('.ht-tab[data-id="'+o.id+'"]').width() +2; //  +2 compensates for border
                var width = (modwidth-40)/(modlens+80);
                var adjwidth = width*headfinal;

                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').hide();
                $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width', modwidth);
                if(adjwidth < 300){
                    newmodlens += 300;
                    $('.ht-tab[data-id="'+o.id+'"]').animate( { width : '300px', height : adjheight +'px' }, { duration : 200, queue : false } );
                }else{
                    newmodlens += adjwidth;
                    $('.ht-tab[data-id="'+o.id+'"]').animate( { width : adjwidth+'px', height : adjheight +'px' }, { duration : 200, queue : false } );
                }
                $( "#ht-content" ).sortable("enable");
            }
            $('#ht-content').css('width', newmodlens +'px');
            $('#ht-content').animate({'padding': adjpadding + 'px', 'padding-left': adjpadding/2 + 'px'}, { duration : 200, queue : false } );
            $('.ht-tab').removeClass('ht-light-shadow').addClass('ht-dark-shadow');
        });

        $('#exposeFalse').click(function(){
            ctrl.canReformat = true;
            ctrl.exposeOn = false;
            $('#exposeTrue').show();
            $('#exposeFalse').hide();
            $('#ht-content').switchClass("dim-background", "", 200, "easeInOutQuad" );
            $('#ht-head').slideDown(200);
            $('#exposebtns').fadeOut();

            var headfinal = $(window).width(); // final width of the header taking into account the navbar
            var wH = $(window).height();
            var wrapperH = wH-26;
            var tab = wrapperH-60;



            for(var i = 0; i < ctrl.modules().length; i++){
                var o = ctrl.modules()[i];
                var width = $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width');
                $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width},{ duration : 200, queue : false } );
                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').show();
                $("#ht-content").sortable("disable");

                setTimeout(function(){
                    ctrl.reformat();
                    ctrl.resizeContent();
                }, 200);

            }
            $('#ht-content').animate({'padding': '20px'},{ duration : 200, queue : false } );
            $('.ht-tab').removeClass('ht-dark-shadow').addClass('ht-light-shadow');
            ctrl.resizeWidgets();
            ctrl.reformat();

        });


        // shrink the state to show all mods
        $('#exposeOn').click(function(){
            ctrl.canReformat = false;
            $('#exposeOn').hide();
            $('#exposeOff').show();
            var headfinal = $(window).width();
            var wH = $(window).height();
            var wrapperH = wH-40;
            var tab = wrapperH-80;
            var adjheight = tab/2;
            var adjpadding = tab/4;
            $(".ghost-element").css('height', adjheight);
            var modlens = 0; // full length of mods

            $('#ht-content').switchClass("", "dim-background", 200, "easeInOutQuad" );

            // get size of all mods
            $('.ht-tab').each(function(i, item) {
                console.log("module.width", $(item).width());
                modlens += $(item).width() + 40;
            });

            for(var i = 0; i < ctrl.modules().length; i++){
                var o = ctrl.modules()[i];
                var contentWidth = $('#ht-content').width();  // width of the module
                var headWidth = $('#ht-head').width();
                var modwidth = $('.ht-tab[data-id="'+o.id+'"]').width() +2; //  +2 compensates for border
                var width = (modwidth)/(modlens);
                console.log("Width", width, "modwith", modwidth, "modlens", modlens);
                var adjwidth = width*(headfinal-(40*ctrl.modules().length)-adjpadding/2);
                console.log("adjwidth", adjwidth, "id", o.id);

                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').hide();
                $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width', modwidth);
                $('.ht-tab[data-id="'+o.id+'"]').animate( { minWidth : 0, width : adjwidth+'px', height : adjheight +'px' }, { duration : 200, queue : false } );
                $( "#ht-content" ).sortable("enable");
            }
            $('#ht-content').animate({'padding': adjpadding + 'px', 'padding-left': adjpadding/2 + 'px'}, { duration : 200, queue : false } );
            $('.ht-tab').removeClass('ht-light-shadow').addClass('ht-dark-shadow');

        });

        // re expand the state
        $('#exposeOff').click(function(){
            ctrl.canReformat = true;
            $('#exposeOn').show();
            $('#exposeOff').hide();

            var headfinal = $(window).width(); // final width of the header taking into account the navbar
            var wH = $(window).height();
            var wrapperH = wH-26;
            var tab = wrapperH-60;
            $('#ht-content').switchClass("dim-background", "", 200, "easeInOutQuad" );

            for(var i = 0; i < ctrl.modules().length; i++){
                var o = ctrl.modules()[i];
                var width = $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width');
                $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width},{ duration : 200, queue : false } );
                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').show();
                $("#ht-content").sortable("disable");
                setTimeout(function(){
                    ctrl.reformat();
                }, 200);
            }
            $('#ht-content').animate({'padding': '20px'},{ duration : 200, queue : false } );
            $('.ht-tab').removeClass('ht-dark-shadow').addClass('ht-light-shadow');
            ctrl.resizeWidgets();
            ctrl.reformat();

        });    // let escape key exit expanded state

        $(function() {
            $("#ht-content").sortable({
                placeholder: "ghost-element ht-tab ui-state-default"
            });

            $("#ht-content").sortable( "disable" );
            $("#ht-content").disableSelection();
        });

        el.on('scroll', function(){
            $('#exRightNav').css('opacity', 1-el.scrollLeft()/($('#ht-content').width()-$(window).width()));
            $('#exLeftNav').css('opacity', el.scrollLeft()/$('#ht-content').width());
        });

        // Run the complete function if there is one
        if ( $.isFunction( settings.complete ) ) {
            settings.complete.call( this );
        }

    // Return the element so jquery can chain it
    return this;

    }

}(jQuery));
