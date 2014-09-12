var rescon = {};

rescon.html= m.prop("");
m.request({method: "GET", url: "../components/rescon/rescon.html", deserialize: function(value){ return value;  }}).then(rescon.html);

rescon.controller = function(){
    this.html = rescon.html;
}

rescon.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = rescon;