var forks = {};

forks.html= m.prop("");
m.request({method: "GET", url: "../components/forks/forks.html", deserialize: function(value){ return value;  }}).then(forks.html);

forks.controller = function(){
    this.html = forks.html;
}

forks.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = forks;