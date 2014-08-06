/*
 *   Jquery Scroller plugin by Alex Schiller
 *   Provides handles for scrolling.
 */
(function($) {
    $.fn.scroller = function(options) {

        // Default options
        var settings = $.extend({
            scrollWrapper : "#ht-wrapper", // The div that will be scrolled.
            complete : null
        }, options);

        var el = this; // The element scroller was called on. housing the scroller itself.
        var wrap = $(settings.scrollWrapper);
        // Scroller
        var htOnScroll = function() {
            el.css('left', wrap.scrollLeft()*$('#ht-head').width()/$('#ht-content').width() + 'px');
        };
        wrap.on('scroll', htOnScroll );

        el.draggable({ axis: "x", containment: 'window' });

        el.mousedown(
            function(){wrap.off('scroll' );}
        );

        $(document).mouseup(
            function(){wrap.on('scroll', htOnScroll);}
        );

        el.on('drag', function(){
            wrap.scrollTo(el.offset().left*$('#ht-content').width()/$('#ht-head').width(),0);
        });

        $('#exLeftNav').click(function(){
            wrap.scrollTo(wrap, 200,  {offset:-500});
        });

        $('#exRightNav').click(function(){
            wrap.scrollTo(wrap, 200,  {offset:500});
        });


        // Run the complete function if there is one
        if ( $.isFunction( settings.complete ) ) {
            settings.complete.call( this );
        }

        // Return the element so jquery can chain it
        return this;

    }

}(jQuery));
