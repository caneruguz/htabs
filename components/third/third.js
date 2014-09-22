var third = {};

third.html= m.prop("");
m.request({method: "GET", url: "../components/third/third.html", deserialize: function(value){ return value;  }}).then(third.html);

third.controller = function(){
    this.html = third.html;
}

third.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = third;