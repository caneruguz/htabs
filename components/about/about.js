var about = {};

about.html= m.prop("");
m.request({method: "GET", url: "../components/about/about.html", deserialize: function(value){ return value;  }}).then(about.html);

about.controller = function(){
    this.html = about.html;
}

about.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = about;