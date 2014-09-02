(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var app = {}; // Create a namespace for the entire app

// Load components and add them to the app namespace
app.logs = require('../components/logs/logs');
app.dashboard = require('../components/dashboard/dashboard');
app.comments = require('../components/comments/comments');
app.wiki = require('../components/wiki/wiki');

   // buildnormal
   // buildmobile


   // Initialize the mithril application module. -- this will be broken down in larger implementation
    var build = {};

    build.workspace = m.prop("");
    m.request({method: "GET", url: "../workspace.json"}).then(build.workspace).then(function(){     m.module(document.body, build);    });

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
                    var oldH = ui.originalSize.height;
                    var newH = ui.size.height;
                    if(newH !== oldH){
                        console.log(oldH, newH);
                        console.log($(event.target).parent());
                        var column = $(event.target).parent();
                        var setContentHeight = column.outerHeight(); // Height of the column
                        var contentHeight = column[0].scrollHeight; // Get content height, if item is not scrolling this will be same as setContentHeight, otherwise it will be bigger.
                        // Calculate Total widgets height -- this is in case widgets end up not covering the entire height of the column.
                        var totalHeight = 0;
                        column.children('.ht-widget').each(function(){
                            totalHeight = totalHeight+$(this).outerHeight();
                        });

                        // for each children calculate their relative heights so that we fill the column proportionally to the existing heights of the widgets ;
                        column.children('.ht-widget').each(function(){
                            var childHeight = $(this).height();
                            var newHeight;
                            if(setContentHeight < contentHeight){
                                newHeight = (childHeight/contentHeight)*setContentHeight;
                            } else {
                                newHeight = (childHeight/(totalHeight+25))*setContentHeight;
                            }
                            $(this).css({ height : newHeight}).find('.ht-widget-body').css({ height : newHeight-44});
                        });
                    }

                }
            } );
            $('.ht-column').resizable({
                handles : "e",
                minWidth : 160,
                stop : function (){
                    self.saveColumnSize();
                    self.reformatWidth();
                }
            } );

            $(".ht-column" ).sortable({
                connectWith: ".ht-column",      // So that we can move widgets between other columns.
                handle: ".ht-widget-header",    // Grab from the header div only.
                containment: "#ht-content",
                cursor : "move",
                opacity : 0.7,
                helper : 'clone',
                placeholder: "ht-widget-placeholder",
                start : function (event, ui){   // The only outcome of this is to get the widget that is being moved i.e. from
                    ui.helper.css({
                        width: 200,
                        height: 200,
                        overflow : 'hidden'
                    });
                    self.temp.fromObj = {};     // empty temp objects so we don't use any of these values accidentally
                    self.temp.toObj = {};
                    var from = {
                        module : ui.item.parent().parent().parent().attr('data-index'),
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    };
                    self.temp.fromObj = from; // assign the from object
                },
                stop : function(event, ui){     // get the widget placement that we want the original widget to drop to
                    var to = {
                        module : ui.item.parent().parent().parent().attr('data-index'), // ui returns the same widget but the indexes and placement has changed.
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    };
                    self.temp.toObj = to; // Assign the to object, this is not strictly necessary since we use it right away below

                    $('.ht-column').sortable( "cancel" );       // Stop sortable from actually sorting, leave this to mithril because we changed the observable model
                    self.moveWidget(self.temp.fromObj, self.temp.toObj); // Move the widget
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
            self.resizeWidgets();


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
            self.resizeWidgets();

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
            // console.log("widget moved", from, to);
            // console.log(self.modules());
            m.redraw();
            self.reformatWidth();   // We need to redo sizes. Maybe we should push this to resize Widgets.
            self.resizeWidgets(); // After moving we will need to readjust the heights of the widgets
        };
        this.resizeWidgets = function() {
                // console.log("resize running");
            $('.ht-column').each(function(){   // Iterate over colummns, we don't need to use jquery to iterate but doesn't harm.
               var setContentHeight = $(this).outerHeight(); // Height of the column
                var contentHeight = $(this)[0].scrollHeight; // Get content height, if item is not scrolling this will be same as setContentHeight, otherwise it will be bigger.
                // Calculate Total widgets height -- this is in case widgets end up not covering the entire height of the column.
                var totalHeight = 0;
                $(this).children('.ht-widget').each(function(){
                    totalHeight = totalHeight+$(this).outerHeight();
                });

                // for each children calculate their relative heights so that we fill the column proportionally to the existing heights of the widgets ;
                $(this).children('.ht-widget').each(function(){
                    var childHeight = $(this).height();
                    var newHeight;
                    if(setContentHeight < contentHeight){
                        newHeight = (childHeight/contentHeight)*setContentHeight;
                    } else {
                        newHeight = (childHeight/(totalHeight+25))*setContentHeight;
                    }
                    $(this).css({ height : newHeight}).find('.ht-widget-body').css({ height : newHeight-44});

                    // While we are within widgets do other relevant things
                    // resize iframes
                    $(this).find('iframe').css({height : newHeight-60} );

                    // show hide based on element width -- TODO: move this to higher level
                    var width =  $(this).width();
                    $(this).find('.ht-w-s').hide();
                    $(this).find('.ht-w-m').hide();
                    $(this).find('.ht-w-l').hide();
                    if(width > 600){
                        $(this).find('.ht-w-l').show();
                    }
                    if(width > 300 && width <= 600){
                        $(this).find('.ht-w-m').show();
                    }
                    if(width <= 300 ){
                        $(this).find('.ht-w-s').show();
                    }
                });

            });
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
            var windowWidth = $(window).width();
            var windowHeight = $(window).height();
            var wrapperHeight = windowHeight-40;
            var tab = wrapperHeight-80;
            var adjheight = tab/2;
            var adjpadding = tab/4;
            $(".ghost-element").css('height', adjheight);
            // get size of all modules
            var modlens = 0; // full length of modules
            $('.ht-tab').each(function(i, item) {
                modlens += $(item).width() + 40;
            });

            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
                var modwidth = $('.ht-tab[data-id="'+o.id+'"]').width() +2; //  +2 compensates for border
                var width = (modwidth)/(modlens);   // The ratio of this module over all modules
                var adjwidth = width*(windowWidth-(40*self.modules().length)-adjpadding/2); // calculate width, taking into account proper padding
                o.exposeWidth = adjwidth; // assign the new widths to the model object
            }
            $(".ghost-element").css('height', adjheight);
            self.localExpose = true; // We can run expose in mithril view
            self.canReformat = false; // Deactivate reformatting -- is this still necessary? yes but because we are using the same tab classes. Keep it for now.
            console.log(self.canReformat);
        };
        this.endExpose = function(){
            // Return view to normal
            self.localExpose = false;
            self.canReformat = true;
        };

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
            // This will eventually be selected from lists
            self.modules().push(
                new build.module("Added Module", 4, "pink", [
                    new build.column(620, [
                        new build.widget(6, "Widget 13"),
                        new build.widget(7, "Widget 14")
                    ])
                ])
            );
            self.applyModules();
            self.temp.scrollTo = '.ht-tab[data-id="4"]';

        };
        this.removeModule = function(module_index){
            // unload, turn events off etc.
            self.modules().splice(module_index, 1);
            self.reformatWidth();
        };
        this.toggleModule = function(index, state){
            self.modules()[index].minimize = state;
            m.redraw();
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
                self.modules()[module_index].columns.push({ width: 400, widgets : [], new : true});
                self.eventsOn();
                self.reformatWidth();
                self.temp.scrollTo = '.ht-tab[data-index="'+module_index+'"] > .ht-tab-content > .ht-column:last';
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
                window_width = $(window).width();
                var totalLength = 20; // Padding of the content tab
                $('.ht-tab').each(function(){
                    totalLength += $(this).outerWidth()+24; // 20px padding, 2 pixel borders, + 2 for something I don't know ??
                });
                var ht_head_width = window_width -75; // allowing room for expose buttons, element width is 75px
                // var ht_head_width = window_width -500; // allowing room for expose buttons, element width is 75px
                var ht_content_width = totalLength;
            
                $('#ht-head').css({ width : ht_head_width + 'px' } );
                $('#ht-wrapper').css({ width : window_width + 'px' } );
                $('#ht-content').css('width', ht_content_width + 'px'); 

                // Adjust slider on changes

                $('#ht-slider').width( Math.pow(window_width, 2) / $('#ht-content').width() + 'px') // 
                    .css('left', $('#ht-wrapper').scrollLeft() * $('#ht-head').width()/$('#ht-content').width() + 'px');
                
                // $('.ht-slider-wrap').css('width', ht_head_width + 'px');
                for(var i = 0; i < self.modules().length; i++){
                        var o = self.modules()[i];
                        // +40 = fix for margin space
                        // if window width is bigger then adjust to the window width, otherwise content width

                        var use_width = (window_width > ht_content_width) ? window_width : ht_content_width;
                        // use width is width of the whole page 
                        
                        var width = (($('.ht-tab[data-id="'+o.id+'"]').outerWidth()))/(use_width)*100
                        $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : width+'%'});
                        // update column widths in the model
                    }
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
                var ht_tab_content_height = ht_tab_height-51;
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
        this.widgetInit = function() {
            if (self.temp.scrollTo) {
                $('#ht-wrapper').scrollTo($(self.temp.scrollTo), 150, {offset: -50});
                self.temp.scrollTo = "";
            }
            console.log("widgetInit ran");
        }

        self.saveColumnSize = function(){
            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
                o.columns.map(function(item, index, array){
                item.width = ($('.ht-tab[data-id="'+o.id+'"]').find('.ht-column[data-index='+index+']')).width();
            });
        }
        };
    };



    build.view = function(ctrl){

        if(ctrl.localExpose){
            return [
                m("#exposeDiv.animated.fadeIn", [
                    m(".exposeClose", [m("i.fa.fa-times", { onclick : ctrl.endExpose })]),
                    m(".expose-content", { config : ctrl.exposeInit } , [
                        m(".expose-modules", [
                            ctrl.modules().map(function(module, module_index, module_array){
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
                                }else {
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
                           return m(".ht-hdiv.bg-"+module.color, { "data-hid" : module.id}, [m("span.ht-hdiv-content", module.title)] );

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
                                if(module.minimize){
                                    return [" ", m(".ht-tab.ht-tab-minimized.ht-light-shadow", { 'data-index' : module_index, 'data-id' : module.id}, [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                m("i.fa.fa-plus", { onclick : function(){ ctrl.toggleModule(module_index, false );} } )
                                            ])
                                        ]),
                                        m(".ht-tab-content", [m("h3.rotate.rotatedText", module.title)])
                                    ])];
                                }else {
                                    return [" ",  m(".ht-tab.ht-light-shadow", { 'class' : module.css, 'data-index' : module_index,  'data-id' : module.id} , [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m("h3", module.title),
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-minus", { onclick : function(){ ctrl.toggleModule(module_index, true );}}),
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }})
                                            ])
                                        ]),
                                        m(".ht-tab-content", [
                                            module.columns.map(function(column, column_index, column_array){
                                                if(column.widgets.length > 0 || column.new){
                                                    // If the view is not narrow in height show full.
                                                    return m(".ht-column", {'data-index' : column_index, 'style' : "width:"+column.width+"px"},  [
                                                        ( function(){
                                                            if (column.widgets.length > 0) {
                                                                return column.widgets.map(function(widget, widget_index, widget_array){
                                                                    if(widget.display){
                                                                        return m(".ht-widget", { config : ctrl.widgetInit, 'data-index' : widget_index, "style" : "height : "+widget.height+"px", "class" : "ui-widget ui-widget-content ui-helper-clearfix " +widget.css}, [
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
                                                    console.log(module.columns[module.columns.length-1]);
                                                    if(module.columns[module.columns.length-1].new){
                                                        return m(".add-column", { onclick : function(){ module.columns.pop() } }, [" ",m("i.fa.fa-minus")," "], m("[id='ht-content']", { config : ctrl.reformat }));
                                                    } else {
                                                        return m(".add-column", { onclick : function(){ ctrl.addCol(module_index); } }, [" ",m("i.fa.fa-plus")," "], m("[id='ht-content']", {config : ctrl.reformat }));
                                                    }
                                                })()


                                            ])

                                        ])
                                    ])];
                                }

                            })
                    ])
                ])
            ];

        }



    };



},{"../components/comments/comments":2,"../components/dashboard/dashboard":3,"../components/logs/logs":4,"../components/wiki/wiki":5}],2:[function(require,module,exports){
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
},{"../logs/logs":4}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){

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
},{}],5:[function(require,module,exports){
var logs = require('../logs/logs');

var wiki = {};

wiki.data = m.prop({});
m.request({method: "GET", url: '../components/wiki/wiki.json'}).then(wiki.data)

wiki.model = function(){
    this.title = m.prop(wiki.data().title);
    this.content = m.prop(wiki.data().content);
    this.version = m.prop(wiki.data().version)
}
// Long way of binding the data to view
wiki.controller = function(){
    var self = this;
    this.title = m.prop(wiki.data().title);
    this.content = m.prop(wiki.data().content);
    this.version = m.prop(wiki.data().version);

    this.edit = m.prop(false);


    this.toggleView = function(){
        if(self.edit()){
            // save
            self.version(self.version()+1);
            logs.List().push(new logs.singleLog("wiki", self.version()));
            self.edit(false);
        } else {

            self.edit(true);
        }
    }
    return self;
}

// Wiki html
wiki.view = function (controller) {
    if(controller.edit()){
        return m(".panel.panel-default",  [
            m(".panel-heading", [
                m(".row", [
                    m(".col-md-9", [
                        m("span", "Change Title: "), m("input.form-control", { onchange: m.withAttr("value", controller.title), value: controller.title()} )
                    ]),
                    m(".col-md-3.cm-wikiBar", [
                        m(".btn-group", [
                            m("button.btn.btn-sm.btn-default[type='button']",{ onclick : controller.toggleView },  m("i.fa.fa-save", " Save"))
                        ])
                    ])
                ])
            ]),
            m(".panel-body", [
                m("textarea.ht-wiki-edit", { onchange: m.withAttr("value", controller.content), value: controller.content()} )
            ])
        ])
    } else {
        return m(".panel", [
            m(".panel-heading", [
                m(".row", [
                    m(".col-md-9", [
                        m("h2.panel-title", controller.title())
                    ]),
                    m(".col-md-3.cm-wikiBar", [
                        m(".btn-group", [
                            m("button.btn.btn-sm.btn-default[type='button']",{ onclick : controller.toggleView }, m("i.fa.fa-pencil", " Edit"))
                        ])
                    ])
                ])
            ]),
            m(".panel-body", [
                m("p#wiki-preview", controller.content())
            ]),
            m(".panel-footer", " Version " + controller.version())
        ])
    }


};

module.exports = wiki;
},{"../logs/logs":4}]},{},[1]);
