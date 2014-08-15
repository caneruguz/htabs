/*
 *   Jquery Rescon : responsive containers
 *   Provides responsiveness to Bootstrap grid elements by applying media sizing when these elements are within responsive containers.
 */
(function($) {
    $.fn.rescon = function(options) {
        var self = this;
        // Default options
        this.settings = $.extend({
            complete : null,
            action : "run"
        }, options);

        var el = this; // The element this was called on.
        this.sizes = ["xs", "sm", "md", "lg"];

        this.runRescon = function (index, element){
            // get container width and set the current mode. Change these sizes to your own threshold.
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
            // Look at each column element within this div. You can change .find() to other selectors for more refined control.
            $(element).find('div[class^="col-"]').each(function(i, e){
                var dataString = "";
                var classString = $(e).attr('class');
                var classList = classString.split(' ');
                var newCols = "";
                // Save classes to rescon data attribute
                for(var i = 0; i < classList.length; i++) {
                    var o = classList[i];
                    if(o.indexOf('col-') !== -1){
                        dataString += " "+o;
                        if(o.indexOf(self.currentMode)  !== -1 ){
                            newCols += " "+o;
                        }
                    }
                }
                $(e).attr('data-rescon', dataString.trim());

                // Remove all classes related to column resizing
                var newclass = classString.replace(/^col.*/g, "");
                var currentSize = self.sizes.indexOf(self.currentMode);
                var dataList = dataString.split(" ");
                // If there are no column identifiers at this level move down, because bootstrap cascades upwards.
                if(newCols == ""){
                    var before = self.recurseDown(currentSize-1, dataString);
                    for(var i = 0; i < dataList.length; i++) {
                        var o = dataList[i];
                        if(o.indexOf(self.sizes[before])  !== -1 ){
                            newCols += " "+o;
                        }
                    }
                }
                // If we still don't have anything set default of 12 width
                if(newCols == ""){
                    var newCols = "col-"+self.currentMode+"-"+"12";
                }
                var begin;
                (newclass.length > 0) ?  begin = newclass+" " : begin = '';
                // Rewrite the classes for the element
                $(e).attr('class', begin+newCols.trim());
            })
        }

        // We are not done though.
        this.recurseDown = function recur (index, dataString){
            // does data string have smaller size ?
            if(index >= 0){
                if(dataString.indexOf(self.sizes[index])){
                    return index;
                } else {
                    recur(index-1, dataString)
                }
            } else {
                return -1;
            }
        }

        this.reset = function (index, element){
            $(element).find('div[data-rescon^="col-"]').each(function(i, e){
                var dataString = $(e).attr('data-rescon');
                var classString = $(e).attr('class');
                var newclass = classString.replace(/^col.*/g, "");
                $(e).attr('class', newclass+" "+dataString);
            })

        }

        if(this.settings.action === "run"){
            el.each(self.runRescon);
        }
        if(this.settings.action === "reset"){
            el.each(self.reset);
        }

        // Run the complete function if there is one
        if ( $.isFunction( self.settings.complete ) ) {
            self.settings.complete.call( this );
        }

        // Return the element so jquery can chain it
        return this;

    }

}(jQuery));
