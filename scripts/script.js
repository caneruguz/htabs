(function(){
var totalWidth = 0;
var modules = []; // created on load and checked at every resize

    var build = {};

    // Get sample html content
    build.sample = m.prop("");
    var deserialize = function (value){
        return value;
    }
    m.request({method: "GET", url: "./component/sample.html", deserialize: deserialize}).then(build.sample);


    build.module = function(title, id, color, columns){
        if(!title){ title = "Module Title"};
        if(!id){ id = 1};
        this.id = id;
        this.title = title ;
        this.order = 1;
        this.color = color;
        this.columns = columns;
        this.minimize = false;
        this.exposeWidth = 300;
        this.exposeHeight = 300;
    }
    build.column = function(widgets){
        this.width = 400;
        this.widgets = widgets;
        this.new = false;
    }
    build.widget = function(title, content, iframeLink){
        if(!title){ title = "Widget Title"};
        if(!content) { content = "Lorem ipsum dolor sit amet"};
        if(!iframeLink) { iframeLink = "https://osf.io/ezcuj/wiki/home/"};
        this.title = title;
        this.content = content;
        this.expandable = false;
        this.closable = true;
        this.height = 300;
        this.display = true;
        this.iframeLink = iframeLink;

    }
    build.create = function(){
        // builds a modules views from the models. It can be loading it from database. In this case it's just building an example set.
        console.log(build.sample());
        return m.prop([
            new build.module("First Module", 1, "blue", [
                new build.column( [
                    new build.widget("Widget 1", build.sample()),
                    new build.widget("Widget 2"),
                    new build.widget("Widget 3")
                ]),
                new build.column([
                    new build.widget("Widget 4", "<iframe src='https://osf.io/ezcuj/wiki/home/'></iframe>"),
                    new build.widget("Widget 5", build.sample())
                ])
            ]),
            new build.module("Second Module", 2, "yellow", [
                new build.column( [
                    new build.widget("Widget 6"),
                    new build.widget("Widget 7")
                ]),
                new build.column([
                    new build.widget("Widget 8"),
                    new build.widget("Widget 9")
                ])
            ]),
            new build.module("Third Module", 3, "orange", [
                new build.column( [
                    new build.widget("Widget 10"),
                    new build.widget("Widget 11")
                ])
            ])
        ])
    }

    build.controller = function(){
        var self = this;
        this.modules = build.create();
        this.canReformat = true;
        this.exposeOn = false;
        this.localExpose = false;
        this.temp = { startIndex : 0, stopIndex : 0 , fromObj : {}, toObj : {}};
        this.narrow = false;
        this.updateSortable = function (){
            $(".ht-column" ).sortable({
                connectWith: ".ht-column",
                handle: ".ht-widget-header",
                placeholder: "ht-widget-placeholder",
                beforeStop: function( event, ui ) {
                    self.resizeWidgets();
                    //clearColumns();
                },
                start : function (event, ui){
                    self.temp.fromObj = {};
                    self.temp.toObj = {};
                    var from = {
                        module : ui.item.parent().parent().parent().attr('data-index'),
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    }
                    console.log("From", from)
                    self.temp.fromObj = from;

                },
                stop : function(event, ui){
                    var to = {
                        module : ui.item.parent().parent().parent().attr('data-index'),
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    }
                    console.log("To", to)
                    self.temp.toObj = to;

                    $('.ht-column').sortable( "cancel" );
                    self.moveWidget(self.temp.fromObj, self.temp.toObj);
                }
            });
        }
        this.beginExpose = function(){

            var headfinal = $(window).width();
            var wH = $(window).height();
            var wrapperH = wH-40;
            var tab = wrapperH-80;
            var adjheight = tab/2;
            var adjpadding = tab/4;
            $(".ghost-element").css('height', adjheight);

            // get size of all mods
            var modlens = 0; // full length of mods
            $('.ht-tab').each(function(i, item) {
                modlens += $(item).width() + 40;
            });

            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
                var modwidth = $('.ht-tab[data-id="'+o.id+'"]').width() +2; //  +2 compensates for border
                var width = (modwidth)/(modlens);
                var adjwidth = width*(headfinal-(40*self.modules().length)-adjpadding/2);
                o.exposeWidth = adjwidth;
                o.exposeHeight = adjheight;
            }
            $(".ghost-element").css('height', adjheight);
            self.localExpose = true;
            self.canReformat = false;
        }
        this.endExpose = function(){
            self.localExpose = false;
            self.canReformat = true;
        }
        this.moveWidget = function(from, to){


            // get widget from the from location
            var widget = self.modules()[from.module].columns[from.column].widgets[from.widget];

            /// if columns are different do as usual - same column number within different widgets also okay
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



            self.removeExtraCols();
            self.resizeWidgets();
            console.log(self.modules());
        }
        this.moveModule = function(from, to){
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
            m.redraw();
        }
        this.addModule = function() {
            // This will eventually be selected from lists
            self.modules().push(
                new build.module("Added Module", 4, "pink", [
                    new build.column( [
                        new build.widget("Widget 13"),
                        new build.widget("Widget 14")
                    ])
                ])
            )
            m.redraw();
            $('#ht-wrapper').scrollTo($('.ht-tab:last'), 150,  {offset:-50});

        }
        this.saveWorkspace = function () {
             console.log(self.modules());
        }
        this.reformat = function(){
            var headfinal = $(window).width(); // final width of the header taking into account the navbar
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
                self.resizeContent();
                // Size wrapper elements
                var wrapperH = wH-40;
                var tab = wrapperH-60;
                var content = tab-51;
                var column =  content-10;

                $('#ht-head').css({ width : headfinal + 'px' } );
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
                    $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : width+'%'});

                    // update column widths in the model
                    o.columns.map(function(item, index, array){
                        item.width = ($('.ht-tab[data-id="'+o.id+'"]').find('.ht-column[data-index='+index+']')).width();
                        console.log(item.width);
                    })
                }


            }
            self.resizeWidgets();

        }
        this.resizeContent = function(){
            var lensm = 2000;
            $.each(self.modules(), function(i, module) {
                   lensm += module.width + 40;
                });
            $('#ht-content').css('width', lensm +'px');
        }
        this.resizeWidgets = function() {
            // for each column
            $('.ht-column').each(function(){

                // get column height
                var setContentHeight = $(this).outerHeight();
                var contentHeight = $(this)[0].scrollHeight;

                // Total widgets height
                var totalHeight = 0;
                $(this).children('.ht-widget').each(function(){
                    totalHeight = totalHeight+$(this).outerHeight();
                })

                    // for each children calculate their relative heights;
                $(this).children('.ht-widget').each(function(){
                    var childHeight = $(this).height();
                    var newHeight;
                    if(setContentHeight < contentHeight){
                        newHeight = (childHeight/contentHeight)*setContentHeight;
                    } else {
                        newHeight = (childHeight/(totalHeight+25))*setContentHeight;
                    }
                    $(this).css({ height : newHeight}).find('.ht-widget-body').css({ height : newHeight-44});

                    // resize iframes
                    $(this).find('iframe').css({height : newHeight-60} );

                    // show hide based on element width
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
        this.removeModule = function(module_index){
            self.modules().splice(module_index, 1);
        }
        this.expandWidget = function(module, column, widget){
            // create a column after this column
            self.modules()[module].columns.splice(column+1,0, new build.column([]));
            // move widget to this column
            var from = { module : module, column : column, widget : widget}
            var to = { module : module, column : column+1, widget : 0}
            self.moveWidget(from, to);
        }
        this.addCol= function (module_index){
            // is there an empty column?
            var empty = false;
            self.modules()[module_index].columns.map(function(item) {
                if(item.widgets.length < 1 ){
                    empty = true;
                }
            });
            if(!empty){
                self.modules()[module_index].columns.push(new build.column([]))
                self.updateSortable();
                self.reformat();
                m.redraw();
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

        this.init = function(){
            // Bind jquery events that we couldn't move to mithril
            //self.buildScroll();
            self.resizeContent();
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



        }
        this.exposeInit = function(){
            $(".expose-content").sortable({
                placeholder: "ghost-element ht-tab ui-state-default",
                beforeStop : function(event, ui){
                    self.temp.stopIndex = ui.item.index();
                    $( ".expose-content").sortable( "cancel" );
                    self.moveModule(self.temp.startIndex, self.temp.stopIndex);
                },
                start : function(event, ui){
                    self.temp.startIndex = ui.item.index();
                }

            })
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
                            m('.expose-button', { onclick : ctrl.saveWorkspace},  [ m('i.fa.fa-save'), m("span", "Save Workspace")]),
                        ])

                    ])

                ])
            ]
        } else {
            return [
                m("", { style: {"position": "absolute", "right": "0", "top": "0"}}, [
                    m("div.pull-right", [
                        m("button.btn.btn-primary.exposeOpen",  {onclick : ctrl.beginExpose }, [m('.i.fa.fa-th-large')]),
                        m("button.btn.btn-success",  {onclick : ctrl.addModule }, [m('.i.fa.fa-plus')] )

                    ])
                ]),
                m("[id='ht-head']", [
                    ctrl.modules().map(function(module, module_index, module_array){
                        return m(".ht-hdiv.bg-"+module.color, { "data-hid" : module.id}, [m("span.ht-hdiv-content", module.title)] );

                    })
                ]),
                m(".ht-slider-wrap", [m("[id='ht-slider']")]),
                m("[id='ht-wrapper']", { config : ctrl.init }, [
                    m("[id='ht-content']", [
                            ctrl.modules().map(function(module, module_index, module_array){
                                if(module.minimize){
                                    return [" ", m(".ht-tab.ht-tab-minimized.ht-light-shadow", {'data-index' : module_index, 'data-id' : module.id}, [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                m("i.fa.fa-plus", { onclick : function(){ module.minimize = false; }})
                                            ])
                                        ]),
                                        m(".ht-tab-content", [m("h3.rotate.rotatedText", module.title)])
                                    ])]
                                }else {
                                    return [" ", m(".ht-tab.ht-light-shadow.animated.fadeIn", {'data-index' : module_index,  'data-id' : module.id}, [
                                        m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                            m("h3", module.title),
                                            m(".ht-windowBtn", [
                                                m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                m("i.fa.fa-minus", { onclick : function(){ module.minimize = true }})
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
                                                                        return m(".ht-widget", { 'data-index' : widget_index, "style" : "height : "+widget.height+"px"}, [
                                                                            m(".ht-widget-header", [
                                                                                widget.title,
                                                                                m(".ht-widget-actions", [
                                                                                    m("i.fa.fa-expand.ht-widget-expand", { onclick : function(){ ctrl.expandWidget(module_index, column_index, widget_index ) } } ),
                                                                                    (function(){
                                                                                        if(widget.closable){
                                                                                            return m("i.fa.fa-times.ht-widget-remove", { onclick : function(){ widget_array.splice(widget_index, 1);  ctrl.removeExtraCols(); }})
                                                                                        }
                                                                                    })()
                                                                                ])
                                                                            ]),
                                                                            m(".ht-widget-body", [m("div.widget-body-inner", [m("", m.trust(
                                                                                    // widget.content
                                                                                    build.sample()
                                                                            ))])] )
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

    m.module(document.body, build);






})();
