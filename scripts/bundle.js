(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

// Initialize the mithril application module. -- this will be broken down in larger implementation
var build = {};
build.layout = m.prop($(window).width());
build.workspace = m.prop("");
m.request({method: "GET", url: "../workspace.json"}).then(build.workspace).then(function () {
    m.module(document.body, build);
});


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


/*******  NOTIFICATIONS  *******/
var notify = {};
notify.model = function (controller, text, actions, type) {
    var self = this;
    this.id = Math.floor((Math.random() * 100000) + 1) + 3;
    this.text = text;
    this.actions = actions || [];
    this.type = type || "default";
    actions.push({
        title: "Dismiss",
        todo: { name: "dismissNotify", parameters: self.id },
        css: 'btn btn-default'
    });
};

notify.list = [
    {
        id: 1,
        text: "This notification is here to tell you that you should be opening a new module.",
        type: "info",
        css: "bg-turquaz-l t-light",
        actions: [
            {
                title: "Open Project",
                todo: { name: "openProject", parameters: [2, 1] },
                css: 'btn bg-emerald-d btn-sm'
            },
            {
                title: "Dismiss",
                todo: { name: "dismissNotify", parameters: 1 },
                css: 'btn bg-clouds-d btn-sm'
            }
        ]
    },
    {
        id: 2,
        text: "Go to an existing project and do something there",
        type: "success",
        css: "bg-river-l t-light",
        actions: [
            {
                title: "Go to Project",
                todo: { name: "gotoProject", parameters: 1 },
                css: 'btn bg-turquaz-d btn-sm'
            },
            {
                title: "Dismiss",
                todo: { name: "dismissNotify", parameters: 2 },
                css: 'btn bg-clouds-d btn-sm'
            }
        ]
    }
];

notify.view = function (ctrl) {
    return m('ul.no-bullets', [
        notify.list.map(function (item) {
            return m('li.ht-panel', { "class": item.css}, [
                m('.ht-panel-body', item.text),
                m('.ht-panel-footer', [
                    m('ul.no-bullets', [
                        item.actions.map(function (action) {

                            return m('li.ht-panel-action', { "class": action.css, onclick: function () {
                                ctrl.notifyDo(action.todo);
                            } }, action.title)
                        })
                    ])
                ])
            ])
        })

    ])
};


/*******  CONTROLLER  *******/
build.controller = function () {
    var self = this;  // use self for binding inner scopes:
    this.modules = build.workspace; // Assign modules to the model we created. observableness is set in the create function.
    this.canReformat = true;    // turn reformating on or off, sometimes we want formating to not be triggered.
    this.localExpose = false;   // turn expose mode on or off, helps rending expose mode as pure mithril view.
    this.temp = { startIndex: 0, stopIndex: 0, fromObj: {}, toObj: {}, scrollTo: "", drag: { state: false } }; // Temporary variables so that jquery ui functions can send variables to each other. Is there a better way for this?
    this.layout = build.layout;
    this.asideOpen = false;
    var controllers = this.controllers = {};

    self.applyModules = function () {
        self.modules().map(function (module) {
            module.columns.map(function (column) {
                column.widgets.map(function (widget) {
                    controllers[widget.id] = new app[widget.type].controller;
                });
            });
        });
    };
    self.applyModules();
    this.eventsOn = function () {
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
        })
        $(document).on('mousedown', '.ht-resize-zone', function (event) {
            self.temp.drag = {
                state: true,
                offset: event.pageY,
                element: $(this).parent(),
                originHeight: $(this).parent().outerHeight()
            }
        })
        $(document).on('mouseup', function () {
            if (self.temp.drag.state) {
                self.resizeWidgets();
            }
            self.temp.drag.state = false;
        })
        $('.ht-column:not(.no-resize)').resizable({
            handles: "e",
            minWidth: 250,
            resize: function () {
                self.saveColumnSize();
                self.reformatWidth();
            },
            stop: function () {
                $(".widget-body-inner").rescon(
                    {
                        sizes: { "xs": 0, "sm": 300, "md": 600, "lg": 1000 }
                    }
                );
                self.widgetize();
            }
        });
        $(".ht-column").not('.ht-column[data-index=-1]').sortable({
            connectWith: ".ht-column",      // So that we can move widgets between other columns.
            handle: ".ht-widget-header",    // Grab from the header div only.
            cursor: "move",
            cancel: '.fa',
            opacity: 0.7,
            helper: 'clone',
            appendTo: '#ht-content',
            forceHelperSize: true,
            placeholder: "ht-widget-placeholder",
            start: function (event, ui) {   // The only outcome of this is to get the widget that is being moved i.e. from
                ui.placeholder.width("98%");
                ui.helper.css({
                    width: 200,
                    height: 200,
                    overflow: 'hidden'
                });
                self.temp.fromObj = {};     // empty temp objects so we don't use any of these values accidentally
                self.temp.toObj = {};
                var from = {
                    module: ui.item.parents('.ht-tab').attr('data-index'),
                    column: ui.item.parent().attr('data-index'),
                    widget: ui.item.index()
                };
                self.temp.fromObj = from; // assign the from object
            },
            stop: function (event, ui) {     // get the widget placement that we want the original widget to drop to
                var to = {
                    module: ui.item.parents('.ht-tab').attr('data-index'), // ui returns the same widget but the indexes and placement has changed.
                    column: ui.item.parent().attr('data-index'),
                    widget: ui.item.index()
                };
                console.log("From", self.temp.fromObj);
                console.log("To", to);
                //$('.ht-column').not('.ht-column[data-index=-1]').sortable( "cancel" );       // Stop sortable from actually sorting, leave this to mithril because we changed the observable model
                self.moveWidget(self.temp.fromObj, to); // Move the widget
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
            out: function () {
                self.resizeWidgets();
            },
            cursorAt: {left: 100, top: 25}
        });
    };
    this.widgetize = function () {
        $('.ht-widget').each(function () {
            var width = $(this).outerWidth();
            var height = $(this).height();
            var color = $(this).find('.ht-widgetize').attr('data-color');
            $(this).children('.ht-widget-header').removeClass().addClass('ht-widget-header');
            $(this).children('.ht-widget-body').removeClass().addClass('ht-widget-body');
            if (width < 300) {
                $(this).children('.ht-widget-body').addClass(color);
                $(this).children('.ht-widget-header').addClass(color + ' t-light');
                $(this).css({ height: (height - 1) + 'px'});
            } else {
                $(this).children('.ht-widget-header').addClass('bg-opaque-white-md bg-white');
                $(this).css({ height: (height + 1) + 'px'});
            }
        })
    }
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
            // Always run width but only run height if necessary and taller than 500px;
            oldWidth = $(window).width();
            self.reformatWidth();
        });
        self.reformatWidth();
        self.reformatHeight();
        // ScrollTo take you to the module when clicked on the header
        $(document).on('click', '.ht-hdiv', function () {
            var id = $(this).attr('data-hid');
            $('#ht-wrapper').scrollTo($('.ht-tab[data-id="' + id + '"]'), 150, {offset: -50});
        });
        // Scroller is its own jquery plugin now.
        $('#ht-slider').scroller({ scrollWrapper: "#ht-wrapper", complete: function () {
            console.log("Scroller Completed!");
        } });
        // Key listeners
        $(document).keyup(function (e) {
            // ESC
            if (e.keyCode == 27) {
                if (self.localExpose === true) {
                    self.localExpose = false;
                    m.redraw();
                }
            }
            // numbers 1 - 9 take you through these module indexes
            if (e.keyCode > 48 && e.keyCode < 58) {
                var index = e.keyCode - 49;
                $('#ht-wrapper').scrollTo($('.ht-tab[data-index="' + index + '"]'), 150, {offset: -50});
            }
        });
        self.eventsOn();
        console.log("app initialized");
    };


    /*******  WIDGETS  *******/
    // When widgets are moved we need to update the model itself with the changes.
    this.moveWidget = function (from, to) {
        // modules >  column >  widget   modules[0].column[1].widget[1]
        // get widget from the from location
        var widget = self.modules()[from.module].columns[from.column].widgets[from.widget];
        /// if columns are different do as usual - same column number within different widgets also okay
        if (from.module !== to.module || from.column !== to.column) {
            // add it to the to location
            self.modules()[to.module].columns[to.column].widgets.splice(to.widget, 0, widget);
            // remove original widget
            self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);
            // remove extra col if from.column empty
            if (self.modules()[from.module].columns[from.column].widgets < 1) {
                self.modules()[from.module].columns.splice(from.column, 1);
            }
        } else {
            // manage the index numbers properly if they are within the same column
            // if from < to first delete then add
            if (from.widget < to.widget) {
                self.modules()[from.module].columns[from.column].widgets.splice(from.widget, 1);
                self.modules()[to.module].columns[to.column].widgets.splice(to.widget, 0, widget);
            } else {
                // else first add than delete
                self.modules()[to.module].columns[to.column].widgets.splice(to.widget, 0, widget);
                self.modules()[from.module].columns[from.column].widgets.splice(from.widget + 1, 1);
            }
        }
        self.reformatWidth();   // We need to redo sizes. Maybe we should push this to resize Widgets.
        self.resizeWidgets(); // After moving we will need to readjust the heights of the widgets
    };
    this.removeWidget = function (module_index, column_index, widget_index, widget_type) {
        self.modules()[module_index].columns[column_index].widgets.splice(widget_index, 1);
        if (self.modules()[module_index].columns[column_index].widgets.length === 0) {
            self.modules()[module_index].columns.splice(column_index, 1);
        }
        $('.ht-widget-btn[data-type="'+widget_type+'"]').removeClass('ht-open');

    }
    this.resizeWidgets = function () {
        var args = arguments;
        var selector = $('.ht-column');
        if (args[0]) {
            selector = args[0];
        }
        selector.each(function () {   // Iterate over colummns, we don't need to use jquery to iterate but doesn't harm.
            var setContentHeight = $(this).outerHeight(); // Height of the column
            var contentHeight = $(this)[0].scrollHeight; // Get content height, if item is not scrolling this will be same as setContentHeight, otherwise it will be bigger.
            // Calculate Total widgets height -- this is in case widgets end up not covering the entire height of the column.
            var totalHeight = 0;
            $(this).children('.ht-widget').each(function () {
                totalHeight = totalHeight + $(this).outerHeight() + 10; // 10 is for bottom margin
            });
            // for each children calculate their relative heights so that we fill the column proportionally to the existing heights of the widgets ;
            $(this).children('.ht-widget').each(function () {
                var childHeight = $(this).outerHeight();
                var newHeight;
                var headerHeight = $(this).children('.ht-widget-header').outerHeight();
                newHeight = (childHeight / (totalHeight)) * setContentHeight;
                if (newHeight > 100) {
                    $(this).css({ height: newHeight})
                    $(this).find('.ht-widget-body').css({ height: (newHeight - headerHeight) + "px"}); //.find('.widget-body-inner').css({ height : newHeight-40});
                }
                $(this).children('.ht-widget-header').show();
            });
        });
        $(".widget-body-inner").rescon({
            sizes: { "xs": 0, "sm": 300, "md": 600, "lg": 1000 }
        });
        //self.widgetize();
    };
    this.expandWidget = function (module, column, widget) {
        // create a column after this column
        self.modules()[module].columns.splice(column + 1, 0, new build.column(620, []));
        // move widget to this column
        var from = { module: module, column: column, widget: widget};
        var to = { module: module, column: column + 1, widget: 0};
        self.moveWidget(from, to);
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
        // get size of all modules
        var modlens = self.calculateContentLength();
        $(".ghost-element").css('height', adjheight);
        self.modules().map(function (module) {
            var baseWidth = 60 + 4 + 20 + 410; //  60 : width of the add column bar; 22: htab margin+border; 20 : ht-tab-content padding
            var columnW;
            if (module.bookmarks.length > 0) {
                baseWidth += 270;
            }
            module.columns.map(function (column) {
                columnW = column.width + 10; // right padding + right margin + right border
                baseWidth += columnW;
            });
            var width = (baseWidth) / (modlens);   // The ratio of this module over all modules
            var adjwidth = width * (windowWidth - (40 * self.modules().length) - adjpadding / 2); // calculate width, taking into account proper padding
            module.exposeWidth = adjwidth; // assign the new widths to the model object
        });
    }
    this.calculateContentLength = function () {
        var totalLength = 4; // ht-content padding
        self.modules().map(function (module) {
            if (module.show) {
                var thisWidth = 60 + 4 + 20 + 410; //  60 : width of the add column bar; 4: htab margin+border; 20 : ht-tab-content padding 410 for dashboard width;
                if (module.bookmarks.length > 0) {
                    thisWidth += 270;
                }
                module.columns.map(function (column) {
                    var columnW = column.width + 10; // right padding + right margin + right border
                    thisWidth += columnW;
                });
                totalLength += thisWidth;
            }
        });
        return totalLength;
    }

    // MODULES
    this.moveModule = function (from, to) {       // Move module within the expose window. Gets triggered suring sortable in expose.
        // get module object with From module index
        var module = self.modules()[from];
        // add to To index
        // if from < to first delete then add
        if (from < to) {
            self.modules().splice(from, 1);
            self.modules().splice(to, 0, module);
        } else {
            // else first add than delete
            self.modules().splice(to, 0, module);
            self.modules().splice(from + 1, 1);
        }
        m.redraw(); // We shouldn't need to redraw but apparently we do. Need to check that.
    };
    this.addModule = function () {
        var clrs = ["emerald-d", "river-d", "turquaz-d", "wisteria-d", "asphalt-l", "sunflower-d", "carrot-d", "alizarin-d" ];
        var lastModuleColor = self.modules()[self.modules().length - 1].color;
        var getNonIdenticalColor = function redo() {
            var randomNumber = Math.floor(Math.random() * clrs.length);
            var oldColor = lastModuleColor;
            var newColor = clrs[randomNumber];
            if (newColor === oldColor) {
                redo();
            } else {
                return newColor;
            }
        }
        var color = getNonIdenticalColor();
        // This will eventually be selected from lists
        var moduleId = Math.floor((Math.random() * 100000) + 1) + 3;
        var col1Id = Math.floor((Math.random() * 100000) + 1) + 6;
        var col2Id = Math.floor((Math.random() * 100000) + 1) + 6;
        var newModule = new build.module("Added Module " + moduleId, moduleId, color, [
            new build.column(620, [
                new build.widget(col1Id, "Widget " + col1Id, "comments"),
                new build.widget(col2Id, "Widget " + col2Id, "activity")
            ])
        ])
        self.modules().push(newModule);
        self.applyModules();
        self.temp.scrollTo = '.ht-tab[data-id="' + moduleId + '"]';
        console.log("New Module", newModule)
    };
    this.removeModule = function (module_index) {
        // unload, turn events off etc.
        if (self.modules()[module_index].bookmarked) {
            // hide module
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

    // COLUMNS
    this.addCol = function (module_index) {
        // is there an empty column?
        var empty = false;
        self.modules()[module_index].columns.map(function (item) {
            if (item.widgets.length < 1) {
                empty = true;
            }
        });
        if (!empty) {
            self.modules()[module_index].columns.push({ width: 300, widgets: [], new: true});
            self.reformatWidth();
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
    };
    this.removeExtraCols = function () {
        self.modules().map(function (modules, modules_index) {
            modules.columns.map(function (column, column_index, array) {
                if (column.widgets < 1) {
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
            var ht_head_width = window_width; // allowing room for expose buttons, element width is px
            var ht_content_width = totalLength;
            var wrapper_width = window_width;
            $('.ht-head-wrapper').css({ width: window_width + 'px' });
            $('#ht-head').css({ width: ht_head_width + 'px' });
            $('#ht-wrapper').css({ width: wrapper_width + 'px' });
            $('#ht-content').css('width', ht_content_width + 'px');
            // Adjust s lider on changes
            var remainder = 0;
            var actual_ht_head = 0;
            for (var i = 0; i < self.modules().length; i++) {
                var o = self.modules()[i];
                var use_width = (window_width > ht_content_width) ? window_width : ht_content_width;
                // use width is width of the whole page
                var width = (($('.ht-tab[data-id="' + o.id + '"]').outerWidth() + 4)) / (use_width - 4) * ht_head_width + remainder;
                var adjWidth = Math.floor(width);
                actual_ht_head += adjWidth;
                remainder = width - adjWidth;
                $('.ht-hdiv[data-hid="' + o.id + '"]').css({ width: adjWidth + 'px'});
                // update column widths in the model
            }
            $('#ht-slider').width(Math.floor(wrapper_width * actual_ht_head / ($('#ht-content').outerWidth() + 0)) + 'px') // as usual, I have no idea why this number works
                .css('left', $('#ht-wrapper').scrollLeft() * $('#ht-head').outerWidth() / $('#ht-content').outerWidth() + 'px');
            self.eventsOn();
            self.fill();
        }
    };

    this.fill = function () {
        $(".ht-fill").each(function () {
            var parent_w = $(this).parent().width();
            $(this).width(parent_w)
                .find('.input-group, .form-group').css('width', '100%')
                .find('.input-group-btn').css('text-align', 'left')
        })
    }
    this.reformatHeight = function () {
        if (self.canReformat) {
            var window_height = $(window).height() + 15;

            // heights :
            var ht_wrapper_height = window_height - 65; // Remaining elements height is 65px, ht-head and ht-slider-wrap + navbar
            var ht_tab_height = ht_wrapper_height - 23; // wrapping parent ht-content has a total of 20px padding on top and bottom;
            var ht_tab_content_height = ht_tab_height - 1;
            var ht_column_height = ht_tab_content_height - 10;
            $('.ht-tab').css({ height: ht_tab_height + 'px'}); // tab h
            $('.ht-tab-content').css({ height: ht_tab_content_height + 'px'}); // content h
            $('.ht-column').css({height: ht_column_height});  // widget column heigh
            $('.ht-add-column').css({height: (ht_column_height - 7) + 'px'}); // new col button height
            $('#ht-wrapper').css({ height: ht_wrapper_height + "px" }); // content h
            $('.ht-aside').css({ height: window_height + 'px' })
            $('.dashboardList').css({ height: (ht_column_height - 300) + 'px' })

            self.resizeWidgets();
            self.eventsOn();
//                console.log("reformat height ran");
        }
    };

    this.reformat = function () {
        self.reformatHeight();
        self.reformatWidth();
    };
    this.widgetInit = function (element, isInit) {
        if (self.temp.scrollTo && $(self.temp.scrollTo).get(0)) {
            $('#ht-wrapper').scrollTo($(self.temp.scrollTo), 150, {offset: -50 });
        }
        self.resizeWidgets();
        var module = self.modules()[self.modules().length - 1];
        var column = module.columns[module.columns.length - 1];
        var widget = column.widgets[column.widgets.length - 1];
        var id = widget.id;
        if ($(element).attr('data-id') == id) {
            self.temp.scrollTo = "";
        }
        self.widgetize();
    }
    self.saveColumnSize = function () {
        for (var i = 0; i < self.modules().length; i++) {
            var o = self.modules()[i];
            o.columns.map(function (item, index, array) {
                item.width = ($('.ht-tab[data-id="' + o.id + '"]').find('.ht-column[data-index=' + index + ']')).outerWidth();
            });
        }
    };
    this.loadLink = function (e) {
        var event = e || window.event;
        var link = $(event.target);
        var type = link.closest('li').attr('data-type');
        var title = link.text();
        var index = link.closest('.ht-tab').attr('data-index');
//          console.log("event : " , event);
//          console.log("type : " , type);
        //checks to see if the link text is clicked, if so set link to link's parent
        if (link.hasClass('ht-widget-btn-txt')) {
            link = link.parent();
        }
        var open = false;
        self.modules()[index].columns.map(function (col, c_index, c_array) {
            col.widgets.map(function (w, w_index, w_array) {
                if (w.type == type) {
                    w_array.splice(w_index, 1);
                    link.removeClass('ht-open');
                }
                // if this is the last widget of the last column
                if (c_index == c_array.length - 1 && w_index == w_array.length - 1) {
                    // and widget is still not found
                    if (!open) {
                        var randomNumber = Math.floor(Math.random() * 10000);
                        var widget = {
                            "id": randomNumber,
                            "title": title,
                            "type": type,
                            "data": "",
                            "closable": true,
                            "expandable": true,
                            "height": 300,
                            "display": true,
                            "hideHeader": false,
                            "content": "",
                            "css": ""
                        }
                        c_array.push(new build.column(620, [ widget ]));
                        var selector = '.ht-widget[data-id=' + randomNumber + ']';
                        self.temp.scrollTo = selector;
                        link.closest('li').addClass('ht-open');
                    }
                }
            })
        })
        self.applyModules();
        self.reformatWidth();
    }
    this.moduleViewToggle = function (event) {
        var event = event || window.event;

        //Checks to see if the click is on the text in the bookmark, if so grab parent
        if (event.toElement.className == "ht-bookmark-content") {
            var module = $(event.target).parent();
        }

        //Otherwise just use the module
        else {
            var module = $(event.target);
        }

        var moduleID = module.attr('data-mid');
//             console.log("ModulID", moduleID);
        // Toggle view
        self.modules().map(function (mod) {
//                 console.log(mod.id)
            if (mod.id == moduleID) {
                mod.show = !mod.show;
            }
        })
        // toggle bookmark view
        self.modules()[0].bookmarks.map(function (b) {
            if (b.id == moduleID) {
                b.open = !b.open;
            }
        })
    }

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
            }
            self.modules()[0].bookmarks.push(bookmark);
            module.bookmarked = true;
        }
    }

    // ASIDE TAB
    this.asideInit = function () {
//             console.log("Aside Init ran");
        self.reformatWidth();
    }
    this.asideClick = function () {
        self.asideOpen = !self.asideOpen;
    }


    // NOTIFICATIONS
    this.notifyDo = function (todo) {
        self[todo.name](todo.parameters);
    }
    this.dismissNotify = function (id) {
        notify.list.map(function (item, index, array) {
            if (item.id === id) {
                array.splice(index, 1);
            }
        })
    }
    this.openProject = function (args) {
        self.modules().map(function (module) {
            if (module.id === args[0]) {
                module.show = true;
                self.temp.scrollTo = '.ht-tab[data-id="' + module.id + '"]';
            }
            self.dismissNotify(args[1]);
            self.asideOpen = false;
        })
    }
    this.gotoProject = function (id) {
        self.modules().map(function (module) {
            if (module.id === id) {
                self.temp.scrollTo = '.ht-tab[data-id="' + module.id + '"]';
            }
        })
    }

    // FOCUS MODE
    this.focusMode = false;
    this.focus = { }
    this.focusOn = function (widget_type, widget_id, widget_title) {
        self.focus = {};
        self.focus.type = widget_type;
        self.focus.id = widget_id;
        self.focus.title = widget_title;
        console.log("Focus Ran with ", self.focus);
        self.focusMode = true;


    }
    this.focusInit = function () {
        self.reformatWidth();
    }


    // MOBILE
    this.mobileInit = function () {
        console.trace();
        var dist = 150;

        $(".ht-mobile-widget").swipe({
            //Generic swipe handler for all directions
            swipe: function (event, direction, distance, duration, fingerCount) {
                var target_module = $(this).closest(".ht-mobile-module").attr("data-index");
                var element;
                switch (direction) {
                    case "up" :
//                            console.log(target_module);
                        element = $(".ht-mobile-module[data-index=" + (parseInt(target_module) + 1) + "]")
                        if (element.length > 0) {
                            $('#ht-mobile-content').scrollTo(element, dist, {offset: 0});
                        }
                        break;
                    case "down":
//                            console.log(target_module);
                        element = $(".ht-mobile-module[data-index=" + (parseInt(target_module) - 1) + "]")
                        if (element.length > 0) {
                            $('#ht-mobile-content').scrollTo(element, dist, {offset: 0});
                        }
                        break;
                    case "left" :
//                            console.log(target_module);
                        var element = $(this).next();
                        if (element.length > 0) {
                            $('.ht-mobile-module[data-index=' + target_module + ']').scrollTo(element, dist, {offset: 0});
                        }
                        break;
                    case "right" :
//                            console.log(target_module);
                        var element = $(this).prev();
                        if (element.length > 0) {
                            $('.ht-mobile-module[data-index=' + target_module + ']').scrollTo(element, dist, {offset: 0});
                        }
                        break;

                }
//                        console.log("direction", direction, "fingerCount", fingerCount);

            }
        });
        self.canReformat = false;
    }
    this.mobileModuleInit = function () {
        var mobileContentHeight = $(window).height() - 50;
        var mobileContentWidth = $(window).width();
//             console.log(mobileContentHeight);
        $('.ht-mobile-module').css({'height': mobileContentHeight + 'px', 'width': mobileContentWidth + 'px'})
        $('#ht-mobile-content').css({'height': mobileContentHeight + 'px', 'width': mobileContentWidth + 'px'})
    }
    this.mobileExposeInit = function () {
        var mobileContentHeight = $(window).height();
        $('#ht-mobile-expose').css({'height': mobileContentHeight + 'px'});
    }
    this.mobileWidgetInit = function (module_index) {
        var mobileContentHeight = $(window).height() - 40;
        var mobileContentWidth = $(window).width();
        $('.ht-mobile-widget').css({ 'height': mobileContentHeight + 'px', width: mobileContentWidth + 'px'})
        // calculate module width based on total widgets, this needs to refresh every time a widget is loaded.
        var totalWidgets = 1; // title page is one widget;
        self.modules()[module_index].columns.map(function (column) {
            totalWidgets += column.widgets.length;
        })
        $('.ht-mobile-module[data-index=' + module_index + ']').children('.ht-mobile-module-inner').css('width', mobileContentWidth * totalWidgets);
    }
    this.mobileExposeToggle = function () {
        self.mobileExpose = !self.mobileExpose;
    }

}
build.view = function (ctrl) {
    if (ctrl.layout() < 481) {
        if (ctrl.mobileExpose) {
            return m("#ht-mobile-expose", { config: ctrl.mobileExposeInit}, [
                m(".ht-mobile-expose-header.pull-right", [
                    m('.fa.fa-times.text-white', { onclick: ctrl.mobileExposeToggle })
                ]),
                m(".ht-mobile-expose-wrap", [
                    ctrl.modules().map(function (module, module_index, module_array) {
                        return m('.ht-mobile-expose-module.clearfix', {"class": 'bg-' + module.color }, [
                            m("i.fa.fa-times.pull-right", { onclick: function () {
                                ctrl.removeModule(module_index);
                            } }, ""),
                            m("", module.title)
                        ])
                    })
                ])
            ])
        } else {
            return m("#ht-mobile-wrapper", { config: ctrl.mobileInit}, [
                m("#ht-mobile-header", [
                    m('#ht-mobile-title', "Htabs Mobile Version"),
                    m('#ht-mobile-menu', [
                        m('i.fa.fa-bars', { onclick: ctrl.mobileExposeToggle })
                    ])
                ]),
                m("#ht-mobile-content", [
                    ctrl.modules().map(function (module, module_index, module_array) {
                        var clrs = ["maroon", "purple", "fuchsia", "red", "orange", "yellow", "aqua", "olive", "teal", "green", "lime", "blue", "navy"];


                        return m('.ht-mobile-module', { config: ctrl.mobileModuleInit, "class": 'bg-' + module.color, "data-index": module_index}, [
                            m('.ht-mobile-module-inner', [
                                m('.ht-mobile-widget', { "class": module.css, "data-id": -1}, [
                                    m('div', {'class': 'ht-mobile-module-title'}, module.title),
                                    m('div', {'class': 'ht-mobile-module-content'}, "Lorem fake content goes here ipsum"),
                                    module.columns.map(function (column) {
                                        return column.widgets.map(function (widget, widget_index, widget_array) {
                                            var randomNumber = Math.floor(Math.random() * clrs.length);
                                            return m('.ht-mobile-widget-list.clearfix', {"class": 'bg-' + clrs[randomNumber],
                                                onclick: function () {
                                                    // console.log(widget_index);
                                                    var element = $('.ht-mobile-widget[data-id=' + widget.id + ']');
                                                    $('.ht-mobile-module[data-index=' + module_index + ']').scrollTo(element, 150, {offset: 0});
                                                }
                                            }, [
                                                m("i.fa.fa-times.pull-right", { onclick: function () {
                                                    ctrl.removeModule(module_index);
                                                } }, ""),
                                                m("", widget.title)
                                            ]);
                                        });
                                    })
                                ]),
                                module.columns.map(function (column) {
                                    return column.widgets.map(function (widget, widget_index, widget_array) {
                                        return m('.ht-mobile-widget', { config: function () {
                                            ctrl.mobileWidgetInit(module_index)
                                        }, 'style': 'background:white', "data-id": widget.id }, [
                                            m('.ht-mobile-widget-title', widget.title),
                                            (function () {
                                                return app[widget.type].view(ctrl.controllers[widget.id])
                                            })()
                                        ])
                                    })
                                })
                            ])

                        ])
                    })
                ])

            ])
        }
    } else {

        if (ctrl.localExpose) {
            return [
                m("#exposeDiv.animated.fadeIn", [
                    m(".exposeClose", [m("i.fa.fa-times", { onclick: ctrl.endExpose })]),
                    m(".expose-content", { config: ctrl.exposeInit }, [
                        m(".expose-modules", [
                            ctrl.modules().map(function (module, module_index, module_array) {
                                if (module.show) {
                                    if (module.minimize) {
                                        return [" ", m(".ht-expose-tab.ht-tab-minimized", {'data-index': module_index, 'data-id': module.id, style: "height : " + module.exposeHeight}, [
                                            m(".ht-tab-header", {  "data-bg": module.color, "class": 'bg-' + module.color }, [
                                                m(".ht-windowBtn", [
                                                    m("i.fa.fa-times", { onclick: function () {
                                                        ctrl.removeModule(module_index);
                                                    }}),
                                                    m("i.fa.fa-plus", { onclick: function () {
                                                        ctrl.toggleModule(module_index, false);
                                                    }})
                                                ])
                                            ]),
                                            m(".ht-expose-tab-content", {"class": 'bg-' + module.color }, [m("h3.rotate.rotatedText-expose", module.title)])
                                        ])];
                                    } else {
                                        return [" ", m(".ht-expose-tab", {'data-index': module_index, "data-bg": module.color, "class": 'bg-' + module.color, 'data-id': module.id, style: "min-width: 0; width: " + module.exposeWidth + "px; height : " + module.exposeHeight + "px; " }, [
                                            m(".ht-expose-inner", {  "data-bg": module.color }, [
                                                m("h3", module.title),
                                                m(".ht-expose-btn", [
                                                    m('.btn.btn-default.btn-xs', { onclick: function () {
                                                        ctrl.removeModule(module_index);
                                                    }}, m("i.fa.fa-times")),
                                                    m('.btn.btn-default.btn-xs', { onclick: function () {
                                                        ctrl.toggleModule(module_index, true);
                                                    }}, m("i.fa.fa-minus"))
                                                ])
                                            ])
                                        ])];
                                    }
                                }
                            })
                        ]),
                        m('.expose-actions', [
                            m('.expose-button', { onclick: ctrl.saveWorkspace}, [ m('i.fa.fa-save'), m("span", "Save Workspace")])
                        ])
                    ])
                ])
            ];
        } else {
            if (ctrl.focusMode) {
                return m('#ht-focus-wrap.animated.fadeIn', { config: ctrl.focusInit }, [
                    m('.ht-dismiss', { onclick: function () {
                        ctrl.focusMode = false;
                    } }, [ m('i.fa.fa-times')]),
                    m('h1.page-header', ctrl.focus.title),
                    app[ctrl.focus.type].view(ctrl.controllers[ctrl.focus.id])
                ])
            } else {
                return [
                    m('.navbar.navbar-fixed-top.ht-navbar', [
                        m('.container-fluid', [
                            m('.row', [
                                m('.col-xs-2.col-sm-4', [
                                    m('.hidden-xs.navbar-brand', "Open Science FrameWork"),
                                    m('.visible-xs.navbar-brand', "OSF")

                                ]),
                                m('.col-xs-5.col-sm-4', [
                                    m('.navbar-form.navbar-left[role="search"].ht-fill', { style: 'padding: 0;'}, [
                                        m(".form-group", [
                                            m(".input-group", [
                                                m("input.form-control.ht-input-search.input-sm.b-r-md.p-sm[placeholder='Search all things...'][type='text']"),
                                                m("span.input-group-btn", [
                                                    m("button.ht-btn-search.btn.btn-sm.b-r-md[type='submit']", [m("i.fa.fa-search")])
                                                ])
                                            ])
                                        ])
                                    ])
                                ]),
                                m('.col-xs-5.col-sm-4', [
                                    m("div.appBtnDiv", [
                                        m("span.exposeOpen.appBtn", {onclick: ctrl.beginExpose }, [m('i.fa.fa-th-large')]),
                                        m("span.appBtn", {onclick: ctrl.addModule }, [m('i.fa.fa-plus')]),
                                        m("span.appBtn", { onclick: ctrl.asideClick  }, [
                                            m('i.fa.fa-bell.animated.tada', { style: "color:orange;"}),
                                            (function () {
                                                if (notify.list.length > 0) {
                                                    return m('span.ht-badge', notify.list.length);
                                                }
                                            }())
                                        ]),
                                        m("span.appBtn", [m('i.fa.fa-sign-out')])
                                    ])
                                ])
                            ])


                        ])
                    ]),
                    m(".ht-head-wrapper", [
                        m("[id='ht-head']", [
                            ctrl.modules().map(function (module, module_index, module_array) {
                                if (module.show) {
                                    return m(".ht-hdiv.bg-" + module.color, { "data-hid": module.id}, [m("span.ht-hdiv-content", module.title)]);
                                }
                            })
                        ])
                    ]),
                    (function () {
                        if (ctrl.asideOpen) {
                            return m('.ht-aside.bg-asphalt-l', {config: ctrl.asideInit }, [
                                m('.ht-dismiss', { onclick: function () {
                                    ctrl.asideOpen = false;
                                } }, [ m('i.fa.fa-times')]),
                                m('h2.skinnyFont.t-a-c.t-light', "Notifications"),
                                notify.view(ctrl)
                            ])
                        }
                    }()),
                    m(".ht-slider-wrap", [m("[id='ht-slider']")]),
                    m("[id='ht-wrapper']", { config: ctrl.init }, [
                        m("[id='ht-content']", {config: ctrl.reformat }, [
                            ctrl.modules().map(function (module, module_index, module_array) {
                                if (module.show) {
                                    if (module.minimize) {
                                        return [m(".ht-tab.ht-tab-minimized.b-r-xs", {'data-index': module_index, 'data-id': module.id, "class": 'bg-' + module.color }, [
                                            m(".ht-tab-header", {  "data-bg": module.color, "class": 'bg-' + module.color }, [
                                                m(".ht-windowBtn", [
                                                    m("i.fa.fa-times", { onclick: function () {
                                                        ctrl.removeModule(module_index);
                                                    }}),
                                                    m("i.fa.fa-plus", { onclick: function () {
                                                        ctrl.toggleModule(module_index, false);
                                                    } })
                                                ])
                                            ]),
                                            m(".ht-tab-content.b-r-xs", {style: " max-height : 100px"  }, [m("h3.rotate.rotatedText", module.title)])
                                        ])];
                                    } else {
                                        return [m(".ht-tab.b-r-xs", { 'class': module.css + ' bg-' + module.color, 'data-index': module_index, 'data-id': module.id}, [
                                            m(".ht-tab-content.b-r-xs", { 'class': ' bg-' + module.color }, [
                                                m(".ht-column.no-resize.no-border", {'data-index': -1, 'style': "width:400px"}, [
                                                    (function () {
                                                        var marked = "";
                                                        if (module.bookmarked) {
                                                            marked = "ht-opaque-green";
                                                        }
                                                        if (module.id > 0) {
                                                            return m('.ht-module-menu', [
                                                                m('i.fa.fa-times', { onclick: function () {
                                                                    ctrl.removeModule(module_index);
                                                                }}),
                                                                m('i.fa.fa-minus', { onclick: function () {
                                                                    ctrl.toggleModule(module_index, true);
                                                                }}),
                                                                m('i.fa.fa-bookmark', { "class": marked, "data-mindex": module_index, onclick: ctrl.bookmarkToggle })
                                                            ])
                                                        }
                                                    }()),
                                                    m(".ht-widget.no-border.no-resize", { config: ctrl.widgetInit, 'data-index': -1, "style": "height : 100%; padding: 15px;", "class": "ui-widget ui-widget-content ui-helper-clearfix ht-inverted"}, [
                                                        m(".ht-widget-body", [ m("div.widget-body-inner.ht-title-widget", { id: "dashboardwidget" + module.id }, [
                                                                m('h2.m-t-xl.m-b-md', module.title),
                                                                m('p.m-t-md.m-b-xl', module.about),
                                                                m('ul.dashboardList.list-unstyled.m-t-lg', [
                                                                    module.links.map(function (link) {
                                                                        return m('li', { "class": "ht-widget-btn " + link.css + " " + link.state, 'data-type': link.action, onclick: ctrl.loadLink }, [m('i', {'class': "ht-widget-icon uppercase pull-left fa " + link.icon}), m('span', {'class': "ht-widget-btn-txt"}, link.title)]);
                                                                    })
                                                                ])
                                                            ]
                                                        ) ])
                                                    ])
                                                ]),
                                                (function () {
                                                    if (module.bookmarks.length > 0) {
                                                        return m(".ht-column.no-resize.no-border", {'data-index': -1, 'style': "width:260px"}, [
                                                            m(".ht-widget.no-border.no-resize", { config: ctrl.widgetInit, 'data-index': -1, "style": "height : 100%; padding: 15px;", "class": "ui-widget ui-widget-content ui-helper-clearfix ht-inverted"}, [
                                                                m(".ht-widget-body", [ m("div.widget-body-inner", { id: "dashboardwidget" + module.id }, [
                                                                        m('h3.f-3.text-center', "Bookmarks"),
                                                                        module.bookmarks.map(function (b) {
                                                                            var status = "bg-opaque-white";
                                                                            if (b.open) {
                                                                                var status = "bg-" + b.color
                                                                            }
                                                                            return m(".ht-bookmark", { "class": status, "data-mid": b.id, onclick: ctrl.moduleViewToggle}, [
                                                                                m(".ht-bookmark-content", b.title)
                                                                            ])
                                                                        })
                                                                    ]
                                                                ) ])
                                                            ])
                                                        ])
                                                    }
                                                }()),
                                                module.columns.map(function (column, column_index, column_array) {
                                                    if (column.widgets.length > 0 || column.new) {
                                                        // If the view is not narrow in height show full.
                                                        return m(".ht-column", {'data-index': column_index, 'style': "width:" + column.width + "px"}, [
                                                            (function () {
                                                                if (column.widgets.length > 0) {
                                                                    return column.widgets.map(function (widget, widget_index, widget_array) {
                                                                        var noResize = "";
                                                                        if (widget_index === column.widgets.length - 1) {
                                                                            noResize = "no-resize";
                                                                        }
                                                                        if (widget.display) {
                                                                            return m(".ht-widget", { id: widget.id, config: ctrl.widgetInit, 'data-index': widget_index, 'data-id': widget.id, "style": "height : " + widget.height + "px", "class": "ui-widget ui-helper-clearfix " + widget.css + " " + noResize}, [
                                                                                (function () {
                                                                                    if (!widget.hideHeader) {
                                                                                        return m(".ht-widget-header.bg-opaque-white-md", [
                                                                                            widget.title,
                                                                                            m(".ht-widget-actions", [
                                                                                                m("i.fa.fa-expand.ht-widget-expand", { onclick: function () {
                                                                                                    ctrl.expandWidget(module_index, column_index, widget_index);
                                                                                                } }),
                                                                                                m("i.fa.fa-circle-o", { onclick: function () {
                                                                                                    ctrl.focusOn(widget.type, widget.id, widget.title);
                                                                                                } }),
                                                                                                (function () {
                                                                                                    if (widget.closable) {
                                                                                                        return m("i.fa.fa-times.ht-widget-remove", { onclick: function () {
                                                                                                            ctrl.removeWidget(module_index, column_index, widget_index, widget.type)
                                                                                                        }});
                                                                                                    }
                                                                                                })()
                                                                                            ])
                                                                                        ]);
                                                                                    }
                                                                                })(),

                                                                                m(".ht-widget-body.bg-white", [m("div.widget-body-inner", { id: "widget" + widget.id, config: ctrl.reformat },
                                                                                    (function () {
                                                                                        return app[widget.type].view(ctrl.controllers[widget.id]);
                                                                                    })()
                                                                                ) ]),
                                                                                m('.ht-resize-zone')
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
                                                    (function () {
                                                        if (module.columns.length > 0 && module.columns[module.columns.length - 1].widgets.length < 1) {
                                                            return m(".add-column", { onclick: function () {
                                                                module.columns.pop()
                                                            } }, [m("i.fa.fa-minus")], m("[id='ht-content']", { config: ctrl.reformat }));
                                                        } else {
                                                            return m(".add-column", { onclick: function () {
                                                                ctrl.addCol(module_index);
                                                            } }, [m("i.fa.fa-plus")], m("[id='ht-content']", {config: ctrl.reformat }));
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
        }
    }
    ;
};


},{"../components/about/about":2,"../components/activity/activity":3,"../components/comments/comments":4,"../components/components/components":5,"../components/dashboard/dashboard":6,"../components/files/files":7,"../components/first/first":8,"../components/forks/forks":9,"../components/logs/logs":10,"../components/rescon/rescon":11,"../components/second/second":12,"../components/statistics/statistics":13,"../components/third/third":14,"../components/wiki/wiki":15}],2:[function(require,module,exports){
var about = {};

about.html= m.prop("");
m.request({method: "GET", url: "../components/about/about.html", deserialize: function(value){ return value;  }}).then(about.html);

about.controller = function(){
    this.html = about.html;
}

about.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = about;
},{}],3:[function(require,module,exports){
var activity = {};

activity.html= m.prop("");
m.request({method: "GET", url: "../components/activity/activity.html", deserialize: function(value){ return value;  }}).then(activity.html);

activity.controller = function(){
    this.html = activity.html;
}

activity.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = activity;
},{}],4:[function(require,module,exports){
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
    return [ m('.visible-xs.ht-widgetize', { "data-color" : "bg-flat-navy" }, [
        m('.p-md.text-center.t-light.no-flow', [
            m('h2', ctrl.comments().length),
            m('p.lead', "Comments "),
            m('.f-3',[
                m('div.b-b-xs.m-b-xs', "Latest: "),
                m("span.f-6", ctrl.comments()[0].username),
                m('span', " said '"),
                m("span", ctrl.comments()[0].content),
                m('span', "' on "),
                m("i", ctrl.comments()[0].date)
            ])
        ])
    ]),
        m('.hidden-xs.ht-page.p-lg', [
            m(".container-fluid", [m(".row", [
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
            ])

            ])
        ])

    ]
}

module.exports = comments;
},{"../logs/logs":10}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
var first = {};

first.html= m.prop("");
m.request({method: "GET", url: "../components/first/first.html", deserialize: function(value){ return value;  }}).then(first.html);

first.controller = function(){
    this.html = first.html;
}

first.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = first;
},{}],9:[function(require,module,exports){
var forks = {};

forks.html= m.prop("");
m.request({method: "GET", url: "../components/forks/forks.html", deserialize: function(value){ return value;  }}).then(forks.html);

forks.controller = function(){
    this.html = forks.html;
}

forks.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = forks;
},{}],10:[function(require,module,exports){

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
    this.modalShow = false;
    this.modal = m.prop({
        "header" : "Modal Example",
        "body" : " This is a modal, which requires an action before the user can continue working on other aspects of this widget. You can dismiss it or choose and action from below",
        "actions" : "Footer"
    });
    this.alertShow = false;
    this.alert = m.prop({
        "content" : "This is an alert. Be mindful about something or another"
    });
}

// Log layout, loads directly from the model, not through the controller.
logs.view = function(ctrl){
    if(ctrl.modalShow){
        return m('.ht-modal-wrapper.animated.flipInX', [
            m('.ht-dismiss', { onclick : function(){ ctrl.modalShow = false; } }, [ m ('i.fa.fa-times')]),
            m('.ht-modal-header', ctrl.modal().header),
            m('.ht-modal-body', ctrl.modal().body),
            m('.ht-modal-footer', ctrl.modal().actions)
        ])
    } else {
        return [
            (function(){
                if(ctrl.alertShow) {
                    return m('.ht-alert-wrapper.animated.fadeInDown', [
                        m('.ht-alert-dismiss.pull-right', { onclick: function () {
                            ctrl.alertShow = false;
                        } }, [ m('i.fa.fa-times')]),
                        m('.ht-alert-content', ctrl.alert().content),
                    ])
                }
            }()),
            m('.visible-xs.ht-widgetize', { "data-color" : "bg-flat-blue" }, [
                m('.p-md.text-center.t-light.no-flow', [
                    m('h2', logs.List().length),
                    m('p.lead', "Recent Activities"),
                    m('',[
                        m('div.b-b-xs.m-b-xs', "Latest: "),
                        m("a[href='user/1']", logs.List()[0].logUser),
                        " ",
                        m("span.logText", logs.List()[0].logText),
                        m("i", logs.List()[0].logContent)
                    ])
                ])
            ]),
            m('.hidden-xs.ht-page', [
                m('.p-md', [
                    m('.btn.btn-default.m-b-md', { onclick : function(){ ctrl.modalShow = true; }}, "Show Modal"),
                    m('.btn.btn-default.m-b-md', { onclick : function(){ ctrl.alertShow = true; }}, "Show Alert"),
                    m("table.table.table-condensed", [
                        m("tbody", [
                            logs.List().map(function (log, index) {
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
                ])
            ])

        ]
    }
}

module.exports = logs;
},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
var second = {};

second.html= m.prop("");
m.request({method: "GET", url: "../components/second/second.html", deserialize: function(value){ return value;  }}).then(second.html);

second.controller = function(){
    this.html = second.html;
}

second.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = second;
},{}],13:[function(require,module,exports){
var statistics = {};

statistics.html= m.prop("");
m.request({method: "GET", url: "../components/statistics/statistics.html", deserialize: function(value){ return value;  }}).then(statistics.html);

statistics.controller = function(){
    this.html = statistics.html;
}

statistics.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = statistics;
},{}],14:[function(require,module,exports){
var third = {};

third.html= m.prop("");
m.request({method: "GET", url: "../components/third/third.html", deserialize: function(value){ return value;  }}).then(third.html);

third.controller = function(){
    this.html = third.html;
}

third.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = third;
},{}],15:[function(require,module,exports){
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
