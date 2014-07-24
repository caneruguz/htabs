(function(){
var totalWidth = 0; 
var modules = [];
var dragState =  false;

var reformat = function(){
    // Size wrapper elements
    var headfinal = $(window).width()-120;
    $('#ht-head').css({ width : headfinal + 'px' } ); 
    $('#ht-wrapper').css({ width : headfinal + 'px' } ); 

    for(var i = 0; i < modules.length; i++){
        var o = modules[i]; 
        var contentWidth = $('#ht-content').width(); 
        var headWidth = $('#ht-head').width(); 
        var width = o.width/contentWidth*100;
        $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : width+'%'});
        
    }

}


$('.ht-tab').each(function(){
    var header = $(this).children('.ht-tab-header');
    var id = $(this).attr('data-id');
    var title = header.children("h2").text();
    var width = $(this).width(); 
    totalWidth = totalWidth+width;
    var bg = header.attr("data-bg"); 
    $('#ht-head').append('<div class="ht-hdiv bg-'+bg+'" data-hid="'+id+'" >'+title+'</div>')

    $(document).on('click', '.ht-hdiv', function(){
        var id = $(this).attr('data-hid');
        $('#ht-wrapper').scrollTo($('.ht-tab[data-id="'+id+'"]'), 200,  {offset:-50});
    })
    modules.push({id : id, width : width});
    reformat();  
})
$('.ht-tab').resizable({
    grid: 50,
    minWidth : 300,
    maxWidth: 800,
    resize: function( event, ui ) {
        var change = ui.size.width - ui.originalSize.width; 
        var contentSize = $('#ht-content').width()+change; 
        $('#ht-content').css({width : contentSize+'px'})
    console.log(change);
        
    }
})


$(window).resize(reformat); 



})(); 
