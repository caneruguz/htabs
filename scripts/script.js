(function(){
var totalWidth = 0; 
var modules = []; // created on load and checked at every resize
var dragState =  false;


var reformat = function(){
    // Size wrapper elements
    var headfinal = $(window).width()-120; // final width of the header taking into account the navbar
    $('#ht-head').css({ width : headfinal + 'px' } ); 
    $('#ht-wrapper').css({ width : headfinal + 'px' } ); 

    // Resize header modules 
    for(var i = 0; i < modules.length; i++){
        var o = modules[i]; 
        var contentWidth = $('#ht-content').width();  // width of the module
        var headWidth = $('#ht-head').width();  
        var width = o.width/contentWidth*100;
        $('.ht-hdiv[data-hid="'+o.id+'"]').css( { width : width+'%'});    
    }

    // Trying out the grid, unfinished
    var windowH = $(window).height();
    var wrapHeight = $('#ht-wrapper').height(windowH-120);  

    var totalRow = $('.h-row').length; 
    $('.h-row').each(function(){
        $(this).height(wrapHeight/3);
    })
}

// Build the header modules from the modules loaded 
$('.ht-tab').each(function(){
    var header = $(this).children('.ht-tab-header');
    var id = $(this).attr('data-id'); // Get id 
    var title = header.children("h2").text(); // Get the title 
    var width = $(this).width();  // Get the width 
    totalWidth = totalWidth+width;
    var bg = header.attr("data-bg");
    // Build the head 
    $('#ht-head').append('<div class="ht-hdiv bg-'+bg+'" data-hid="'+id+'" >'+title+'</div>')

    // ScrollTo initialization. 
    $(document).on('click', '.ht-hdiv', function(){
        var id = $(this).attr('data-hid');
        $('#ht-wrapper').scrollTo($('.ht-tab[data-id="'+id+'"]'), 200,  {offset:-50});
    })
    modules.push({id : id, width : width});
    reformat();  
})

// jquery-ui Resizable options
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
