var registrations = {};

registrations.html= m.prop("");
m.request({method: "GET", url: "../components/registrations/registrations.html", deserialize: function(value){ return value;  }}).then(registrations.html);

registrations.controller = function(){
    this.html = registrations.html;
}

registrations.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = registrations;