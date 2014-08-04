/*
 *   Jquery Exposé plugin
 *   Shrinks the contents of selected element to fit window width.
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
        var element = this;
        $(document).keyup(function(e) {
            if (e.keyCode == 27) {$('#exposeOff').click()}   // esc
        });

        $('#exposeTrue').click(function(){
            ctrl.canReformat = false;
            ctrl.exposeOn = true;
            $('#ht-wrapper').scrollTo($('#ht-wrapper'), 0,  {offset:-1*$('#ht-content').width()});
            $('#exposeTrue').hide();
            $('#exposeFalse').show();

            $('#exLeftNav').show();
            $('#exRightNav').show();

            $('#exposebtns').fadeIn();

            $('#ht-head').slideUp(200);


            $('#exRightNav').css('opacity', 1-$('#ht-wrapper').scrollLeft()/$('#ht-content').width());
            $('#exLeftNav').css('opacity', $('#ht-wrapper').scrollLeft()/$('#ht-content').width());
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
                var o = settings.mMod.modules()[i];
                var contentWidth = $('#ht-content').width();  // width of the module
                var headWidth = $('#ht-head').width();
                var modwidth = $('.ht-tab[data-id="'+o.id+'"]').width() +2; //  +2 compensates for border
                var width = (modwidth-40)/(modlens+80);
                var adjwidth = width*headfinal;

                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').hide();
                $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width', modwidth);
                if(adjwidth < 300){
                    newmodlens += 300;
                    $('.ht-tab[data-id="'+o.id+'"]').animate( { width : '300px', height : adjheight +'px' }, 200);
                }else{
                    newmodlens += adjwidth;
                    $('.ht-tab[data-id="'+o.id+'"]').animate( { width : adjwidth+'px', height : adjheight +'px' }, 200);
                }
                $( "#ht-content" ).sortable("enable");
            }
            $('#ht-content').css('width', newmodlens +'px');
            $('#ht-content').animate({'padding': adjpadding + 'px', 'padding-left': adjpadding/2 + 'px'});
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



            for(var i = 0; i < settings.mMod.modules().length; i++){
                var o = settings.mMod.modules()[i];
                var width = $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width');
                $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width},200);
                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').show();
                $("#ht-content").sortable("disable");

                setTimeout(function(){
                    ctrl.reformat();
                    ctrl.resizecontent();
                }, 200);

            }
            $('#ht-content').animate({'padding': '20px'});
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

            // get size of all mods
            $.each(settings.mMod.modules(), function(i, module) {
                modlens += module.width + 40;
            });

            for(var i = 0; i < settings.mMod.modules().length; i++){
                var o = settings.mMod.modules()[i];
                var contentWidth = $('#ht-content').width();  // width of the module
                var headWidth = $('#ht-head').width();
                var modwidth = $('.ht-tab[data-id="'+o.id+'"]').width() +2; //  +2 compensates for border
                var width = (modwidth)/(modlens);
                var adjwidth = width*(headfinal-(40*modules.length)-adjpadding/2);

                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').hide();
                $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width', modwidth);
                $('.ht-tab[data-id="'+o.id+'"]').animate( { width : adjwidth+'px', height : adjheight +'px' }, 200);
                $( "#ht-content" ).sortable("enable");
            }
            $('#ht-content').animate({'padding': adjpadding + 'px', 'padding-left': adjpadding/2 + 'px'});
        });

        // re expand the state
        $('#exposeOff').click(function(){
            canReformat = true;
            $('#exposeOn').show();
            $('#exposeOff').hide();

            var headfinal = $(window).width(); // final width of the header taking into account the navbar
            var wH = $(window).height();
            var wrapperH = wH-26;
            var tab = wrapperH-60;

            for(var i = 0; i < settings.mMod.modules().length; i++){
                var o = settings.mMod.modules()[i];
                var width = $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width');
                $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width},200);
                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').show();
                $("#ht-content").sortable("disable");
                setTimeout(function(){
                    ctrl.reformat();
                }, 200);
            }
            $('#ht-content').animate({'padding': '20px'});
        });    // let escape key exit expanded state

        $(function() {
            $("#ht-content").sortable({
                placeholder: "ghost-element ht-tab ui-state-default"
            });

            $("#ht-content").sortable( "disable" );
            $("#ht-content").disableSelection();
        });

        $('#ht-wrapper').on('scroll', function(){
            $('#exRightNav').css('opacity', 1-$('#ht-wrapper').scrollLeft()/($('#ht-content').width()-$(window).width()));
            $('#exLeftNav').css('opacity', $('#ht-wrapper').scrollLeft()/$('#ht-content').width());
        });




        var completeCall = function(){
        if ( $.isFunction( settings.complete ) ) {
            settings.complete.call( this );
        }
    }


    return this;

    }

}(jQuery));
