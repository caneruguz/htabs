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