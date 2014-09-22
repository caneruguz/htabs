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