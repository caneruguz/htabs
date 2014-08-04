(function(){
var totalWidth = 0;
var modules = []; // created on load and checked at every resize

    var build = {};


    build.module = function(title, id, color, columns){
        if(!title){ title = "Module Title"};
        if(!id){ id = 1};
        this.id = 1;
        this.title = title ;
        this.order = 1;
        this.color = color;
        this.columns = columns;
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
            new build.module("Second Module", 1, "yellow", [
                new build.column( [
                    new build.widget("Widget 6"),
                    new build.widget("Widget 7")
                ]),
                new build.column([
                    new build.widget("Widget 8"),
                    new build.widget("Widget 9")
                ])
            ])
        ])
    }

    build.controller = function(){
        var self = this;
        this.modules = build.create();
        console.log(this.modules());
        this.updateSortable = function (){
            $(".ht-column" ).sortable({
                connectWith: ".ht-column",
                handle: ".ht-widget-header",
                placeholder: "ht-widget-placeholder",
                beforeStop: function( event, ui ) {
                    //console.log("Item", ui.item.attr('data-index'), ui.item.index());
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

//                    console.log("Item parent", ui.item.parent().index());
//                    console.log("Sender parent ", ui.sender.parent().index());
//                    console.log("Item", ui.item.attr('data-index'), ui.item.index());

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
            var headfinal = $(window).width(); // final width of the header taking into account the navbar
            var wH = $(window).height();
            var wrapperH = wH-26;
            var tab = wrapperH-60;
            var content = tab-51;
            var column =  content-10;

            $('#ht-head').css({ width : headfinal + 'px' } );
            $('#ht-wrapper').css({ width : headfinal + 'px', height: wrapperH + "px" } );
            $('.ht-tab').css({ height: tab + 'px'});
            $('.ht-tab-content').css({ height: content+'px'});
            $('.ht-column').css({height: column});
            $('.ht-add-column').css({height: column});

            // Resize header modules
            for(var i = 0; i < modules.length; i++){
                var o = modules[i];
                var contentWidth = $('#ht-content').width();  // width of the module
                var headWidth = $('#ht-head').width();
                var width = o.width/contentWidth*100;
                $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : width+'%'});
            }
            $(".grid").css({ height : '400px' } );


            // title text correction when title div sizes are becoming too small
            $('.ht-hdiv').each(function(){
                var inner = $(this).children('.ht-hdiv-content');
                var outer = $(this).width();
                var innerText = "";
                for(var i = 0; i < modules.length; i++){
                    if (modules[i].id == $(this).attr('data-hid')){
                        innerText = modules[i].title;
                        if( inner.outerWidth()+6 > outer){
                            var diff = (inner.outerWidth()-outer)/inner.outerWidth();
                            var cutoff = innerText.length*diff;
                            inner.text(innerText.slice(0,Math.round(cutoff)-6) + "...");
                        } else {
                            inner.text(innerText);
                        }
                    }
                }

            })
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
                    } else {

                    }
                    $(this).css({ height : newHeight});
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
                self.reformat();
            })
        }

        this.removeModule = function(module_index){
            self.modules().splice(module_index, 1);
        }
        this.expandWidget = function(module, column, widget){
            // create a column after this column
            self.modules()[module].columns.splice(column,0, new build.column([]));
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
            console.log(empty);
            if(!empty){
                console.log("=");
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
                        console.log("cut");
                        array.splice(column_index, 1);
                    }
                })
            })
            m.redraw();
        }
        this.init = function(){
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

                }
            } );
            self.updateSortable();
            self.buildScroll();
            $(window).resize(self.reformat);

        }

    }

    build.view = function(ctrl){
        return m("", { config : ctrl.init }, [
                ctrl.modules().map(function(module, module_index, module_array){
                     return [" ", m(".ht-tab", {'data-index' : module_index}, [
                m(".ht-tab-header", {  "data-bg" : module.color, "class" : 'bg-'+module.color }, [
                    m("h3", module.title),
                    m(".ht-windowBtn", [
                        m("i.fa.fa-times", { onclick : function(){ ctrl.removeModule(module_index); }}),
                        m("i.fa.fa-minus")
                    ])
                ]),
                m(".ht-tab-content", [
                    (function(){ console.log(module) } )(),
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
                                                    m(".ht-widget-body", widget.content)
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
             ])
             ]

        })
       ])

    }

    m.module(document.getElementById('ht-content'), build);


})(); 
