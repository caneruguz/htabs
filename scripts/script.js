(function(){
var totalWidth = 0; 
var modules = []; // created on load and checked at every resize
var dragState =  false;


var reformat = function(){
    // Size wrapper elements
    var headfinal = $(window).width(); // final width of the header taking into account the navbar
    var wH = $(window).height();
    var wrapperH = wH-26;
    var tab = wrapperH-60;
    $('#ht-head').css({ width : headfinal + 'px' } );
    $('#ht-wrapper').css({ width : headfinal + 'px', height: wrapperH + "px" } );
    $('.ht-tab').css({ height: tab + 'px'});
    // Resize header modules 
    for(var i = 0; i < modules.length; i++){
        var o = modules[i]; 
        var contentWidth = $('#ht-content').width();  // width of the module
        var headWidth = $('#ht-head').width();  
        var width = o.width/contentWidth*100;
        $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : width+'%'});    
    }
    $(".grid").css({ height : '400px' } );

    // title text correction when title div sizes are becoming too small
    $('.ht-hdiv').each(function(){
        var inner = $(this).children('.ht-hdiv-content');
        var outer = $(this).width();
        var innerText = "";
        for(var i = 0; i < modules.length; i++){
            if (modules[i].id == $(this).attr('data-hid')){
                innerText = modules[i].title;
                if( inner.outerWidth()+6 > outer){
                    var diff = (inner.outerWidth()-outer)/inner.outerWidth();
                    console.log(diff);
                    var cutoff = innerText.length*diff;
                    inner.text(innerText.slice(0,Math.round(cutoff)-6) + "...");
                } else {
                    console.log("else");
                    inner.text(innerText);
                }
            }
        }

    })


}

// Build the header modules from the modules loaded 
$('.ht-tab').each(function(){
    var header = $(this).children('.ht-tab-header');
    var id = $(this).attr('data-id'); // Get id 
    var title = header.find("h3").text(); // Get the title
    var width = $(this).width();  // Get the width 
    totalWidth = totalWidth+width;
    var bg = header.attr("data-bg");
    // Build the head 
    $('#ht-head').append('<div class="ht-hdiv bg-'+bg+'" data-hid="'+id+'" ><span class="ht-hdiv-content">'+title+'</span></div>')

    // ScrollTo initialization. 
    $(document).on('click', '.ht-hdiv', function(){
        var id = $(this).attr('data-hid');
        $('#ht-wrapper').scrollTo($('.ht-tab[data-id="'+id+'"]'), 200,  {offset:-50});
    })
    modules.push({id : id, width : width, title : title});
    reformat();  
})

// jquery-ui Resizable options
$('.ht-tab').resizable({
    grid: 100,
    minWidth : 600,
    maxWidth: 1200,
    stop: function( event, ui ) {
        if(ui.size.width > ui.originalSize.width){
            console.log(ui.size.width, ui.originalSize.width)
            var change = ui.size.width - ui.originalSize.width;
            var contentSize = $('#ht-content').width()+change;
            $('#ht-content').css({width : contentSize+'px'});
            reformat();
        } else {
            var change = ui.size.width - ui.originalSize.width;
            console.log(change);
            var contentSize = $('#ht-content').width()+change;
            $('#ht-content').css({width : contentSize+'px'});
            reformat();
        }
    }
})
    $('.grid > div').resizable({
        grid : 50,
        stop : function(){
            $(".grid").trigger("ss-rearrange");
        }
    });

    $(".grid").shapeshift({
        minColumns: 3,
        align: "left",
        colWidth : 120
    });
    $containers = $(".grid");
    $containers.on('ss-added', function(e, selected){
        var iwidth = $(selected).width();
        var cwidth = $(this).width();
        $(this).closest('.ht-tab').width(cwidth+iwidth);
        reformat();
    })
    $containers.on('ss-removed', function(e, selected){
        var iwidth = $(selected).width();
        var cwidth = $(this).width();
        $(this).closest('.ht-tab').width(cwidth-iwidth);
        reformat();
    })


$(window).resize(reformat); 



})(); 
