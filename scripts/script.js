(function(){
var totalWidth = 0;
var modules = []; // created on load and checked at every resize

    var build = {};

    // Get sample html content
    build.sample = m.prop("");
    var deserialize = function (value){
        return value;
    }
    m.request({method: "GET", url: "sample.html", deserialize: deserialize}).then(build.sample);


    build.module = function(title, id, color, columns){
        if(!title){ title = "Module Title"};
        if(!id){ id = 1};
        this.id = id;
        this.title = title ;
        this.order = 1;
        this.color = color;
        this.columns = columns;
        this.minimize = false;
    }
    build.column = function(widgets){
        this.width = 400;
        this.widgets = widgets;
        this.new = true;
    }
    build.widget = function(title){
        if(!title){ title = "Widget Title"}
        this.title = title;
        this.content = "Lorem ipsum dolor sit amet";
        this.expandable = false;
        this.closable = true;
        this.height = 300;
        this.display = true;
    }
    build.create = function(){
        // builds a modules views from the models. It can be loading it from database. In this case it's just building an example set.
        return m.prop([
            new build.module("First Module", 1, "blue", [
                new build.column( [
                    new build.widget("Widget 1"),
                    new build.widget("Widget 2"),
                    new build.widget("Widget 3")
                ]),
                new build.column([
                    new build.widget("Widget 4"),
                    new build.widget("Widget 5")
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
        this.updateSortable = function (){
            $(".ht-column" ).sortable({
                connectWith: ".ht-column",
                handle: ".ht-widget-header",
                placeholder: "ht-widget-placeholder",
                beforeStop: function( event, ui ) {
                    self.resizeWidgets();
                    //clearColumns();
                },
                out  : function(event, ui){
                    var from = {
                        module : ui.sender.parent().parent().attr('data-index'),
                        column : ui.sender.attr('data-index'),
                        widget : ui.item.attr('data-index')
                    }
                    var to = {
                        module : ui.item.parent().parent().parent().attr('data-index'),
                        column : ui.item.parent().attr('data-index'),
                        widget : ui.item.index()
                    }
                    console.log(from, to);
                    $('.ht-column').sortable( "cancel" );
                    self.moveWidget(from, to);

                    console.log("Item parent", ui.item.parent().index());
                    console.log("Sender parent ", ui.sender.parent().index());
                    console.log("Item", ui.item.attr('data-index'), ui.item.index());

                }
            });
        }
        this.moveWidget = function(from, to){
            // get widget from the from location
            var widget = self.modules()[from.module].columns[from.column].widgets[from.widget];
            console.log(widget);
            // add it to the to location
            self.modules()[to.module].columns[to.column].widgets.splice(to.widget,0,widget);
            // remove original widget
            var assign = self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);
            console.log(assign);
            self.removeExtraCols();
            m.redraw();
        }
        this.reformat = function(){
            if(self.canReformat){
                self.resizeContent();
                // Size wrapper elements
                var headfinal = $(window).width(); // final width of the header taking into account the navbar
                var wH = $(window).height();
                var wrapperH = wH-40;
                var tab = wrapperH-80;
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
                }
            }
            self.resizeWidgets();

        }
        this.resizeContent = function(){
            lensm = 2000;
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
                // for each children calculate their relative heights;
                $(this).children('.ht-widget').each(function(){
                    var childHeight = $(this).height();
                    var newHeight;
                    if(setContentHeight < contentHeight){
                        newHeight = (childHeight/contentHeight)*setContentHeight;
                        $(this).css({ height : newHeight}).find('.ht-widget-body').css({ height : newHeight-50});

                    } else {
                        $(this).find('.ht-widget-body').css({ height : childHeight-50});
                    }
                })
            })
        }
        this.buildScroll = function(){
            $('#ht-head').html("");
            $('.ht-tab').each(function(){
                var header = $(this).children('.ht-tab-header');
                var id = $(this).attr('data-id'); // Get id
                var title = header.find("h3").text(); // Get the title
                var width = $(this).width();  // Get the width
                totalWidth = totalWidth+width;
                var bg = header.attr("data-bg");
                // Build the head
                $('#ht-head').append('<div class="ht-hdiv bg-'+bg+'" data-hid="'+id+'" ><span class="ht-hdiv-content">'+title+'</span></div>')

                // ScrollTo initialization.
                $(document).on('click', '.ht-hdiv', function(){
                    var id = $(this).attr('data-hid');
                    $('#ht-wrapper').scrollTo($('.ht-tab[data-id="'+id+'"]'), 200,  {offset:-50});
                })
                modules.push({id : id, width : width, title : title});
                self.resizeContent();
                self.reformat();

            })
        }

        this.removeModule = function(module_index){
            self.modules().splice(module_index, 1);
        }
        this.expandWidget = function(module, column, widget){
            console.log("==");
            // create a column after this column
            self.modules()[module].columns.splice(column+1,0, new build.column([]));
            console.log(self.modules());
            // move widget to this column
            var from = { module : module, column : column, widget : widget}
            var to = { module : module, column : column+1, widget : 0}
            console.log("From", from, "to", to);
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
        this.exposeTrue = function(){
            self.canReformat = false;
            self.exposeOn = true;
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
            var modsmin = 300;
            var newmodlens = 900; // start with a bit of extra room just in case
            // get size of all mods
            $('#exposebtns').css('bottom', adjbtn + 'px');
            $.each(self.modules(), function(i, module) {
                modlens += module.width + 40;
            });

            // resize all content
            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
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
        }
        this.exposeFalse = function(){
            self.canReformat = true;
            self.exposeOn = false;
            $('#exposeTrue').show();
            $('#exposeFalse').hide();
            $('#ht-content').switchClass("dim-background", "", 200, "easeInOutQuad" );
            $('#ht-head').slideDown(200);
            $('#exposebtns').fadeOut();

            var headfinal = $(window).width(); // final width of the header taking into account the navbar
            var wH = $(window).height();
            var wrapperH = wH-26;
            var tab = wrapperH-60;

            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
                var width = $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width');
                $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width},200);
                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').show();
                $("#ht-content").sortable("disable");

                setTimeout(function(){
                    self.reformat();
                    self.resizeContent();
                }, 200);

            }
            $('#ht-content').animate({'padding': '20px'});
        }
        this.exposeOnFunction = function(){
            self.canReformat = false;
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
            $.each(self.modules, function(i, module) {
                modlens += module.width + 40;
            });

            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
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
        }
        this.exposeOffFunction = function(){
            self.canReformat = true;
            $('#exposeOn').show();
            $('#exposeOff').hide();

            var headfinal = $(window).width(); // final width of the header taking into account the navbar
            var wH = $(window).height();
            var wrapperH = wH-26;
            var tab = wrapperH-60;

            for(var i = 0; i < self.modules().length; i++){
                var o = self.modules()[i];
                var width = $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width');
                $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width},200);
                $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').show();
                $("#ht-content").sortable("disable");
                setTimeout(function(){
                    self.reformat();
                }, 200);
            }
            $('#ht-content').animate({'padding': '20px'});
        }
        this.init = function(){
            // Bind jquery events that we couldn't move to mithril
            self.buildScroll();
            self.updateSortable();

            $( ".ht-widget" ).addClass( "ui-widget ui-widget-content ui-helper-clearfix" )
            $('.ht-widget').resizable({
                handles : "s",
                minHeight: 100,
                stop : function (){
                    self.resizeWidgets();
                }
            } );
            $('.ht-column').resizable({
                handles : "e",
                minWidth : 200,
                stop : function (){
                    self.resizeWidgets();
                    self.reformat();

                }
            } );
            $(window).resize(self.reformat);

            // Scroller
            var htOnScroll = function() {
                $('#ht-slider').css('left', $('#ht-wrapper').scrollLeft()*$('#ht-head').width()/$('#ht-content').width() + 'px');
            };
            $('#ht-wrapper').on('scroll', htOnScroll );

            $('#ht-slider').draggable({ axis: "x", containment: 'window' });

            $('#ht-slider').mousedown(
                function(){$('#ht-wrapper').off('scroll' );}
            );

            $(document).mouseup(
                function(){$('#ht-wrapper').on('scroll', htOnScroll);}
            );

            $('#ht-slider').on('drag', function(){
                $('#ht-wrapper').scrollTo($('#ht-slider').offset().left*$('#ht-content').width()/$('#ht-head').width(),0);
            });

            $('#exLeftNav').click(function(){
                $('#ht-wrapper').scrollTo($('#ht-wrapper'), 200,  {offset:-500});
            });

            $('#exRightNav').click(function(){
                $('#ht-wrapper').scrollTo($('#ht-wrapper'), 200,  {offset:500});
            });

            // Expose
            $(document).keyup(function(e) {
                if (e.keyCode == 27) {$('#exposeOff').click()}   // esc
            });

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


        }




    }

    build.view = function(ctrl){
        return [
            m("", {style: {"position": "absolute", "right": "0", "top": "0"}}, [
                m("div.ht-hdiv.pull-right[id='exposeOn']", {onclick : ctrl.exposeOnFunction}, [m("button.btn.btn-primary", "On")] ),
                m("div.ht-hdiv.pull-right[id='exposeOff']", { onclick : ctrl.exposeOffFunction, style: { "display": "none"}}, [m("button.btn.btn-primary", "Off")] ),
                m("div.ht-hdiv.pull-right[id='exposeTrue']", { onclick : ctrl.exposeTrue}, [m("button.btn.btn-info", "Expose True")] ),
                m("div.ht-hdiv.pull-right[id='exposeFalse']", {onclick : ctrl.exposeFalse, style: { "display": "none" }}, [m("button.btn.btn-info", "False")] )
            ]),
            m("i.fa.fa-arrow-circle-left[id='exLeftNav']", {style: {"display": "none", "position": "absolute", "left": "1%", "bottom": "50%", "font-size": "50px", "z-index": "1"}}),
                m("i.fa.f.a-arrow-circle-right[id='exRightNav']", {style: {"display": "none", "position": "absolute", "right": "1%", "bottom": "50%", "font-size": "50px", "z-index": "1" }}),
                    m("[id='exposebtns']", [
                        m("span.white-text-btn", " Save Workspace "),
                        m("span.white-text-btn", " Load Workspace ")
                    ]),
                    m("[id='ht-head']"),
                    m("[id='ht-slider']"),
                    m("[id='ht-wrapper']", [
                        m("[id='ht-content']", [
                            m("", { config : ctrl.init }, [
                                ctrl.modules().map(function(module, module_index, module_array){
                                    if(module.minimize){
                                        return [" ", m(".ht-tab.ht-tab-minimized", {'data-index' : module_index, 'data-id' : module.id}, [
                                            m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                                m(".ht-windowBtn", [
                                                    m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                    m("i.fa.fa-plus", { onclick : function(){ module.minimize = false; }})
                                                ])
                                            ]),
                                            m(".ht-tab-content", [m("h3.rotate.rotatedText", module.title)])
                                        ])]
                                    }else {
                                        return [" ", m(".ht-tab", {'data-index' : module_index,  'data-id' : module.id}, [
                                            m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                                                m("h3", module.title),
                                                m(".ht-windowBtn", [
                                                    m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                                                    m("i.fa.fa-minus", { onclick : function(){ module.minimize = true }})
                                                ])
                                            ]),
                                            m(".ht-tab-content", [
                                                (function(){ console.log("Module", module) } )(),
                                                module.columns.map(function(column, column_index, column_array){
                                                    if(column.widgets.length > 0 || column.new){
                                                        return m(".ht-column", {'data-index' : column_index, 'style' : "width:"+column.width+"px"},  [
                                                            ( function(){
                                                                if (column.widgets.length > 0) {
                                                                    return column.widgets.map(function(widget, widget_index, widget_array){
                                                                        console.log(widget.display);
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
                                                                                m(".ht-widget-body", [m("div.row-fluid", [m("div.col-xs-12", [m("", m.trust(build.sample()))])])] )])

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
                    ])
        ];





    }

    m.module(document.body, build);






})();
