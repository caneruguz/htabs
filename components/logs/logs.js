
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