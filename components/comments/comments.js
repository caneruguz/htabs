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