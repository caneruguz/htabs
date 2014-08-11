var logs = require('../components/logs/logs');
var dashboard = require('../components/dashboard/dashboard');
var comments = require('../components/comments/comments')
var wiki = require('../components/wiki/wiki')

// Initialize the mithril application module. -- this will be broken down in larger implementation
    var build = {};
//    // Get sample html content
//    build.sample = m.prop("");
//    m.request({method: "GET", url: "./component/sample.html", deserialize: function(value){ return value;  }}).then(build.sample);

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
    }
    // Column Model
    build.column = function(width, widgets){
        this.width = width;
        this.widgets = widgets ;
        this.new = false;
    }
    // Widget Model
    build.widget = function(title, content, iframeLink, hideHeader ){
        this.title = title || "Widget Title";
        this.content = content || "Lorem ipsum dolor sit amet";
        this.expandable = false;
        this.closable = true;
        this.height = 300;
        this.display = true;
        this.iframeLink = iframeLink || "https://osf.io/ezcuj/wiki/home/";
        this.hideHeader = hideHeader;
        this.type = "normal"
    }

     // Controller
     build.controller = function(){
        var self = this;  // use self for binding inner scopes:
        this.modules = build.workspace; // Assign modules to the model we created. observableness is set in the create function.

        this.canReformat = true;    // turn reformating on or off, sometimes we want formating to not be triggered.
        this.localExpose = false;   // turn expose mode on or off, helps rending expose mode as pure mithril view.
        this.temp = { startIndex : 0, stopIndex : 0 , fromObj : {}, toObj : {}}; // Temporary variables so that jquery ui functions can send variables to each other. Is there a better way for this?

        this.init = function(){
            // Bind jquery events that we couldn't move to mithril
            self.reformat();
            self.updateSortable();
            $( ".ht-widget" ).addClass( "ui-widget ui-widget-content ui-helper-clearfix" )
            $('.ht-widget').resizable({
                handles : "s",
                minHeight: 100,
                containment : "parent",
                stop : function (){
                    self.resizeWidgets();
                }
            } );
            $('.ht-column').resizable({
                handles : "e",
                minWidth : 160,
                stop : function (){
                    self.resizeWidgets();
                    self.reformat();
                }
            } );
            $(window).resize(self.reformat);
            $(document).on('click', '.ht-hdiv', function(){
                var id = $(this).attr('data-hid');
                $('#ht-wrapper').scrollTo($('.ht-tab[data-id="'+id+'"]'), 150,  {offset:-50});
            })
            // Scroller is its own jquery plugin now.
            $('#ht-slider').scroller({ scrollWrapper: "#ht-wrapper", complete : function(){ console.log("Scroller Completed!")} })

            // Key listeners
            $(document).keyup(function(e) {
                // ESC
                if (e.keyCode == 27) {
                    if(self.localExpose == true ) {
                        self.localExpose = false;
                        m.redraw();
                    }
                }
                if(e.keyCode >  48 && e.keyCode < 58){
                    console.log(e.keyCode);
                    var index = e.keyCode - 49;
                    $('#ht-wrapper').scrollTo($('.ht-tab[data-index="'+index+'"]'), 150,  {offset:-50});
                }
            });

            //Load Widgets
            self.modules().map(function(module, module_index, module_array){
                module.columns.map(function(column, column_index, column_array){
                    column.widgets.map(function(widget, widget_index, widget_array){
                        if(!widget.loaded){
                            widget.loaded = true;
                            switch(widget.type){
                                case "dashboard":
                                    var myDash = new dashboard.controller();
                                    m.render(document.getElementById("widget"+widget.id), dashboard.view(myDash))
                                    break;
                                case "wiki" :
                                    m.module(document.getElementById("widget"+widget.id), wiki );
                                    break;
                                case "comment" :
                                    m.module(document.getElementById("widget"+widget.id), comments );
                                    break;
                                case "activity" :
                                    m.module(document.getElementById("widget"+widget.id), logs );
                                    break;
                                default :
                                    break;
                            }
                        }
                        self.resizeWidgets();

                    })
                })
            })
        }

        // WIDGETS
        // When widgets are moved we need to update the model itself with the changes.
        this.updateSortable = function (){
            $(".ht-column" ).sortable({
                connectWith: ".ht-column",      // So that we can move widgets between other columns.
                handle: ".ht-widget-header",    // Grab from the header div only.
                placeholder: "ht-widget-placeholder",
                start : function (event, ui){   // The only outcome of this is to get the widget that is being moved i.e. from
                    self.temp.fromObj = {};     // empty temp objects so we don't use any of these values accidentally
                    self.temp.toObj = {};
                    var from = {
                        module : ui.item.parent().parent().parent().attr('data-index'),
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    }
                    self.temp.fromObj = from; // assign the from object

                },
                stop : function(event, ui){     // get the widget placement that we want the original widget to drop to
                    var to = {
                        module : ui.item.parent().parent().parent().attr('data-index'), // ui returns the same widget but the indexes and placement has changed.
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    }
                    self.temp.toObj = to; // Assign the to object, this is not strictly necessary since we use it right away below

                    $('.ht-column').sortable( "cancel" );       // Stop sortable from actually sorting, leave this to mithril because we changed the observable model
                    self.moveWidget(self.temp.fromObj, self.temp.toObj); // Move the widget
                }
            });
        }
        this.moveWidget = function(from, to){
            // modules >  column >  widget   modules[0].column[1].widget[1]
            // get widget from the from location
            var widget = self.modules()[from.module].columns[from.column].widgets[from.widget];
            /// if columns are different do as usual - same column number within different widgets also okay
            widget.loaded = false;
            console.log(self.modules()[to.module].columns[to.column].widgets);
            if(from.module !== to.module || from.column !== to.column){
                // add it to the to location
                self.modules()[to.module].columns[to.column].widgets.splice(to.widget,0,widget);
                // remove original widget
                self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);
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
            self.removeExtraCols(); // After moving a widget is a column is empty delete it.
            self.resizeWidgets(); // After moving we will need to readjust the heights of the widgets
        }
        this.resizeWidgets = function() {
            $('.ht-column').each(function(){   // Iterate over colummns, we don't need to use jquery to iterate but doesn't harm.
               var setContentHeight = $(this).outerHeight(); // Height of the column
                var contentHeight = $(this)[0].scrollHeight; // Get content height, if item is not scrolling this will be same as setContentHeight, otherwise it will be bigger.
                // Calculate Total widgets height -- this is in case widgets end up not covering the entire height of the column.
                var totalHeight = 0;
                $(this).children('.ht-widget').each(function(){
                    totalHeight = totalHeight+$(this).outerHeight();
                })

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
                })

            })
        }
        this.expandWidget = function(module, column, widget){
            // create a column after this column
            self.modules()[module].columns.splice(column+1,0, new build.column(620, []));
            // move widget to this column
            var from = { module : module, column : column, widget : widget}
            var to = { module : module, column : column+1, widget : 0}
            self.moveWidget(from, to);
        }
        // EXPOSE
        this.exposeInit = function(){
            $(".expose-modules").sortable({
                placeholder: "ghost-element ht-tab ui-state-default",
                beforeStop : function(event, ui){
                    console.log(ui.item.index());
                    self.temp.stopIndex = ui.item.index();
                    $( ".expose-modules").sortable( "cancel" );
                    console.log("Start", self.temp.startIndex, "Stop", self.temp.stopIndex )
                    self.moveModule(self.temp.startIndex, self.temp.stopIndex);
                },
                start : function(event, ui){
                    self.temp.startIndex = ui.item.index();
                }

            })
        }
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
                o.exposeHeight = adjheight;
            }
            $(".ghost-element").css('height', adjheight);
            self.localExpose = true; // We can run expose in mithril view
            self.canReformat = false; // Deactivate reformatting -- is this still necessary? yes but because we are using the same tab classes. Keep it for now.
        }
        this.endExpose = function(){
            // Return view to normal
            self.localExpose = false;
            self.canReformat = true;
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
        }
        this.addModule = function() {
            // This will eventually be selected from lists
            self.modules().push(
                new build.module("Added Module", 4, "pink", [
                    new build.column(620, [
                        new build.widget("Widget 13"),
                        new build.widget("Widget 14")
                    ])
                ])
            )
            m.redraw();
            $('#ht-wrapper').scrollTo($('.ht-tab:last'), 150,  {offset:-50});
        }
        this.removeModule = function(module_index){
            self.modules().splice(module_index, 1);
        }

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
                self.updateSortable();
                self.reformat();
                //m.redraw();
            }
        }
        this.removeExtraCols = function(){
            self.modules().map(function(modules, modules_index){
                modules.columns.map(function(column, column_index, array){
                    if(column.widgets < 1){
                        array.splice(column_index, 1);
                    }
                })
            })
            m.redraw();
        }

        // LAYOUT and INIT
        this.saveWorkspace = function () {
             console.log(self.modules());
        }
        this.reformat = function(){
            var headfinal = $(window).width();
            var wH = $(window).height();
            // resize ht-content based on module length
            var totalLength = 0;
            $('.ht-tab').each(function(){
                totalLength += $(this).outerWidth()+100;
            })
            $('#ht-content').css('width', totalLength + 'px')

            if(wH < 500){
                self.canReformat = false;
            } else {
                self.canReformat = true;
            }
            if(self.canReformat){
                var lensm = 2000;
                $.each(self.modules(), function(i, module) {
                    lensm += module.width + 40;
                });
                $('#ht-content').css('width', lensm +'px');
                // Size wrapper elements
                var wrapperH = wH-45; // Remaining elements height is 45px, ht-head and ht-slider-wrap
                var tab = wrapperH-35; // wrapping parent ht-content has a total of 20px padding on top and bottom with additional 15px for the scroll bars;
                var content = tab-51;
                var column =  content-10;
                var head = headfinal -75; // allowing room for expose buttons, element width is 75px
                $('#ht-head').css({ width : head + 'px' } );
                $('#ht-wrapper').css({ width : headfinal + 'px', height: wrapperH + "px" } );
                $('.ht-tab').css({ height: tab + 'px'});
                $('.ht-tab-content').css({ height: content+'px'});
                $('.ht-column').css({height: column});
                $('.ht-add-column').css({height: column});
                // Adjust slider on changes
                $('#ht-slider').width( Math.pow(headfinal, 2) / $('#ht-content').width() + 'px')
                    .css('left', $('#ht-wrapper').scrollLeft() * $('#ht-head').width()/$('#ht-content').width() + 'px');
                // Resize header modules
                for(var i = 0; i < self.modules().length; i++){
                    var o = self.modules()[i];
                    var contentWidth = $('#ht-content').width();  // width of the module
                    var headWidth = $('#ht-head').width();
                    // +40 = fix for margin space
                    var width = ($('.ht-tab[data-id="'+o.id+'"]').width()+40)/contentWidth*100;
                    $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : (width-1)+'%'});
                    // update column widths in the model
                    o.columns.map(function(item, index, array){
                        item.width = ($('.ht-tab[data-id="'+o.id+'"]').find('.ht-column[data-index='+index+']')).width();
                    })
                }
            }
            self.resizeWidgets();
        }

    }

    build.view = function(ctrl){
        if(ctrl.localExpose){
            return [
                m("#exposeDiv.animated.fadeIn", [
                    m(".exposeClose", [m("i.fa.fa-times", { onclick : ctrl.endExpose })]),
                    m(".expose-content", { config : ctrl.exposeInit } , [
                        m(".expose-modules", [
                            ctrl.modules().map(function(module, module_index, module_array){
                                if(module.minimize){
                                    return [" ", m(".ht-tab.ht-tab-minimized.ht-dark-shadow", {'data-index' : module_index, 'data-id' : module.id, style : "height : " + module.exposeHeight}, [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                m("i.fa.fa-plus", { onclick : function(){ module.minimize = false; }})
                                            ])
                                        ]),
                                        m(".ht-tab-content", [m("h3.rotate.rotatedText", module.title)])
                                    ])]
                                }else {
                                    return [" ", m(".ht-tab.ht-dark-shadow", {'data-index' : module_index,  'data-id' : module.id, style : "min-width: 0; width: "+module.exposeWidth+"px; height : "+module.exposeHeight   +"px; " }, [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m("h3", module.title),
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                m("i.fa.fa-minus", { onclick : function(){ module.minimize = true }})
                                            ])
                                        ]),
                                        m(".ht-tab-content", [ m("") ])

                                    ])]
                                }
                            })
                        ]),
                        m('.expose-actions', [
                            m('.expose-button', { onclick : ctrl.saveWorkspace},  [ m('i.fa.fa-save'), m("span", "Save Workspace")])
                        ])

                    ])

                ])
            ]
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
                    m("[id='ht-content']", [
                            ctrl.modules().map(function(module, module_index, module_array){
                                if(module.minimize){
                                    return [" ", m(".ht-tab.ht-tab-minimized.ht-light-shadow", {  'data-index' : module_index, 'data-id' : module.id}, [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                m("i.fa.fa-plus", { onclick : function(){ module.minimize = false; }})
                                            ])
                                        ]),
                                        m(".ht-tab-content", [m("h3.rotate.rotatedText", module.title)])
                                    ])]
                                }else {
                                    return [" ", m(".ht-tab.ht-light-shadow.animated.fadeIn", {'class' : module.css, 'data-index' : module_index,  'data-id' : module.id}, [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m("h3", module.title),
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                m("i.fa.fa-minus", { onclick : function(){ module.minimize = true }})
                                            ])
                                        ]),
                                        m(".ht-tab-content", [
                                            module.columns.map(function(column, column_index, column_array){
                                                console.log(column);
                                                if(column.widgets.length > 0 || column.new){
                                                    // If the view is not narrow in height show full.
                                                    return m(".ht-column", {'data-index' : column_index, 'style' : "width:"+column.width+"px"},  [
                                                        ( function(){
                                                            if (column.widgets.length > 0) {
                                                                return column.widgets.map(function(widget, widget_index, widget_array){
                                                                    if(widget.display){
                                                                        return m(".ht-widget", { 'data-index' : widget_index, "style" : "height : "+widget.height+"px", "class" : widget.css}, [
                                                                            (function(){
                                                                                if(!widget.hideHeader){
                                                                                    return m(".ht-widget-header", [
                                                                                        widget.title,
                                                                                        m(".ht-widget-actions", [
                                                                                            m("i.fa.fa-expand.ht-widget-expand", { onclick : function(){ ctrl.expandWidget(module_index, column_index, widget_index ) } } ),
                                                                                            (function(){
                                                                                                if(widget.closable){
                                                                                                    return m("i.fa.fa-times.ht-widget-remove", { onclick : function(){ widget_array.splice(widget_index, 1);  ctrl.removeExtraCols(); }})
                                                                                                }
                                                                                            })()
                                                                                        ])
                                                                                    ])
                                                                                }
                                                                            })(),

                                                                            m(".ht-widget-body",  [m("div.widget-body-inner",{ id : "widget"+widget.id}, "") ])

                                                                        ])

                                                                    }

                                                                })
                                                            }
                                                        })()
                                                    ])

                                                }
                                                // module_array[0].columns[0].widgets.splice(0,1);
                                            }),
                                            m(".ht-add-column", [
                                                m(".add-column", { onclick : function(){ ctrl.addCol(module_index); } }, [" ",m("i.fa.fa-plus")," "])
                                            ])

                                        ])
                                    ])]
                                }

                            })
                    ])
                ])
            ];

        }



    }


