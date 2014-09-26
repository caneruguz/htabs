// Create a namespace for the entire app
var app = {};

// Load components and add them to the app namespace
app.logs = require('../components/logs/logs');
app.dashboard = require('../components/dashboard/dashboard');
app.comments = require('../components/comments/comments');
app.wiki = require('../components/wiki/wiki');
app.components = require('../components/components/components');
app.files = require('../components/files/files');
app.about = require('../components/about/about');
app.forks = require('../components/forks/forks');
app.activity = require('../components/activity/activity');
app.statistics = require('../components/statistics/statistics');
app.first = require('../components/first/first');
app.second = require('../components/second/second');
app.third = require('../components/third/third');
app.rescon = require('../components/rescon/rescon');
var notify = require('./notify');

// Initialize the mithril application module. -- this will be broken down in larger implementation
var build = {};
build.view = require('./view');
build.layout = m.prop($(window).width());
build.workspace = m.prop("");
m.request({method: "GET", url: "../workspace.json"}).then(build.workspace).then(function () {
    m.module(document.body, build);
});

Array.prototype.last = function(){
    return this[this.length-1];
}


/*******  MODELS  *******/
build.module = function (title, id, color, columns, css) {
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
    this.citation = "";
    this.links = [];
    this.show = true;
    this.bookmarks = [];
    this.bookmarked = false;
};
build.column = function (width, widgets) {
    this.width = width;
    this.widgets = widgets;
    this.new = false;
};
build.widget = function (id, title, type, content, iframeLink, hideHeader) {
    this.id = id;
    this.title = title || "Widget Title";
    this.content = content || "Lorem ipsum dolor sit amet";
    this.expandable = false;
    this.closable = true;
    this.height = 300;
    this.display = true;
    this.hideHeader = hideHeader;
    this.type = type || "comments";
    this.css = "";
    this.data = "";
};

/*******  CONTROLLER  *******/
build.controller = function () {
    var self = this;                                                                                                    // use self for binding inner scopes:
    this.modules = build.workspace;                                                                                     // Assign modules to the model we created. observableness is set in the create function.
    this.notify = notify;
    this.canReformat = true;                                                                                            // turn reformating on or off, sometimes we want formating to not be triggered.
    this.localExpose = false;                                                                                           // turn expose mode on or off, helps rending expose mode as pure mithril view.
    this.temp = { startIndex: 0, stopIndex: 0, fromObj: {}, toObj: {}, scrollTo: "", drag: { state: false } };          // Temporary variables so that jquery ui functions can send variables to each other. Is there a better way for this?
    this.layout = build.layout;                                                                                         // Width of the browser window, we will later use of height as well.
    this.asideOpen = false;
    var controllers = this.controllers = {};

    self.applyModules = function (type) {
        var type = type || "all";
        var index = 0;
        switch (type){
            case 'first':
                index = 0;
                break;
            case 'last':
                index = self.modules().length-1;
                break;
            default :
                index = type;
                break;
        }
        if(type !== 'all'){
            self.modules()[index].columns.map(function (column) {
                column.widgets.map(function (widget) {
                    controllers[widget.id] = new app[widget.type].controller;
                });
            });
        } else {
            self.modules().map(function (module) {
                module.columns.map(function (column) {
                    column.widgets.map(function (widget) {
                        controllers[widget.id] = new app[widget.type].controller;
                    });
                });
            });
        }
    };
    self.applyModules('all');
    self.applyPageEvents = function(){
        $(document).on('mousemove', function (event) {
            if (self.temp.drag.state && !self.temp.drag.element.hasClass('no-resize')) {
                event.preventDefault();
                var pageY = event.pageY;
                var elementId = self.temp.drag.element.attr('data-id');
                var el = $('.ht-widget[data-id="' + elementId + '"]');
                //noinspection JSValidateTypes
                var header = el.children('.ht-widget-header').outerHeight();
                var diff = self.temp.drag.offset - pageY;
                var newHeight = self.temp.drag.originHeight - diff;
                if (newHeight > 100) {
                    el.css('height', newHeight + 'px');
                    el.children('.ht-widget-body').css('height', (newHeight - header) + 'px');
                }
            }
        });
        $(document).on('mousedown', '.ht-resize-zone', function (event) {
            self.temp.drag = {
                state: true,
                offset: event.pageY,
                element: $(this).parent(),
                originHeight: $(this).parent().outerHeight()
            }
        });
        $(document).on('mouseup', function () {
            if (self.temp.drag.state) {
                self.resizeWidgets();
            }
            self.temp.drag.state = false;
        });
    }
    this.applyColumnEvents = function (module_index) {
        var module_index = module_index || 'all';
        var selector;
        if(module_index === 'all'){
            selector = '.ht-column:not(.no-resize)';
        } else {
            selector = '.ht-tab[data-index="'+module_index+'"] .ht-column:not(.no-resize)'
        }
        $(selector).resizable({
            handles: "e",
            minWidth: 250,
            resize: function (event) {
                var module_index = $(event.target).parents('.ht-tab').attr('data-index');
                var column_index = $(event.target).attr('data-index');
                self.saveColumnSize(module_index, column_index);
                self.reformatWidth();
                self.checkExpandState();
            },
            stop: function (event) {
                var column_index = $(event.target).attr('data-index');
                var column = $('.ht-column[data-index="'+column_index+'"]');
                column.find(".widget-body-inner").rescon(
                    {
                        sizes: { "xs": 0, "sm": 300, "md": 600, "lg": 1000 }
                    }
                );
                column.find('.ht-widget').each(function(){
                    var id = $(this).attr('data-id');
                    self.widgetize(id);
                })

            }
        });
        $(selector).sortable({
            connectWith: ".ht-column",                                                                                  // So that we can move widgets between other columns.
            handle: ".ht-widget-header",                                                                                // Grab from the header div only.
            cursor: "move",
            cancel: '.fa',
            opacity: 0.7,
            helper: 'clone',
            appendTo: '#ht-content',
            forceHelperSize: true,
            placeholder: "ht-widget-placeholder",
            start: function (event, ui) {                                                                               // The only outcome of this is to get the widget that is being moved i.e. from
                ui.placeholder.width("98%");
                ui.helper.css({
                    width: 200,
                    height: 200,
                    overflow: 'hidden'
                });
                self.temp.fromObj = {
                    module: ui.item.parents('.ht-tab').attr('data-index'),
                    column: ui.item.parent().attr('data-index'),
                    widget: ui.item.index()
                };
            },
            stop: function (event, ui) {                                                                                // get the widget placement that we want the original widget to drop to
                self.temp.toObj = {
                    module: ui.item.parents('.ht-tab').attr('data-index'),                                              // ui returns the same widget but the indexes and placement has changed.
                    column: ui.item.parent().attr('data-index'),
                    widget: ui.item.index()
                };

                self.moveWidget(self.temp.fromObj, self.temp.toObj);                                                    // Move the widget
                m.redraw();
            },
            over: function (event) {
                var widgets = $(event.target).children('.ht-widget');
                var totalWidgets = widgets.length;
                $(event.target).children('.ht-widget').each(function () {
                    var height = $(this).outerHeight;
                    var adjustAmount = 50 / totalWidgets;
                    var adjustedHeight = height - adjustAmount;
                    $(this).css({ height: adjustedHeight + "px"})
                })
            },
            cursorAt: {left: 100, top: 25}
        });
    };
    this.removeColumnEvents = function(module_index){
        var module_index = module_index || 'all';
        var selector;
        if(module_index === 'all'){
            selector = '.ht-column:not(.no-resize)';
        } else {
            selector = '.ht-tab[data-index="'+module_index+'"] .ht-column:not(.no-resize)'
        }
        $(selector).resizable('destroy');
        $(selector).sortable('destroy');

    }
    this.widgetize = function (widget_id) {
        var selector;
        if(widget_id){
            selector = '.ht-widget[data-id="'+widget_id+'"]';
        } else {
            selector = '.ht-widget';
        }
        $(selector).each(function () {
            var width = $(this).outerWidth();
            var height = $(this).height();
            var color = $(this).find('.ht-widgetize').attr('data-color');
            $(this).children('.ht-widget-header').removeClass().addClass('ht-widget-header');
            $(this).find('.widget-body-inner').removeClass().addClass('widget-body-inner');
            if (width < 300) {
                $(this).find('.widget-body-inner').addClass(color);
                $(this).children('.ht-widget-header').addClass(color + ' t-light');
                $(this).css({ height: (height - 1) + 'px'});
            } else {
                $(this).children('.ht-widget-header').addClass('bg-opaque-white-md bg-white');
                $(this).css({ height: (height + 1) + 'px'});
            }
        })
    };
    this.init = function (element, isInitialized) {
        if (isInitialized) return;
        var oldWidth = $(window).width();
        var oldHeight = $(window).height();
        $(window).resize(function () {
            (function () {
                if ($(window).height() == oldHeight || $(window).height() < 300) return;
                else
                    oldHeight = $(window).height();
                self.reformatHeight();
                self.resizeWidgets();
            })();
            oldWidth = $(window).width();
            self.reformatWidth();
        });
        self.reformat();
        $(document).on('click', '.ht-hdiv', function () {                                                               // ScrollTo takes you to the module when clicked on the header
            var id = $(this).attr('data-hid');
            $('#ht-wrapper').scrollTo($('.ht-tab[data-id="' + id + '"]'), 150, {offset: -50});
        });
        $('#ht-slider').scroller({ scrollWrapper: "#ht-wrapper", complete: function () {                                // Scroller is its own jquery plugin now.
            console.log("Scroller Completed!");
        } });
        $(document).keyup(function (e) {                                                                                // Key listeners
            if (e.keyCode == 27) {                                                                                       // ESC
                if (self.localExpose === true) {
                    self.localExpose = false;
                    m.redraw();
                }
            }
            if (e.keyCode > 48 && e.keyCode < 58) {                                                                     // numbers 1 - 9 take you through these module indexes
                var index = e.keyCode - 49;
                $('#ht-wrapper').scrollTo($('.ht-tab[data-index="' + index + '"]'), 150, {offset: -50});
            }
        });
        self.applyPageEvents();
        self.applyColumnEvents('all');
        console.log("app initialized");
    };


    /*******  WIDGETS  *******/
    this.moveWidget = function (from, to) {                                                                             // When widgets are moved we need to update the model itself with the changes.
        var widget = self.modules()[from.module].columns[from.column].widgets[from.widget];                             // get widget from the from location
        if (from.module !== to.module || from.column !== to.column) {                                                   // if columns are different do as usual - same column number within different widgets also okay
            self.modules()[to.module].columns[to.column].widgets.splice(to.widget, 0, widget);                          // add it to the to location
            self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);                            // remove original widget
            if (self.modules()[from.module].columns[from.column].widgets < 1) {                                         // remove extra col if from.column empty
                self.modules()[from.module].columns.splice(from.column, 1);
            }
        } else {                                                                                                        // if from < to first delete then add
            if (from.widget < to.widget) {
                self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);
                self.modules()[to.module].columns[to.column].widgets.splice(to.widget, 0, widget);
            } else {                                                                                                    // else first add than delete
                self.modules()[to.module].columns[to.column].widgets.splice(to.widget, 0, widget);
                self.modules()[from.module].columns[from.column].widgets.splice(from.widget + 1, 1);
            }
        }
        self.reformatWidth();                                                                                           // We need to redo sizes. Maybe we should push this to resize Widgets.
        self.widgetize(widget.id);
        self.resizeWidgets();                                                                                           // After moving we will need to readjust the heights of the widgets
    };
    this.removeWidget = function (module_index, column_index, widget_index, widget_type) {
        self.modules()[module_index].columns[column_index].widgets.splice(widget_index, 1);
        if (self.modules()[module_index].columns[column_index].widgets.length === 0) {
            self.modules()[module_index].columns.splice(column_index, 1);
        }
        $('.ht-widget-btn[data-type="'+widget_type+'"]').removeClass('ht-open');

    };
    this.resizeWidgets = function () {
        var args = arguments;
        var selector = $('.ht-column');
        if (args[0]) {
            selector = args[0];
        }
        selector.each(function () {                                                                                     // Iterate over colummns, we don't need to use jquery to iterate but doesn't harm.
            var setContentHeight = $(this).outerHeight();                                                               // Height of the column
            var totalHeight = 0;                                                                                        // Calculate Total widgets height -- this is in case widgets end up not covering the entire height of the column.
            $(this).children('.ht-widget').each(function () {
            totalHeight = totalHeight + $(this).outerHeight() + 10;                                                     // 10 is for bottom margin
            });
            $(this).children('.ht-widget').each(function () {                                                           // for each children calculate their relative heights so that we fill the column proportionally to the existing heights of the widgets ;
                var childHeight = $(this).outerHeight();
                var newHeight;
                var headerHeight = $(this).children('.ht-widget-header').outerHeight();
                newHeight = (childHeight / (totalHeight)) * setContentHeight;
                if (newHeight > 100) {
                    $(this).css({ height: newHeight});
                    $(this).find('.ht-widget-body').css({ height: (newHeight - headerHeight) + "px"});
                }
                $(this).children('.ht-widget-header').show();
            });
        });
        $(".widget-body-inner").rescon({
            sizes: { "xs": 0, "sm": 300, "md": 600, "lg": 1000 }
        });
    };
    this.widgetInit = function (element, isInit) {
        if (isInit) return;
        var id = self.modules().last().columns.last().widgets.last().id;
        var widget_id = $(element).attr('data-id');
        if (widget_id == id) {
            self.reformat();
            self.resizeWidgets();
            if (self.temp.scrollTo && $(self.temp.scrollTo).get(0)) {
                $('#ht-wrapper').scrollTo($(self.temp.scrollTo), 150, {offset: -50 });
            }
            self.temp.scrollTo = "";
        }
        self.widgetize(widget_id);
    };
    this.checkExpandState = function(){
        self.modules().map(function(modules){
            modules.columns.map(function(column){
                column.widgets.map(function(widget){
                    if(column.width<=300){
                        widget.expandCss = "expand";
                    }else{
                        widget.expandCss = "compress";
                    }
                });
            });
        });
    };
    this.expandWidget = function(module, column, widget){
        var widget_id = self.modules()[module].columns[column].widgets[widget].id;
        if(self.modules()[module].columns[column].width <= 300){
            self.modules()[module].columns.splice(column+1,0, new build.column(620, []));
            // move widget to this column
            var from = { module : module, column : column, widget : widget};
            var to = { module : module, column : column+1, widget : 0};
            self.moveWidget(from, to);
            self.checkExpandState();
        }else{
            self.modules()[module].columns[column].width = 300;
            self.checkExpandState();
            m.redraw();
        }
        self.widgetize(widget_id);
    };

    /*******  EXPOSE  *******/
    this.exposeInit = function () {
        $(".expose-modules").sortable({
            placeholder: "ghost-element ht-tab ui-state-default",
            cursor: "move",
            helper: "clone",
            beforeStop: function (event, ui) {
                self.temp.stopIndex = ui.item.index();
                $(".expose-modules").sortable("cancel");
                self.moveModule(self.temp.startIndex, self.temp.stopIndex);
            },
            start: function (event, ui) {
                self.temp.startIndex = ui.item.index();
                ui.helper.css({
                    width: 300,
                    height: 300
                });
            },
            cursorAt: {left: 100, top: 25}
        });
    };
    this.beginExpose = function () {
        self.calculateExposeWidths();
        self.localExpose = true;
    };
    this.endExpose = function () {
        self.localExpose = false;
    };
    this.calculateExposeWidths = function () {
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var wrapperHeight = windowHeight - 40;
        var tab = wrapperHeight - 80;
        var adjheight = tab / 2;
        var adjpadding = tab / 4;
        var modlens = self.calculateContentLength();
        $(".ghost-element").css('height', adjheight);
        self.modules().map(function (module) {
            var baseWidth = 60 + 4 + 20 + 410;                                                                          //  60 : width of the add column bar; 22: htab margin+border; 20 : ht-tab-content padding
            var columnW;
            if (module.bookmarks.length > 0) {
                baseWidth += 270;
            }
            module.columns.map(function (column) {
                columnW = column.width + 10;                                                                            // right padding + right margin + right border
                baseWidth += columnW;
            });
            var width = (baseWidth) / (modlens);                                                                        // The ratio of this module over all modules
            module.exposeWidth =  width * (windowWidth - (40 * self.modules().length) - adjpadding / 2);                // calculate width, taking into account proper padding
        });
    };


    /*******  MODULES  *******/
    this.moduleInit = function(module_id){
        self.applyColumnEvents(module_id);
    }
    this.moveModule = function (from, to) {                                                                             // Move module within the expose window. Gets triggered suring sortable in expose but could be used otherwise.
        var module = self.modules()[from];                                                                              // get module object with From module index
        if (from < to) {
            self.modules().splice(from, 1);
            self.modules().splice(to, 0, module);
        } else {
            self.modules().splice(to, 0, module);
            self.modules().splice(from + 1, 1);
        }
        m.redraw();
    };
    this.addModule = function () {
        var lastModuleColor = self.modules().last().color;
        function buildModule (color){
            var moduleId = Math.floor((Math.random() * 100000) + 1) + 3;
            var col1Id = Math.floor((Math.random() * 100000) + 1) + 6;
            var col2Id = Math.floor((Math.random() * 100000) + 1) + 6;
            var newModule = new build.module("Added Module " + moduleId, moduleId, color, [
                new build.column(620, [
                    new build.widget(col1Id, "Widget " + col1Id, "comments"),
                    new build.widget(col2Id, "Widget " + col2Id, "activity")
                ])
            ]);
            self.modules().push(newModule);
            self.applyModules("last");
            self.temp.scrollTo = '.ht-tab[data-id="' + moduleId + '"]';
        }
        function colorPicker(callback) {
            var clrs = ["emerald-d", "river-d", "turquaz-d", "wisteria-d", "asphalt-l", "sunflower-d", "carrot-d", "alizarin-d" ];
            var randomNumber = Math.floor(Math.random() * clrs.length);
            var oldColor = lastModuleColor;
            var newColor = clrs[randomNumber];
            if (newColor === oldColor) {
                colorPicker(callback);
            } else {
                callback(newColor);
            }
        };
        colorPicker(buildModule);
    };
    this.removeModule = function (module_index) {
        self.removeColumnEvents(module_index);                                                                          // unload, turn events off etc.
        if (self.modules()[module_index].bookmarked) {                                                                  // hide if bookmarked, remove otherwise
            self.modules()[module_index].show = false;
            self.modules()[0].bookmarks.map(function (b) {
                if (b.id == self.modules()[module_index].id) {
                    b.open = false;
                }
            })
        } else {
            self.modules().splice(module_index, 1);
        }
        self.reformatWidth();
    };
    this.toggleModule = function (index, state) {
        self.modules()[index].minimize = state;
        self.calculateExposeWidths();
    };
    this.moduleViewToggle = function (event) {
        var event = event || window.event;
        var module;
        if (event.toElement.className == "ht-bookmark-content") {
            module = $(event.target).parent();
        }
        else {
            module = $(event.target);
        }
        var moduleID = module.attr('data-mid');
        self.modules().map(function (module, m_index) {
            if (module.id == moduleID) {
                module.show = !module.show;
                if(module.show){
                    self.removeColumnEvents(m_index);
                } else {
                    self.applyColumnEvents(m_index);
                }
            }
        });
        self.modules()[0].bookmarks.map(function (b) {
            if (b.id == moduleID) {
                b.open = !b.open;
            }
        })
    };

    /*******  COLUMNS  *******/
    this.addCol = function (module_index) {
        var empty = false;                                                                                              // Check if there is an empty column
        self.modules()[module_index].columns.map(function (item) {
            if (item.widgets.length < 1) {
                empty = true;
            }
        });
        if (!empty) {
            self.modules()[module_index].columns.push({ width: 300, widgets: [], new: true});
            var offset = $('.ht-tab[data-index="' + module_index + '"] > .ht-tab-content > .ht-add-column').offset().left;
            var windowW = $(window).width();
            var selector = '.ht-tab[data-index="' + module_index + '"] > .ht-tab-content > .ht-column:last';
            if (offset + 320 > windowW) {
                self.temp.offset = windowW - 300;
                self.temp.scrollTo = selector;
            } else if (offset < 250) {
                self.temp.offset = 300 - offset;
                self.temp.scrollTo = selector;
            } else {
                self.temp.offset = 0;
                self.temp.scrollTo = "";
            }
        }
        self.reformat();
    };
    self.saveColumnSize = function (module_index, column_index) {
        var args = arguments;
        if (args.length === 0) {
            for (var i = 0; i < self.modules().length; i++) {
                var o = self.modules()[i];
                o.columns.map(function (item, index) {
                    item.width = ($('.ht-tab[data-id="' + o.id + '"]').find('.ht-column[data-index=' + index + ']')).outerWidth();
                });
            }
        } else {
            self.modules()[module_index].columns[column_index].width = ($('.ht-tab[data-index="' + module_index + '"]').find('.ht-column[data-index=' + column_index + ']')).outerWidth();
        }

    };

    /*******  WORKSPACE *******/
    this.saveWorkspace = function () {
        console.log(self.modules());
    };

    /*******  LAYOUT  *******/
    this.reformat = function () {
        self.reformatHeight();
        self.reformatWidth();
    };
    this.reformatWidth = function () {
        if (self.canReformat) {
            var window_width = $(window).outerWidth();
            if (self.asideOpen) {
                window_width = window_width - 400;
            }
            var totalLength = self.calculateContentLength();
            if (self.focusMode) {
                if (window_width > 1200) {
                    $('#ht-focus-wrap').css('width', '1200px');
                } else {
                    $('#ht-focus-wrap').css('width', window_width + 'px');
                }
            }
            var ht_head_width = window_width;
            var ht_content_width = totalLength;
            var wrapper_width = window_width;
            $('.ht-head-wrapper').css({ width: window_width + 'px' });
            $('#ht-head').css({ width: ht_head_width + 'px' });
            $('#ht-wrapper').css({ width: wrapper_width + 'px' });
            $('#ht-content').css('width', ht_content_width + 'px');
            var remainder = 0;
            var actual_ht_head = 0;
            for (var i = 0; i < self.modules().length; i++) {
                var o = self.modules()[i];
                var use_width = (window_width > ht_content_width) ? window_width : ht_content_width;
                var width = (($('.ht-tab[data-id="' + o.id + '"]').outerWidth() + 4)) / (use_width - 4) * ht_head_width + remainder;
                var adjWidth = Math.floor(width);
                actual_ht_head += adjWidth;
                remainder = width - adjWidth;
                $('.ht-hdiv[data-hid="' + o.id + '"]').css({ width: adjWidth + 'px'});
            }
            var content_width = $('#ht-content').outerWidth();
            var slider_width = Math.floor(wrapper_width * actual_ht_head / (content_width));
            var slider_left = $('#ht-wrapper').scrollLeft() * ht_head_width / content_width;
            $('#ht-slider').css({
                width: (slider_width+-2) + 'px',
                left: slider_left + 'px'
            });
            self.fill();
        }
    };
    this.reformatHeight = function () {
        if (self.canReformat) {
            var window_height = $(window).height() + 15;
            var ht_wrapper_height = window_height - 65;                                                                 // Remaining elements height is 65px, ht-head and ht-slider-wrap + navbar
            var ht_tab_height = ht_wrapper_height - 23;                                                                 // wrapping parent ht-content has a total of 20px padding on top and bottom;
            var ht_tab_content_height = ht_tab_height - 1;
            var ht_column_height = ht_tab_content_height - 10;
            $('.ht-tab').css({ height: ht_tab_height + 'px'});
            $('.ht-tab-content').css({ height: ht_tab_content_height + 'px'});
            $('.ht-column').css({height: ht_column_height});
            $('.ht-add-column').css({height: (ht_column_height - 7) + 'px'});
            $('#ht-wrapper').css({ height: ht_wrapper_height + "px" });
            $('.ht-aside').css({ height: window_height + 'px' });
            $('.dashboardList').css({ height: (ht_column_height - 300) + 'px' });
            self.resizeWidgets();
        }
    };
    this.calculateContentLength = function () {
        var totalLength = 4;
        self.modules().map(function (module) {

            if (module.show) {
                var thisWidth = 60 + 4 + 20 + 410;                                                                      //  60 : width of the add column bar; 4: htab margin+border; 20 : ht-tab-content padding 410 for dashboard width;
                if (module.bookmarks.length > 0) {
                    thisWidth += 270;
                }
                module.columns.map(function (column) {
                    thisWidth +=  column.width + 10;                                                                    // right padding + right margin + right border
                });

                totalLength += thisWidth;
            }
        });
        return totalLength;
    };
    this.fill = function () {
        $(".ht-fill").each(function () {
            var parent_w = $(this).parent().width();
            $(this).width(parent_w)
                .find('.input-group, .form-group').css('width', '100%')
                .find('.input-group-btn').css('text-align', 'left')
        });
    };


    /*******  LINKS  *******/
    this.loadLink = function (e) {
        var event = e || window.event;
        var link = $(event.target);
        var type = link.closest('li').attr('data-type');
        var title = link.text();
        var index = link.closest('.ht-tab').attr('data-index');
        if(link.hasClass('ht-widget-btn-txt')){
            link = link.parent();
        }
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
        };
        var open = false;
        self.modules()[index].columns.map(function(col, c_index, c_array){
            if(col.widgets.length > 0){
                col.widgets.map(function(w, w_index, w_array){
                    if(w.type == type){
                        w_array.splice(w_index, 1);
                        link.removeClass('ht-open');
                        if(w_array.length == 0){
                            c_array.splice(c_index, 1);
                        }
                        open = true;
                    }
                    if(c_index == c_array.length-1 && w_index == w_array.length-1 ){                                    // if this is the last widget of the last column
                        if(!open){                                                                                      // and widget is still not found
                            c_array.push( new build.column(620, [ widget ]));
                            self.temp.scrollTo = '.ht-widget[data-id='+randomNumber+']';
                            link.closest('li').addClass('ht-open');
                        }
                    }
                });
            } else {
                if(!open){                                                                                              // If there is an empty column and the widget is still not open
                    col.width = 620;
                    col.widgets.push(widget);
                    self.temp.scrollTo = '.ht-widget[data-id='+randomNumber+']';
                    link.closest('li').addClass('ht-open');
                }
            }
        });
        self.applyModules(index);
        self.reformatWidth();
    };


    /*******  BOOKMARKS  *******/
    this.bookmarkToggle = function (event) {
        var event = event || window.event;
        var el = $(event.target);
        var mindex = el.attr('data-mindex');
        var module = self.modules()[mindex];
        if (module.bookmarked == true) {
            for (var bookmarksNum in self.modules()[0].bookmarks) {
                if (self.modules()[0].bookmarks[bookmarksNum].id == module.id) {
                    self.modules()[0].bookmarks.splice(bookmarksNum, 1);
                }
            }
            module.bookmarked = false;
        }
        else {
            var bookmark = {
                "id": module.id,
                "title": module.title,
                "open": true,
                "color": module.color
            };
            self.modules()[0].bookmarks.push(bookmark);
            module.bookmarked = true;

        }
    };

    /*******  ASIDE TAB  *******/
    this.asideInit = function () {
        self.reformatWidth();
    };
    this.asideClick = function () {
        self.asideOpen = !self.asideOpen;
    };


    /*******  NOTIFICATIONS  *******/
    this.notifyDo = function (todo) {
        self[todo.name](todo.parameters);
    };
    this.dismissNotify = function (id) {
        self.notify.list.map(function (item, index, array) {
            if (item.id === id) {
                array.splice(index, 1);
            }
        });
    };
    this.openProject = function (args) {
        self.modules().map(function (module) {
            if (module.id === args[0]) {
                module.show = true;
                self.temp.scrollTo = '.ht-tab[data-id="' + module.id + '"]';
            }
            self.dismissNotify(args[1]);
            self.asideOpen = false;
        });
    };
    this.gotoProject = function (id) {
        self.modules().map(function (module) {
            if (module.id === id) {
                self.temp.scrollTo = '.ht-tab[data-id="' + module.id + '"]';
            }
        });
    };

    /*******  FOCUS MODE   *******/
    this.focusMode = false;
    this.focus = {};
    this.focusOn = function (widget_type, widget_id, widget_title) {
        self.focus = {};
        self.focus.type = widget_type;
        self.focus.id = widget_id;
        self.focus.title = widget_title;
        self.focusMode = true;
    };
    this.focusInit = function () {
        self.reformatWidth();
    };


    /*******  MOBILE  *******/
    this.mobileInit = function () {
        var dist = 150;
        $(".ht-mobile-widget").swipe({
            swipe: function (event, direction) {
                var target_module = $(this).closest(".ht-mobile-module").attr("data-index");
                var element;
                switch (direction) {
                    case "up" :
                        element = $(".ht-mobile-module[data-index=" + (parseInt(target_module) + 1) + "]");
                        if (element.length > 0) {
                            $('#ht-mobile-content').scrollTo(element, dist, {offset: 0});
                        }
                        break;
                    case "down":
                        element = $(".ht-mobile-module[data-index=" + (parseInt(target_module) - 1) + "]");
                        if (element.length > 0) {
                            $('#ht-mobile-content').scrollTo(element, dist, {offset: 0});
                        }
                        break;
                    case "left" :
                        element = $(this).next();
                        if (element.length > 0) {
                            $('.ht-mobile-module[data-index=' + target_module + ']').scrollTo(element, dist, {offset: 0});
                        }
                        break;
                    case "right" :
                        element = $(this).prev();
                        if (element.length > 0) {
                            $('.ht-mobile-module[data-index=' + target_module + ']').scrollTo(element, dist, {offset: 0});
                        }
                        break;
                }
            }
        });
        self.canReformat = false;
    };
    this.mobileModuleInit = function () {
        var mobileContentHeight = $(window).height() - 50;
        var mobileContentWidth = $(window).width();
        $('.ht-mobile-module').css({'height': mobileContentHeight + 'px', 'width': mobileContentWidth + 'px'});
        $('#ht-mobile-content').css({'height': mobileContentHeight + 'px', 'width': mobileContentWidth + 'px'});
    };
    this.mobileExposeInit = function () {
        var mobileContentHeight = $(window).height();
        $('#ht-mobile-expose').css({'height': mobileContentHeight + 'px'});
    };
    this.mobileWidgetInit = function (module_index) {
        var mobileContentHeight = $(window).height() - 40;
        var mobileContentWidth = $(window).width();
        $('.ht-mobile-widget').css({ 'height': mobileContentHeight + 'px', width: mobileContentWidth + 'px'});
        var totalWidgets = 1;
        self.modules()[module_index].columns.map(function (column) {
            totalWidgets += column.widgets.length;
        });
        $('.ht-mobile-module[data-index=' + module_index + ']').children('.ht-mobile-module-inner').css('width', mobileContentWidth * totalWidgets);
    };
    this.mobileExposeToggle = function () {
        self.mobileExpose = !self.mobileExpose;
    };
};

