/*
 *   Jquery Rescon : responsive containers
 *   Provides responsiveness to Bootstrap grid elements by applying media sizing when these elements are within responsive containers.
 */
(function($) {
    $.fn.scroller = function(options) {
        var self = this;
        // Default options
        var settings = $.extend({
            complete : null
        }, options);

        var el = this; // The element this was called on.

        // get container width
        var width = el.width();
        self.currentMode = "md";
        if(width < 768 ){
            self.currentMode = "xs"
        }
        if(width >= 768 && width < 992 ){
            self.currentMode = "sm"
        }
        if(width >= 992 && width < 1200 ){
            self.currentMode = "md"
        }
        if(width >= 1200 ){
            self.currentMode = "lg"
        }


        var dataString = "";
        var classString = el.attr('class');
        var classList = classString.split(' ');
        for(var i = 0; i < classList.length; i++) {
            var o = classList[i];
            if(o.indexOf('col-') !== -1){
                //
                // get whether it's sm, xs etc.
                // if the width fits then apply
                // if show hide fits than show/hide
            }

        }


        this.calculateWidth = function(divide){
            return divide/12*100;
        }

        // Run the complete function if there is one
        if ( $.isFunction( settings.complete ) ) {
            settings.complete.call( this );
        }

        // Return the element so jquery can chain it
        return this;

    }

}(jQuery));
