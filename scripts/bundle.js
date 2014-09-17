(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = {}; // Create a namespace for the entire app

// Load components and add them to the app namespace
app.logs = require('../components/logs/logs');
app.dashboard = require('../components/dashboard/dashboard');
app.comments = require('../components/comments/comments');
app.wiki = require('../components/wiki/wiki');
app.components = require('../components/components/components');
app.files = require('../components/files/files');
app.rescon = require('../components/rescon/rescon');

   // Initialize the mithril application module. -- this will be broken down in larger implementation
    var build = {};
    build.layout = m.prop($(window).width());


    build.workspace = m.prop("");
    m.request({method: "GET", url: "../workspace.json"}).then(build.workspace).then(function(){ m.module(document.body, build);    });

    //  Models
    // Module Model
    build.module = function(title, id, color, columns, css){
        this.id = id || 1;
        this.title = title || "Module Title";
        this.order = 1;
        this.color = color;
        this.columns = columns;
        this.minimize = false;
        this.exposeWidth = 300;
        this.exposeHeight = 300;
        this.css = css || "";
        this.about = "";
        this.dateCreated = "";
        this.lastUpdated = "";
        this.citation  = "";
        this.links = [];
        this.show = true;
        this.bookmarks = [];
        this.bookmarked = false;
    };
    // Column Model
    build.column = function(width, widgets){
        this.width = width;
        this.widgets = widgets ;
        this.new = false;
    };
    // Widget Model
    build.widget = function(id, title, content, iframeLink, hideHeader ){
        this.id = id;
        this.title = title || "Widget Title";
        this.content = content || "Lorem ipsum dolor sit amet";
        this.expandable = false;
        this.closable = true;
        this.height = 300;
        this.display = true;
        this.hideHeader = hideHeader;
        this.type = "comments";
        this.css = "";
        this.data = "";
    };

     // Controller
     build.controller = function(){
        var self = this;  // use self for binding inner scopes:
        this.modules = build.workspace; // Assign modules to the model we created. observableness is set in the create function.
        this.canReformat = true;    // turn reformating on or off, sometimes we want formating to not be triggered.
        this.localExpose = false;   // turn expose mode on or off, helps rending expose mode as pure mithril view.
        this.temp = { startIndex : 0, stopIndex : 0 , fromObj : {}, toObj : {}, scrollTo : ""}; // Temporary variables so that jquery ui functions can send variables to each other. Is there a better way for this?
        this.layout = build.layout;
        this.virtualModel = [];
        m.redraw.strategy("all");
        var controllers = this.controllers = {};

         self.applyModules = function(){
             self.modules().map(function(module) {
                 module.columns.map(function(column) {
                     column.widgets.map(function(widget){
                         controllers[widget.id] = new app[widget.type].controller
                     });
                 });
             });

         };
        self.applyModules();

        this.eventsOff = function(){
            $('ht-widget').resizable("destroy");
            $('.ht-column').resizable("destroy");
            $('.ht-column').sortable("destroy");
        };
        this.eventsOn = function(){
            $('.ht-widget').resizable({
                handles : "s",
                minHeight: 100,
                containment : "parent",
                resize : function (event, ui){
                    var column = $(event.target).parent();
                    self.resizeWidgets(column)
                },
                stop : function(){
                    self.resizeWidgets();
                }
            } );
            $('.ht-column:not(.no-resize)').resizable({
                handles : "e",
                minWidth : 250,
//                alsoResize : "#ht-content",
                resize : function (){
                    self.saveColumnSize();
                    self.reformatWidth();
                },
                stop : function (){
//                    self.saveColumnSize();
                    $(".widget-body-inner").rescon(
                        {
                            sizes : { "xs" : 0, "sm" : 300, "md" : 600, "lg" : 1000 }
                        }
                    );

                },
                create : function(){
                    console.log("Resizable created");
                }
            } );

            $(".ht-column").not('.ht-column[data-index=-1]').sortable({
                connectWith: ".ht-column",      // So that we can move widgets between other columns.
                handle: ".ht-widget-header",    // Grab from the header div only.
//                containment: "#ht-content",
                cursor : "move",
                opacity : 0.7,
                helper : 'clone',
//                tolerance : 'pointer',
                appendTo : '#ht-content',
                forceHelperSize : true,
                placeholder: "ht-widget-placeholder",
                start : function (event, ui){   // The only outcome of this is to get the widget that is being moved i.e. from
                    ui.placeholder.width("98%");
                    ui.helper.css({
                        width: 200,
                        height: 200,
                        overflow : 'hidden'
                    });
                    console.log(ui.offset)
                    self.temp.fromObj = {};     // empty temp objects so we don't use any of these values accidentally
                    self.temp.toObj = {};
                    var from = {
                        module : ui.item.parent().parent().parent().attr('data-index'),
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    };
                    self.temp.fromObj = from; // assign the from object
                    console.log(ui.item);
                },
                stop : function(event, ui){     // get the widget placement that we want the original widget to drop to
                    var to = {
                        module : ui.item.parent().parent().parent().attr('data-index'), // ui returns the same widget but the indexes and placement has changed.
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    };
                    self.temp.toObj = to; // Assign the to object, this is not strictly necessary since we use it right away below
                    $('.ht-column').not('.ht-column[data-index=-1]').sortable( "cancel" );       // Stop sortable from actually sorting, leave this to mithril because we changed the observable model
                    self.moveWidget(self.temp.fromObj, self.temp.toObj); // Move the widget
                    console.log("-----");
                    console.log(self.modules());
                    console.log("-----");
                    self.localExpose = false;
                    m.redraw();
                    self.cleanDOM();
                },
                over : function(event, ui){
                        console.log(event, ui);
                        var widgets = $(event.target).children('.ht-widget');
                        var totalWidgets  = widgets.length;
                        $(event.target).children('.ht-widget').each(function(){
                            var height = $(this).outerHeight;
                            var adjustAmount = 50/totalWidgets;
                            var adjustedHeight = height-adjustAmount;
                            $(this).css({ height : adjustedHeight + "px"})
                        })
                },
                out : function (){
                  self.resizeWidgets();
                },
                cursorAt: {left:100, top:25}
            });
        };
        this.init = function(element, isInitialized){
            if(isInitialized) return;

            // When window resizes the view changes to fit the height.
            var oldWidth = $(window).width(); 
            var oldHeight = $(window).height();

            $(window).resize(function() {
                (function(){
                    if ($(window).height()==oldHeight || $(window).height() < 500) return; 
                    else
                        oldHeight = $(window).height();
                        self.reformatHeight();
                        self.resizeWidgets();
                })();
                // Always run width but only run height if necessary and taller than 500px;
                oldWidth = $(window).width();
                self.reformatWidth();
            });

            self.reformatWidth();
            self.reformatHeight();
            self.createVirtual();

            // ScrollTo take you to the module when clicked on the header
            $(document).on('click', '.ht-hdiv', function(){
                var id = $(this).attr('data-hid');
                $('#ht-wrapper').scrollTo($('.ht-tab[data-id="'+id+'"]'), 150,  {offset:-50});
            });
            // Scroller is its own jquery plugin now.
            $('#ht-slider').scroller({ scrollWrapper: "#ht-wrapper", complete : function(){ console.log("Scroller Completed!");} });

            // Key listeners
            $(document).keyup(function(e) {
                // ESC
                if (e.keyCode == 27) {
                    if(self.localExpose === true ) {
                        self.localExpose = false;
                        m.redraw();
                    }
                }
                // numbers 1 - 9 take you through these module indexes
                if(e.keyCode >  48 && e.keyCode < 58){
                    console.log(e.keyCode);
                    var index = e.keyCode - 49;
                    $('#ht-wrapper').scrollTo($('.ht-tab[data-index="'+index+'"]'), 150,  {offset:-50});
                }
            });
            self.eventsOn();
            console.log("app initialized");
        };

        // WIDGETS
        // When widgets are moved we need to update the model itself with the changes.
        this.moveWidget = function(from, to){
            // modules >  column >  widget   modules[0].column[1].widget[1]
            // get widget from the from location
            var widget = self.modules()[from.module].columns[from.column].widgets[from.widget];
            /// if columns are different do as usual - same column number within different widgets also okay
            if(from.module !== to.module || from.column !== to.column){
                // add it to the to location
                self.modules()[to.module].columns[to.column].widgets.splice(to.widget,0,widget);
                // remove original widget
                self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);
                // remove extra col if from.column empty
                if(self.modules()[from.module].columns[from.column].widgets < 1){
                    self.modules()[from.module].columns.splice(from.column, 1);
                }
            } else {
                // manage the index numbers properly if they are within the same column
                // if from < to first delete then add
                if(from.widget < to.widget){
                    self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);
                    self.modules()[to.module].columns[to.column].widgets.splice(to.widget,0,widget);
                } else {
                    // else first add than delete
                    self.modules()[to.module].columns[to.column].widgets.splice(to.widget,0,widget);
                    self.modules()[from.module].columns[from.column].widgets.splice(from.widget+1, 1);
                }
            }
            console.log(self.modules())
            // console.log("widget moved", from, to);
            // console.log(self.modules());
            self.reformatWidth();   // We need to redo sizes. Maybe we should push this to resize Widgets.
            self.createVirtual();
            self.resizeWidgets(); // After moving we will need to readjust the heights of the widgets

        };
        this.resizeWidgets = function() {
            var args = arguments;
            var selector = $('.ht-column');
            if(args[0]){
                selector = args[0];
            }

            selector.each(function(){   // Iterate over colummns, we don't need to use jquery to iterate but doesn't harm.
                var setContentHeight = $(this).outerHeight(); // Height of the column
                var contentHeight = $(this)[0].scrollHeight; // Get content height, if item is not scrolling this will be same as setContentHeight, otherwise it will be bigger.
                // Calculate Total widgets height -- this is in case widgets end up not covering the entire height of the column.
                var totalHeight = 0;
                $(this).children('.ht-widget').each(function(){
                    totalHeight = totalHeight+$(this).outerHeight()+10; // 10 is for bottom margin
                });

                // for each children calculate their relative heights so that we fill the column proportionally to the existing heights of the widgets ;
                $(this).children('.ht-widget').each(function(){
                    var childHeight = $(this).outerHeight();
                    var headerHeight = $(this).children('.ht-widget-header').outerHeight();
                    var newHeight;
                    if(setContentHeight < contentHeight){
                        newHeight = (childHeight/contentHeight)*setContentHeight;
                    } else {
                        newHeight = (childHeight/(totalHeight))*setContentHeight;
                    }
                    if(newHeight > 100){
                        $(this).css({ height : newHeight}).find('.ht-widget-body').css({ height : (newHeight-headerHeight)+"px"})//.find('.widget-body-inner').css({ height : newHeight-40});
                    }
                });

            });
            $(".widget-body-inner").rescon();

        };
        this.expandWidget = function(module, column, widget){
            // create a column after this column
            self.modules()[module].columns.splice(column+1,0, new build.column(620, []));
            // move widget to this column
            var from = { module : module, column : column, widget : widget};
            var to = { module : module, column : column+1, widget : 0};
            self.moveWidget(from, to);
        };
        // EXPOSE
        this.exposeInit = function(){
            $(".expose-modules").sortable({
                placeholder: "ghost-element ht-tab ui-state-default",
                cursor : "move",
                helper : "clone",
                beforeStop : function(event, ui){
                    console.log(ui.item.index());
                    self.temp.stopIndex = ui.item.index();
                    $( ".expose-modules").sortable( "cancel" );
                    console.log("Start", self.temp.startIndex, "Stop", self.temp.stopIndex );
                    self.moveModule(self.temp.startIndex, self.temp.stopIndex);
                },
                start : function(event, ui){
                    self.temp.startIndex = ui.item.index();
                    ui.helper.css({
                        width: 300,
                        height: 300
                    });

                },
                cursorAt: {left:100, top:25}


            });
        };
        this.beginExpose = function(){


            self.calculateExposeWidths();
//
            self.localExpose = true; // We can run expose in mithril view
//            self.canReformat = false; // Deactivate reformatting -- is this still necessary? yes but because we are using the same tab classes. Keep it for now.
            console.log(self.canReformat);
        };
        this.endExpose = function(){
            // Return view to normal
            self.localExpose = false;
//            self.canReformat = true;
        };
        this.calculateExposeWidths = function(){
            var windowWidth = $(window).width();
            var windowHeight = $(window).height();
            var wrapperHeight = windowHeight-40;
            var tab = wrapperHeight-80;
            var adjheight = tab/2;
            var adjpadding = tab/4;
            // get size of all modules
            var modlens = self.calculateContentLength();
            $(".ghost-element").css('height', adjheight);
            self.modules().map(function(module){
                var baseWidth = 60+20+20; //  60 : width of the add column bar; 22: htab margin+border; 20 : ht-tab-content padding
                var columnW;
                module.columns.map(function(column){
                    columnW = column.width+10; // right padding + right margin + right border
                    baseWidth += columnW;
                });
                var width = (baseWidth)/(modlens);   // The ratio of this module over all modules
                var adjwidth = width*(windowWidth-(40*self.modules().length)-adjpadding/2); // calculate width, taking into account proper padding
                module.exposeWidth = adjwidth; // assign the new widths to the model object
                console.log(baseWidth, modlens, adjwidth);
                console.log("Expose width", module.exposeWidth);
            });
        }
        this.calculateContentLength = function(){
            var totalLength = 20; // This is not a good number, why does this work right?
            self.modules().map(function(module){
                if(module.show){
                    var thisWidth = 60+20+20+410; //  60 : width of the add column bar; 22: htab margin+border; 20 : ht-tab-content padding 410 for dashboard width;
                    if(module.bookmarks.length > 0){
                        thisWidth += 270;
                    }
                    module.columns.map(function(column){
                        var columnW = column.width+10; // right padding + right margin + right border
                        thisWidth += columnW;
                    });
                    totalLength += thisWidth;
                }
            });
            return totalLength;
        }

        // MODULES
        this.moveModule = function(from, to){       // Move module within the expose window. Gets triggered suring sortable in expose.
            // get module object with From module index
            var module = self.modules()[from];
            // add to To index
            // if from < to first delete then add
            if(from < to){
                self.modules().splice(from, 1);
                self.modules().splice(to, 0, module);
            } else {
            // else first add than delete
                self.modules().splice(to, 0, module);
                self.modules().splice(from+1, 1);
            }
            m.redraw(); // We shouldn't need to redraw but apparently we do. Need to check that.
        };
        this.addModule = function() {
            var clrs = ["maroon", "purple", "fuchsia",  "red",  "orange",   "yellow",   "aqua", "olive",    "teal", "green",    "lime", "blue", "navy"];
            var randomNumber = Math.floor(Math.random()*clrs.length);
            // This will eventually be selected from lists
            var moduleId = Math.floor((Math.random() * 100000) + 1)+3;
            var col1Id = Math.floor((Math.random() * 100000) + 1)+6;
            var col2Id = Math.floor((Math.random() * 100000) + 1)+6;

            self.modules().push(
                new build.module("Added Module " + moduleId, moduleId, clrs[randomNumber], [
                    new build.column(620, [
                        new build.widget(col1Id, "Widget " + col1Id),
                        new build.widget(col2Id, "Widget " + col2Id)
                    ])
                ])
            );
            self.applyModules();
            self.temp.scrollTo = '.ht-tab[data-id="'+ moduleId + '"]';
            console.log(self.temp.scrollTo);

        };
        this.removeModule = function(module_index){
            // unload, turn events off etc.
            if(self.modules()[module_index].bookmarked){
                // hide module
                self.modules()[module_index].show = false;

                self.modules()[0].bookmarks.map(function(b){
                    if(b.id == self.modules()[module_index].id ){
                        b.open = false;
                    }
                })

            } else {
                self.modules().splice(module_index, 1);
            }
            self.reformatWidth();
        };
        this.toggleModule = function(index, state){
            self.modules()[index].minimize = state;
//           self.reformat();
            //m.redraw();
            self.calculateExposeWidths();
            console.log(self.modules()[index].exposeWidth)

        };

        // COLUMNS
        this.addCol= function (module_index){
            // is there an empty column?
            var empty = false;
            self.modules()[module_index].columns.map(function(item) {
                if(item.widgets.length < 1 ){
                    empty = true;
                }
            });
            if(!empty){
                self.modules()[module_index].columns.push({ width: 300, widgets : [], new : true});
                self.eventsOn();
                self.reformatWidth();
                var offset = $('.ht-tab[data-index="'+module_index+'"] > .ht-tab-content > .ht-add-column').offset().left;
                var windowW = $(window).width();
                var selector = '.ht-tab[data-index="'+module_index+'"] > .ht-tab-content > .ht-column:last';
                if(offset+320 > windowW) {
                    self.temp.offset = windowW-300;
                    self.temp.scrollTo = selector;

                } else if (offset < 250) {
                    self.temp.offset = 300-offset;
                    self.temp.scrollTo = selector;

                } else {
                    self.temp.offset  = 0;
                    self.temp.scrollTo = "";
                }
            }
        };
        this.removeExtraCols = function(){
            self.modules().map(function(modules, modules_index){
                modules.columns.map(function(column, column_index, array){
                    if(column.widgets < 1){
                        array.splice(column_index, 1);
                    }
                });
            });
        };

        this.saveWorkspace = function () {
             console.log(self.modules());
        };

        // Creating separate function for each action that can occur
        this.reformatWidth = function () {
            if(self.canReformat){
//                console.log("reformat ran")

                var window_width = $(window).outerWidth();

                var totalLength = self.calculateContentLength();


                var ht_head_width = window_width -75; // allowing room for expose buttons, element width is 75px
                // var ht_head_width = window_width -500; // allowing room for expose buttons, element width is 75px
                var ht_content_width = totalLength;
            
                $('#ht-head').css({ width : ht_head_width + 'px' } );
                $('#ht-wrapper').css({ width : window_width + 'px' } );
                $('#ht-content').css('width', ht_content_width + 'px'); 

                // Adjust s lider on changes


                // $('.ht-slider-wrap').css('width', ht_head_width + 'px');
                var remainder = 0;
                var actual_ht_head = 0;
                for(var i = 0; i < self.modules().length; i++){
                        var o = self.modules()[i];
                        // +40 = fix for margin space
                        // if window width is bigger then adjust to the window width, otherwise content width

                        var use_width = (window_width > ht_content_width) ? window_width : ht_content_width;
                        // use width is width of the whole page 
                        var width = (($('.ht-tab[data-id="'+o.id+'"]').outerWidth()+20))/(use_width-20)*ht_head_width + remainder;
                        var adjWidth = Math.floor(width);
                        actual_ht_head += adjWidth;
                        remainder = width - adjWidth;
                        
                        $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : adjWidth+'px'});
                        // update column widths in the model
                    }

                $('#ht-slider').width(Math.floor(window_width*actual_ht_head/($('#ht-content').outerWidth()+10)) + 'px') // as usual, I have no idea why this number works
                    .css('left', $('#ht-wrapper').scrollLeft() * $('#ht-head').outerWidth()/$('#ht-content').outerWidth() + 'px');
                    
                // self.resizeWidgets(); don't need this.
                self.eventsOn();
            }
        };

        this.reformatHeight = function(){
            if(self.canReformat){
            var window_height = $(window).height() + 15;

                // heights :
                var ht_wrapper_height = window_height-45; // Remaining elements height is 45px, ht-head and ht-slider-wrap
                var ht_tab_height = ht_wrapper_height-35; // wrapping parent ht-content has a total of 20px padding on top and bottom;
                var ht_tab_content_height = ht_tab_height-1;
                var ht_column_height =  ht_tab_content_height-10;
                $('.ht-tab').css({ height: ht_tab_height + 'px'}); // tab h
                $('.ht-tab-content').css({ height: ht_tab_content_height+'px'}); // content h
                $('.ht-column').css({height: ht_column_height});  // widget column heigh
                $('.ht-add-column').css({height: ht_column_height}); // new col button height
                $('#ht-wrapper').css({ height: ht_wrapper_height + "px" } ); // content h

                self.resizeWidgets();
                self.eventsOn();
            }
        };

        this.reformat = function(){
            self.reformatHeight();
            self.reformatWidth();
        };
        this.widgetInit = function(element) {
            console.log("Element", element);
            if (self.temp.scrollTo && $(self.temp.scrollTo).get(0)) {
                $('#ht-wrapper').scrollTo($(self.temp.scrollTo), 150, {offset: -50 });
            }
            console.log("Scrollto here:", self.temp.scrollTo);
            self.resizeWidgets();
            var module = self.modules()[self.modules().length-1];
            var column = module.columns[module.columns.length-1];
            var widget = column.widgets[column.widgets.length-1];
            var id = widget.id;
            if($(element).attr('data-id') == id) {
                self.temp.scrollTo = "";
            }

        }
        self.saveColumnSize = function(){
            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
                o.columns.map(function(item, index, array){
                    item.width = ($('.ht-tab[data-id="'+o.id+'"]').find('.ht-column[data-index='+index+']')).outerWidth();
                });
            }
        };
         this.loadLink = function(e){
             var event = e || window.event;
             var link = $(event.target);
             var type = link.attr('data-type');
             var title = link.text();
             var index = link.closest('.ht-tab').attr('data-index');
             console.log("type : " , type);
             // is this module type already open?
             var open = false;
             self.modules()[index].columns.map(function(col, c_index, c_array){
                 col.widgets.map(function(w, w_index, w_array){
                     if(w.type == type){
                         open = true;
                     }
                     // if this is the last widget of the last column
                     if(c_index == c_array.length-1 && w_index == w_array.length-1 ){
                         // and widget is still not found
                         if(!open){
                             var randomNumber = Math.floor(Math.random()*10000);
                             var widget = {
                                 "id" : randomNumber,
                                 "title" : title,
                                 "type" : type,
                                 "data" : "",
                                 "closable" : true,
                                 "expandable" : true,
                                 "height" : 300,
                                 "display" : true,
                                 "hideHeader" : false,
                                 "content" : "",
                                 "css" : ""
                             }
                             c_array.push( new build.column(620, [ widget ]));
                             self.applyModules();
                             var selector = $('.ht-widget[data-id='+randomNumber+']');
                             console.log("Selector", selector)
                             self.temp.scrollTo = selector;
                             console.log(c_array);
                         }
                     }
                 })
                 console.log(open);

             })
         }
         this.createVirtual = function(){
             // Repopulate the virtual model array
             self.virtualModel = [];
             self.modules().map( function(m, m_index ){
                 var module = { index : m_index, id : m.id, columns : []};
                 if(m.columns.length > 0 ){
                     m.columns.map(function(c, c_index){
                         var column = { index :  c_index, widgets : [] };
                         if(c.widgets.length > 0){
                             c.widgets.map(function(w, w_index){
                                 var widget = { index : w_index, id : w.id , checks : {}}
                                 column.widgets.push(widget);
                             })
                         }
                         module.columns.push(column);
                     })
                 }
                self.virtualModel.push(module);
             })
             console.log("Virtual Model", self.virtualModel);
         }
         this.cleanDOM = function(){
             // Clean up the DOM so that widgets that are viewed correspond to the view. If widget not shown throw error, if extra widget is shown remove it.
             $('.ht-tab').each(function(){
                 var m_index = $(this).attr('data-index');
                 $(this).find('.ht-column').each(function(){
                     var c_index = $(this).attr('data-index');
                     if(c_index > -1){
                         $(this).children('.ht-widget').each(function(){
                             var w_index = $(this).attr('data-index');
                             var w_id = $(this).attr('data-id');
                              if ( w_index > -1 ) {
                                  if(!self.virtualModel[m_index].columns[c_index].widgets[w_index].checks.build){
                                      self.virtualModel[m_index].columns[c_index].widgets[w_index].checks.build = true;
                                      console.log("self.virtualModel["+m_index+"].columns["+c_index+"].widgets["+w_index+"].checks.build ",self.virtualModel[m_index].columns[c_index].widgets[w_index].checks.build                                      )
                                  } else {
                                      // remove this node
                                      $(this).remove();
                                  }
                              }
                         })
                     }
                 })
             })
             // IF we removed widgets we need to adjust sizes
             self.resizeWidgets();
         }
         this.moduleViewToggle = function(event){
             var event = event || window.event;
             var module = $(event.target).parent();
             var moduleID = module.attr('data-mid');
             console.log("ModulID", moduleID);
             // Toggle view
             self.modules().map(function(mod){
                 console.log(mod.id)
                 if(mod.id == moduleID ){
                     mod.show = !mod.show;
                 }
             })
             // toggle bookmark view
             self.modules()[0].bookmarks.map(function(b){
                 if(b.id == moduleID ){
                     b.open = !b.open;
                 }
             })
         }

         this.bookmarkToggle = function(event) {
             var event = event || window.event;
             var el = $(event.target);
             var mindex = el.attr('data-mindex');
             var module = self.modules()[mindex];
             var bookmark =             {
                 "id" :  module.id,
                 "title" : module.title,
                 "open": true,
                 "color" : module.color
             }
             self.modules()[0].bookmarks.push(bookmark);
             module.bookmarked = true;
         }

    // MOBILE
         this.mobileInit = function(){
             console.trace();
             var dist = 150;

             $(".ht-mobile-widget").swipe( {
                 //Generic swipe handler for all directions
                 swipe:function(event, direction, distance, duration, fingerCount) {
                     var target_module = $(this).closest(".ht-mobile-module").attr("data-index");
                     var element;
                     switch(direction){
                        case "up" :
                            console.log(target_module);
                            element = $(".ht-mobile-module[data-index="+(parseInt(target_module)+1)+"]")
                            if(element.length > 0){
                                $('#ht-mobile-content').scrollTo(element, dist,  {offset:0});
                            }
                            break;
                        case "down":
                            console.log(target_module);
                            element = $(".ht-mobile-module[data-index="+(parseInt(target_module)-1)+"]")
                            if(element.length > 0){
                                 $('#ht-mobile-content').scrollTo(element, dist,  {offset:0});
                            }
                            break;
                        case "left" :
                            console.log(target_module);
                            var element = $(this).next();
                            if(element.length > 0){
                                $('.ht-mobile-module[data-index='+target_module+']').scrollTo(element, dist,  {offset:0});
                            }
                            break;
                        case "right" :
                            console.log(target_module);
                            var element = $(this).prev();
                            if(element.length > 0){
                                 $('.ht-mobile-module[data-index='+target_module+']').scrollTo(element, dist,  {offset:0});
                            }
                            break;
                    
                    }
                        console.log("direction", direction, "fingerCount", fingerCount);

                 }
             });
             self.canReformat = false;
         }
         this.mobileModuleInit = function (){
             var mobileContentHeight = $(window).height()-50;
             var mobileContentWidth = $(window).width();
             console.log(mobileContentHeight);
             $('.ht-mobile-module').css({'height': mobileContentHeight + 'px', 'width' : mobileContentWidth+'px'})
             $('#ht-mobile-content').css({'height': mobileContentHeight + 'px', 'width' : mobileContentWidth+'px'})
         }
         this.mobileExposeInit = function(){
             var mobileContentHeight = $(window).height();
             $('#ht-mobile-expose').css({'height': mobileContentHeight + 'px'});
         }
         this.mobileWidgetInit = function(module_index){
             var mobileContentHeight = $(window).height()-40;
             var mobileContentWidth = $(window).width();
             $('.ht-mobile-widget').css({ 'height': mobileContentHeight + 'px', width : mobileContentWidth + 'px'})
            // calculate module width based on total widgets, this needs to refresh every time a widget is loaded.
             var totalWidgets = 1; // title page is one widget;
             self.modules()[module_index].columns.map(function(column){
                 totalWidgets += column.widgets.length;
             })
            $('.ht-mobile-module[data-index='+module_index+']').children('.ht-mobile-module-inner').css('width', mobileContentWidth*totalWidgets);
         }
         this.mobileExposeToggle = function () {
                self.mobileExpose = !self.mobileExpose;
         }

    }    
    build.view = function(ctrl){
         if(ctrl.layout() < 481){
            if(ctrl.mobileExpose){
                return m("#ht-mobile-expose", { config : ctrl.mobileExposeInit}, [
                    m(".ht-mobile-expose-header.pull-right", [
                        m('.fa.fa-times.text-white', { onclick : ctrl.mobileExposeToggle })
                    ]),
                    m(".ht-mobile-expose-wrap", [
                        ctrl.modules().map(function(module, module_index, module_array){
                            return m('.ht-mobile-expose-module.clearfix', {"class" : 'bg-'+module.color } ,  [
                                m("i.fa.fa-times.pull-right", { onclick : function(){ ctrl.removeModule(module_index); } }, ""),
                                m("", module.title)
                            ])
                        })
                    ])
                ])
            } else {
                return m("#ht-mobile-wrapper", { config : ctrl.mobileInit}, [
                    m("#ht-mobile-header", [
                        m('#ht-mobile-title', "Htabs Mobile Version"),
                        m('#ht-mobile-menu', [
                            m('i.fa.fa-bars', { onclick : ctrl.mobileExposeToggle })
                        ])
                    ]),
                    m("#ht-mobile-content", [
                        ctrl.modules().map(function(module, module_index, module_array){
                            var clrs = ["maroon", "purple", "fuchsia",  "red",  "orange",   "yellow",   "aqua", "olive",    "teal", "green",    "lime", "blue", "navy",];
                            
                           
                            return m('.ht-mobile-module', { config : ctrl.mobileModuleInit, "class" : 'bg-'+module.color,  "data-index":module_index}, [
                                m('.ht-mobile-module-inner', [
                                    m('.ht-mobile-widget', { "class" : module.css, "data-id" : -1}, [
                                        m('div', {'class':'ht-mobile-module-title'}, module.title), 
                                        m('div', {'class':'ht-mobile-module-content'}, "Lorem fake content goes here ipsum"),
                                        module.columns.map(function(column){
                                            return column.widgets.map(function(widget, widget_index, widget_array){
                                                var randomNumber = Math.floor(Math.random()*clrs.length);
                                                return m('.ht-mobile-widget-list.clearfix', {"class" : 'bg-'+clrs[randomNumber], 
                                                        onclick : function(){
                                                            // console.log(widget_index);
                                                            var element = $('.ht-mobile-widget[data-id='+widget.id+']');
                                                            $('.ht-mobile-module[data-index='+module_index+']').scrollTo(element, 150, {offset:0});
                                                        } 
                                                    },  [
                                                    m("i.fa.fa-times.pull-right", { onclick : function(){ ctrl.removeModule(module_index); } }, ""),
                                                    m("", widget.title)
                                                    ]);
                                                });
                                        }) 
                                    ]),
                                    module.columns.map(function(column){
                                        return column.widgets.map(function(widget, widget_index, widget_array){
                                            return m('.ht-mobile-widget', { config : function(){ ctrl.mobileWidgetInit(module_index)} , 'style' : 'background:white', "data-id" : widget.id } , [
                                                m('.ht-mobile-widget-title', widget.title),
                                                (function(){  return app[widget.type].view(ctrl.controllers[widget.id])})()
                                            ])
                                        })
                                    })
                                ])

                            ])
                        })
                    ])

                ])
            }
        }else{

        if(ctrl.localExpose){
            return [
                m("#exposeDiv.animated.fadeIn", [
                    m(".exposeClose", [m("i.fa.fa-times", { onclick : ctrl.endExpose })]),
                    m(".expose-content", { config : ctrl.exposeInit } , [
                        m(".expose-modules", [
                            ctrl.modules().map(function(module, module_index, module_array){
                                if(module.show){
                                    if(module.minimize){
                                        return [" ", m(".ht-expose-tab.ht-tab-minimized.ht-dark-shadow", {'data-index' : module_index, 'data-id' : module.id, style : "height : " + module.exposeHeight}, [
                                            m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                                m(".ht-windowBtn", [
                                                    m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                    m("i.fa.fa-plus", { onclick : function(){ ctrl.toggleModule(module_index, false );}})
                                                ])
                                            ]),
                                            m(".ht-expose-tab-content", [m("h3.rotate.rotatedText-expose", module.title)])
                                        ])];
                                    } else {
                                        return [" ", m(".ht-expose-tab.ht-dark-shadow", {'data-index' : module_index,  'data-id' : module.id, style : "min-width: 0; width: "+module.exposeWidth+"px; height : "+module.exposeHeight   +"px; " }, [
                                            m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                                m("h3", module.title),
                                                m(".ht-windowBtn", [
                                                    m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                    m("i.fa.fa-minus", { onclick : function(){ ctrl.toggleModule(module_index, true );}})
                                                ])
                                            ]),
                                            m(".ht-expose-tab-content", [ m("") ])

                                        ])];
                                    }
                                }
                            })
                        ]),
                        m('.expose-actions', [
                            m('.expose-button', { onclick : ctrl.saveWorkspace},  [ m('i.fa.fa-save'), m("span", "Save Workspace")])
                        ])

                    ])

                ])
            ];
        } else {
            return [
               m(".ht-head-wrapper", [
                   m("[id='ht-head']", [
                       ctrl.modules().map(function(module, module_index, module_array){
                           if(module.show){
                               return m(".ht-hdiv.bg-"+module.color, { "data-hid" : module.id}, [m("span.ht-hdiv-content", module.title)] );
                           }
                       })
                   ]),
                   m("div.appBtnDiv", [
                       m("span.exposeOpen.appBtn",  {onclick : ctrl.beginExpose }, [m('.i.fa.fa-th-large')]),
                       m("span.appBtn",  {onclick : ctrl.addModule }, [m('.i.fa.fa-plus')] )

                   ])
               ]),
                m(".ht-slider-wrap", [m("[id='ht-slider']")]),
                m("[id='ht-wrapper']", { config : ctrl.init }, [
                    m("[id='ht-content']", {config : ctrl.reformat },    [
                            ctrl.modules().map(function(module, module_index, module_array){
                                if(module.show){
                                    if(module.minimize){
                                        return [m(".ht-tab.ht-tab-minimized.ht-light-shadow", {'data-index' : module_index, 'data-id' : module.id}, [
                                            m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                                m(".ht-windowBtn", [
                                                    m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                    m("i.fa.fa-plus", { onclick : function(){ ctrl.toggleModule(module_index, false );} } )
                                                ])
                                            ]),
                                            m(".ht-tab-content", {style: " max-height : 100px"  }, [m("h3.rotate.rotatedText", module.title)])
                                        ])];
                                    }else {
                                        return [m(".ht-tab.ht-light-shadow", { 'class' : module.css +' bg-'+module.color , 'data-index' : module_index,  'data-id' : module.id} , [
//                                        m(".ht-tab-header", {  "data-bg" : module.color }, [
//                                            m("h3", module.title),
//                                            m(".ht-windowBtn", [
//                                                m("i.fa.fa-minus", { onclick : function(){ ctrl.toggleModule(module_index, true );}}),
//                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }})
//                                            ])
//                                        ]),
                                            m(".ht-tab-content", { 'class' :' bg-'+module.color }, [
                                                m(".ht-column.no-resize.no-border", {'data-index' : -1, 'style' : "width:400px"},  [
                                                    m(".ht-widget.no-border", { config : ctrl.widgetInit, 'data-index' : -1, "style" : "height : 100%; padding: 15px;", "class" : "ui-widget ui-widget-content ui-helper-clearfix ht-inverted"}, [
                                                        m(".ht-widget-body", [ m("div.widget-body-inner",{ id : "dashboardwidget"+module.id }, [
                                                                (function(){
                                                                    var marked = "";
                                                                    if(module.bookmarked){ marked = "ht-opaque-active"; }
                                                                    if(module.id > 0) {
                                                                        return m('.ht-module-menu', [
                                                                            m('i.fa.fa-times', { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                                            m('i.fa.fa-minus', { onclick : function(){ ctrl.toggleModule(module_index, true );}} ),
                                                                            m('i.fa.fa-edit'),
                                                                            m('i.fa.fa-bookmark', { "class" : marked, "data-mindex" : module_index, onclick : ctrl.bookmarkToggle })
                                                                        ])
                                                                    }
                                                                }()),

                                                                m('h1.skinnyFont.m-t-lg.m-b-lg', module.title),
                                                                m('h3.skinnyFont.m-b-lg', module.about),
                                                                m('p', module.lastUpdated ),
                                                                m('p', module.dateCreated ),
                                                                m('ul.dashboardList.list-unstyled.m-t-lg', [
                                                                    module.links.map(function(link){
                                                                        return m('li', { "class" : link.css, 'data-type' : link.action , onclick : ctrl.loadLink } , link.title );
                                                                    })
                                                                ])
                                                            ]
                                                        ) ])
                                                    ])
                                                ]),
                                                (function(){
                                                    if(module.bookmarks.length > 0){
                                                        return m(".ht-column.no-resize.no-border", {'data-index' : -1, 'style' : "width:260px"},  [
                                                            m(".ht-widget.no-border", { config : ctrl.widgetInit, 'data-index' : -1, "style" : "height : 100%; padding: 15px;", "class" : "ui-widget ui-widget-content ui-helper-clearfix ht-inverted"}, [
                                                                m(".ht-widget-body", [ m("div.widget-body-inner",{ id : "dashboardwidget"+module.id }, [
                                                                        module.bookmarks.map(function(b){
                                                                            var status = "bg-opaque-white";
                                                                            if (b.open){ var status = "bg-"+b.color }
                                                                            return m(".ht-bookmark", { "class" : status , "data-mid" : b.id, onclick : ctrl.moduleViewToggle}, [
                                                                                m(".ht-bookmark-content", b.title)
                                                                            ])
                                                                        }),
                                                                        m(".ht-bookmark",{ style : "text-align: center;"}, m("i.fa.fa-plus"))
                                                                    ]
                                                                ) ])
                                                            ])
                                                        ])
                                                    }
                                                }()),
                                                module.columns.map(function(column, column_index, column_array){
                                                    if(column.widgets.length > 0 || column.new){
                                                        // If the view is not narrow in height show full.
                                                        return m(".ht-column", {'data-index' : column_index, 'style' : "width:"+column.width+"px"},  [
                                                            ( function(){
                                                                if (column.widgets.length > 0) {
                                                                    return column.widgets.map(function(widget, widget_index, widget_array){
                                                                        if(widget.display){
                                                                            return m(".ht-widget", { config : ctrl.widgetInit, 'data-index' : widget_index, 'data-id' : widget.id, "style" : "height : "+widget.height+"px", "class" : "ui-widget ui-helper-clearfix " +widget.css}, [
                                                                                (function(){
                                                                                    if(!widget.hideHeader){
                                                                                        return m(".ht-widget-header", [
                                                                                            widget.title,
                                                                                            m(".ht-widget-actions", [
                                                                                                m("i.fa.fa-expand.ht-widget-expand", { onclick : function(){ ctrl.expandWidget(module_index, column_index, widget_index );} } ),
                                                                                                (function(){
                                                                                                    if(widget.closable){
                                                                                                        return m("i.fa.fa-times.ht-widget-remove", { onclick : function(){ widget_array.splice(widget_index, 1); }});
                                                                                                    }
                                                                                                })()
                                                                                            ])
                                                                                        ]);
                                                                                    }
                                                                                })(),

                                                                                m(".ht-widget-body", [m("div.widget-body-inner",{ id : "widget"+widget.id, config : ctrl.reformat },
                                                                                    (function(){ console.log(widget.id, " was drawn."); return app[widget.type].view(ctrl.controllers[widget.id]);})()
                                                                                ) ])
                                                                            ]);
                                                                        }
                                                                    });
                                                                }
                                                            })()
                                                        ]);
                                                    }
                                                    // module_array[0].columns[0].widgets.splice(0,1);
                                                }),
                                                m(".ht-add-column", [
                                                    (function(){
                                                        if(module.columns.length > 0 && module.columns[module.columns.length-1].widgets.length  < 1){
                                                            return m(".add-column", { onclick : function(){ module.columns.pop() } }, [m("i.fa.fa-minus")], m("[id='ht-content']", { config : ctrl.reformat }));
                                                        } else {
                                                            return m(".add-column", { onclick : function(){ ctrl.addCol(module_index); } }, [m("i.fa.fa-plus")], m("[id='ht-content']", {config : ctrl.reformat }));
                                                        }
                                                    })()


                                                ])

                                            ])
                                        ])];
                                    }
                                }


                            })
                    ])
                ])
            ];

        }



    };
};


},{"../components/comments/comments":2,"../components/components/components":3,"../components/dashboard/dashboard":4,"../components/files/files":5,"../components/logs/logs":6,"../components/rescon/rescon":7,"../components/wiki/wiki":8}],2:[function(require,module,exports){
var logs = require('../logs/logs');

var comments = {};

// Load existing comments from server
//comments.List = m.request({method: "GET", url: "../components/comments/comments.json"});

// Comment Model, uses information from the App about User.
comments.comment = function(content){
    this.userid = 1;
    this.username = "Caner";
    this.content = content;
    this.date = new Date();
    this.show = true;
}

comments.controller = function (){
    var self = this;
    this.comments = m.prop("");
    m.request({method: "GET", url: "../components/comments/comments.json"}).then(this.comments);
    // Filter search term to use for filtering later.
    this.filterText = m.prop("");
    // Declare and empty setter for content of the comment to bind it to the form.
    this.content = m.prop("");
    // add comment
    this.add = function () {
        if(self.content()){
            // New comment
            self.comments().push(new comments.comment(self.content()));
            // Log this behavior by adding a new Log model
            logs.List().push(new logs.singleLog("comment", self.content()));
            // Reset the form for new comments.
            self.content("");
        }

    }
    // filtering
    this.filter = function (){
        var result;
        // If filtertext is set run filter
        if(self.filterText()){
            // Go through each comment
            self.comments().map(function(comment, index){
                var text = self.filterText().toLowerCase()
                result = comment.content.toLowerCase().indexOf(text);
                // Compare text
                if(result !== -1){
                    // If found, add to comment an attribute called cmshow
                    comment.show = true;
                } else {
                    // If not found, add to the comment and attribute called cmhide
                    comment.show = false;
                }
            });
        } else {
        // If filtertext is not set reset view to show everything
            self.comments().map(function(comment, index){
                comment.show = true;
            });
        }
    }
    this.runFilter = function(e){
        m.withAttr("value", self.filterText)(e);
        console.log(self.comments())
        self.filter();
    }
}

// Loads commenting form and list of comments
comments.view = function(ctrl){
    return m(".container-fluid", [m(".row", [
        m(".col-sm-12", [
            m(".col-xs-12[id='cm-comment']", [
                m("input.form-control.input-sm[placeholder='filter'][type='text']", { onkeyup: ctrl.runFilter, value : ctrl.filterText()} )
                 ]),
                m("hr"),
                m("[id='cm-boxWrapper']", [
                    m(".row", [
                        m(".col-xs-9", [
                            m("textarea.ht-comment-box", {onchange: m.withAttr("value", ctrl.content), value: ctrl.content()})
                        ]),
                        m(".col-xs-3", [
                            m("button.btn.btn-default.btn-block.btn-lg", {onclick: ctrl.add}, " Add ")
                        ])
                    ]),
                    m(".row", [
                        m(".col-xs-12[id='cm-commentList']", [
                            m("table.table.table-condensed", [
                                m("tbody", [
                                    ctrl.comments().map(function(comment, index){
                                        if(comment.show){
                                            return m("tr", [
                                                m("td", [
                                                    m("b", comment.username)
                                                ]),
                                                m("td", comment.content),
                                                m("td", [
                                                    m("span.text-muted", comment.date)
                                                ])
                                            ])
                                        }
                                    })
                                ])
                            ])
                        ])
                    ])
                ])
            ])
        ]),
        m(".col-sm-4.col-xs-12", [
            m("[id='cm-logs']", [

            ])
        ])
    ])
}

module.exports = comments;
},{"../logs/logs":6}],3:[function(require,module,exports){
var components = {};

components.html= m.prop("");
m.request({method: "GET", url: "../components/components/components.html", deserialize: function(value){ return value;  }}).then(components.html);

components.controller = function(){
    this.html = components.html;
}

components.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = components;
},{}],4:[function(require,module,exports){
var dashboard = {};

dashboard.html= m.prop("");
m.request({method: "GET", url: "../components/dashboard/dashboard.html", deserialize: function(value){ return value;  }}).then(dashboard.html);

dashboard.controller = function(){
    this.html = dashboard.html;
}

dashboard.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = dashboard;
},{}],5:[function(require,module,exports){
var files = {};

files.html= m.prop("");
m.request({method: "GET", url: "../components/files/files.html", deserialize: function(value){ return value;  }}).then(files.html);

files.controller = function(){
    this.html = files.html;
}

files.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = files;
},{}],6:[function(require,module,exports){

var logs = {};

// Assign model directly to loaded content
logs.List = m.prop("")
m.request({method: "GET", url: "../components/logs/logs.json"}).then(logs.List);

// Model for individual logs
logs.singleLog = function(logType, logContent){
    this.logText = "";
    switch(logType){
        case "comment" :
            this.logText =  " commented ";
            break;
        case "wiki" :
            this.logText = " changed wiki to version ";
            break;
    }
    this.logUserID = 1;
    this.logUser = "Caner";;
    this.logDate = new Date();
    this.logContent = logContent;
}

// Log actions, add log
logs.controller = function(){
    // This example is not using the m.prop getter and setter since direct javascript makes more sense for one time log writing.
    // Add log -- This gets fired in the controller when comment is being added. Will implement for wiki as well.

}

// Log layout, loads directly from the model, not through the controller.
logs.view = function(controller){
    return [
        m("table.table.table-condensed", [
            m("tbody", [
                logs.List().map(function(log, index){
                    return m("tr", [
                        m("td", [
                            m("span.text-muted", log.logDate)
                        ]),
                        m("td", [
                            m("a[href='user/1']", log.logUser),
                            " ",
                            m("span.logText", log.logText),
                            m("i", log.logContent),
                            ".\n                        "
                        ])
                    ])
                })

            ])
        ])
    ]
}

module.exports = logs;
},{}],7:[function(require,module,exports){
var rescon = {};

rescon.html= m.prop("");
m.request({method: "GET", url: "../components/rescon/rescon.html", deserialize: function(value){ return value;  }}).then(rescon.html);

rescon.controller = function(){
    this.html = rescon.html;
}

rescon.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = rescon;
},{}],8:[function(require,module,exports){
var wiki = {};

wiki.html= m.prop("");
m.request({method: "GET", url: "../components/wiki/wiki.html", deserialize: function(value){ return value;  }}).then(wiki.html);

wiki.controller = function(){
    this.html = wiki.html;
}

wiki.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = wiki;
},{}]},{},[1]);
