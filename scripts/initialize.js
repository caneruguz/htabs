
// Build the header modules from the modules loaded 
$('.ht-tab').each(function(){
    var header = $(this).children('.ht-tab-header');
    var id = $(this).attr('data-id'); // Get id 
    var title = header.find("h3").text(); // Get the title
    var width = $(this).width();  // Get the width 
    totalWidth = totalWidth+width;
    var bg = header.attr("data-bg");
    
    // Build the head 
    $('#ht-head').append('<div class="ht-hdiv bg-'+bg+'" data-hid="'+id+'" >'+title+'</div>');
    // ScrollTo initialization. 
    $(document).on('click', '.ht-hdiv', function(){
        var id = $(this).attr('data-hid');
        $('#ht-wrapper').scrollTo($('.ht-tab[data-id="'+id+'"]'), 200,  {offset:-50});
    }
    );
    modules.push({id : id, width : width, title : title});
    resizecontent();
    reformat();  
});

// jquery-ui Resizable options
$('.ht-tab').resizable({
    grid: 100,
    minWidth : 600,
    maxWidth: 1200,
    // could be one, no need ielse
    stop: function( event, ui ) {
        if(ui.size.width > ui.originalSize.width){
            console.log(ui.size.width, ui.originalSize.width);
            var change = ui.size.width - ui.originalSize.width;
            var contentSize = $('#ht-content').width()+change;
            $('#ht-content').css({width : contentSize+'px'});
            reformat();
        } else {
            var change = ui.size.width - ui.originalSize.width;
            var contentSize = $('#ht-content').width()+change;
            $('#ht-content').css({width : contentSize+'px'});
            reformat();
        }
    }
});
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
    });
    $containers.on('ss-removed', function(e, selected){
        var iwidth = $(selected).width();
        var cwidth = $(this).width();
        $(this).closest('.ht-tab').width(cwidth-iwidth);
        reformat();
    });

$(window).resize(reformat); 
