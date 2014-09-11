var wiki = {};

wiki.html= m.prop("");
m.request({method: "GET", url: "../components/wiki/wiki.html", deserialize: function(value){ return value;  }}).then(wiki.html);

wiki.controller = function(){
    this.html = wiki.html;
}

wiki.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = wiki;