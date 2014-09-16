var files = {};

files.html= m.prop("");
m.request({method: "GET", url: "../components/files/files.html", deserialize: function(value){ return value;  }}).then(files.html);

files.controller = function(){
    this.html = files.html;
}

files.view = function(ctrl){
    return m.trust(ctrl.html());
}

module.exports = files;