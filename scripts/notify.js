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

module.exports = notify;