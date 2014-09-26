// Load components and add them to the app namespace
var app = {};
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

/*******  VIEW   *******/
var view = function (ctrl) {

    /*******  MOBILE LAYOUT  *******/
    if (ctrl.layout() < 481) {
        if (ctrl.mobileExpose) {
            return m("#ht-mobile-expose", { config: ctrl.mobileExposeInit}, [
                m(".ht-mobile-expose-header.pull-right", [
                    m('.fa.fa-times.text-white', { onclick: ctrl.mobileExposeToggle })
                ]),
                m(".ht-mobile-expose-wrap", [
                    ctrl.modules().map(function (module, module_index) {
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
                    ctrl.modules().map(function (module, module_index) {
                        var clrs = ["maroon", "purple", "fuchsia", "red", "orange", "yellow", "aqua", "olive", "teal", "green", "lime", "blue", "navy"];
                        return m('.ht-mobile-module', { config: ctrl.mobileModuleInit, "class": 'bg-' + module.color, "data-index": module_index}, [
                            m('.ht-mobile-module-inner', [
                                m('.ht-mobile-widget', { "class": module.css, "data-id": -1}, [
                                    m('div', {'class': 'ht-mobile-module-title'}, module.title),
                                    m('div', {'class': 'ht-mobile-module-content'}, "Lorem fake content goes here ipsum"),
                                    module.columns.map(function (column) {
                                        return column.widgets.map(function (widget) {
                                            var randomNumber = Math.floor(Math.random() * clrs.length);
                                            return m('.ht-mobile-widget-list.clearfix', {"class": 'bg-' + clrs[randomNumber],
                                                onclick: function () {
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
                                    return column.widgets.map(function (widget) {
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
        /*******  FULL EXPOSE   *******/
        if (ctrl.localExpose) {
            return [
                m("#exposeDiv.animated.fadeIn", [
                    m(".exposeClose", [m("i.fa.fa-times", { onclick: ctrl.endExpose })]),
                    m(".expose-content", { config: ctrl.exposeInit }, [
                        m(".expose-modules", [
                            ctrl.modules().map(function (module, module_index) {
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
            /*******  FOCUS VIEW *******/
            if (ctrl.focusMode) {
                return m('#ht-focus-wrap.animated.fadeIn', { config: ctrl.focusInit }, [
                    m('.ht-dismiss', { onclick: function () {
                        ctrl.focusMode = false;
                    } }, [ m('i.fa.fa-times')]),
                    m('h1.page-header', ctrl.focus.title),
                    app[ctrl.focus.type].view(ctrl.controllers[ctrl.focus.id])
                ])
            } else {
                /*******  FULL VIEW *******/
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
                                                if (ctrl.notify.list.length > 0) {
                                                    return m('span.ht-badge', ctrl.notify.list.length);
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
                            ctrl.modules().map(function (module) {
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
                                ctrl.notify.view(ctrl)
                            ])
                        }
                    }()),
                    m(".ht-slider-wrap", [m("[id='ht-slider']")]),
                    m("[id='ht-wrapper']", { config: ctrl.init }, [
                        m("[id='ht-content']", {config: ctrl.reformat }, [
                            ctrl.modules().map(function (module, module_index) {
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
                                        return [m(".ht-tab.b-r-xs", { config: function() { ctrl.moduleInit(module_index); }, 'class': module.css + ' bg-' + module.color, 'data-index': module_index, 'data-id': module.id}, [
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
                                                    m(".ht-widget.no-border.no-resize", { 'data-index': -1, "style": "height : 100%; padding: 15px;", "class": "ui-widget ui-widget-content ui-helper-clearfix ht-inverted"}, [
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
                                                                                status = "bg-" + b.color
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
                                                module.columns.map(function (column, column_index) {
                                                    if (column.widgets.length > 0 || column.new) {
                                                        // If the view is not narrow in height show full.
                                                        return m(".ht-column", {'data-index': column_index, 'style': "width:" + column.width + "px"}, [
                                                            (function () {
                                                                if (column.widgets.length > 0) {
                                                                    return column.widgets.map(function (widget, widget_index) {
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
                                                                                                m("i.fa.ht-widget-expand", { "class": 'fa-'+widget.expandCss, onclick : function(){ ctrl.expandWidget(module_index, column_index, widget_index );} } ),
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
                                                                                m(".ht-widget-body.bg-white", [m("div.widget-body-inner", { id: "widget" + widget.id },
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
};
module.exports = view;