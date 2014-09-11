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