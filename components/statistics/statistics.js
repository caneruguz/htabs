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