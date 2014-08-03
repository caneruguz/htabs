
var totalWidth = 0; 
var modules = []; // created on load and checked at every resize
var dragState =  false;
var canReformat = true;
var exposeOn = false;


var resizecontent = function(){
    lensm = 2000;
    $.each(modules, function(i, module) {
       lensm += module.width + 40;
    });

    $('#ht-content').css('width', lensm +'px');
};

var reformat = function(){
    if(canReformat){
        
        // Size wrapper elements
        var headfinal = $(window).width(); // final width of the header taking into account the navbar
        var wH = $(window).height();
        var wrapperH = wH-40;
        var tab = wrapperH-80;

        $('#ht-head').css({ width : headfinal + 'px' } );
        $('#ht-wrapper').css({ width : headfinal + 'px', height: wrapperH + "px" } );
        $('.ht-tab').css({ height: tab + 'px'});

        // Adjust slider on changes
        $('#ht-slider').width( Math.pow(headfinal, 2) / $('#ht-content').width() + 'px')
            .css('left', $('#ht-wrapper').scrollLeft() * $('#ht-head').width()/$('#ht-content').width() + 'px');
        // Resize header modules 
        for(var i = 0; i < modules.length; i++){
            var o = modules[i]; 
            var contentWidth = $('#ht-content').width();  // width of the module
            var headWidth = $('#ht-head').width();  

            // +40 = fix for margin space
            var width = ($('.ht-tab[data-id="'+o.id+'"]').width()+40)/contentWidth*100;
            $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : width+'%'});    
        }
        $(".grid").css({ height : '400px' } );
    }
};


    