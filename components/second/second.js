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