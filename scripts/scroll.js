
var htOnScroll = function() {     
    $('#ht-slider').css('left', $('#ht-wrapper').scrollLeft()*$('#ht-head').width()/$('#ht-content').width() + 'px');
};
$('#ht-wrapper').on('scroll', htOnScroll );

$('#ht-slider').draggable({ axis: "x", containment: 'window' });

$('#ht-slider').mousedown(
    function(){$('#ht-wrapper').off('scroll' );}
    );

$(document).mouseup(
    function(){$('#ht-wrapper').on('scroll', htOnScroll);}
    );

$('#ht-slider').on('drag', function(){
    $('#ht-wrapper').scrollTo($('#ht-slider').offset().left*$('#ht-content').width()/$('#ht-head').width(),0);
});

$(window).resize(reformat); 

    $('#1min').one("click", mminimize);

    function mminimize() {
        $('#1min').attr('expand-size', $('#1tab').width());
        $('#1content').hide();
        $('#1tabhead').hide();
        // $("#1tab").animate({
        //     width: '39px'
        // }, 200);
        $("#1tab").css("width", '39px' );
        reformat();
        $('#1tab .fa-minus').hide();
        $('#1tab .fa-plus').show();
        $(this).one("click", mmaximize);
        reformat();
    }

    function mmaximize() {
        // $("#1tab").animate({
        //     width: $('#1min').attr('expand-size') + 'px'
        // }, 200);
        $("#1tab").css("width", $('#1min').attr('expand-size') + 'px' );
        $(this).one("click", mminimize);
        $('#1tab .fa-minus').show();
        $('#1tab .fa-plus').hide();
        $('#1content').show();
        $('#1tabhead').show();
        reformat();
    }

    // shrink the state to show all mods
    $('#stupid').click(function(){
        $('#stupid').hide();
        $('#stupidfix').show();
        var headfinal = $(window).width();
        var wH = $(window).height();
        var modlens = 0; // full lenght of mods
        $.each(modules, function(i, module) {
           // modlens += $('.ht-tab[data-id="'+i+'"]').width() + 40; 
           modlens += module.width + 40;
        });

        for(var i = 0; i < modules.length; i++){
            var o = modules[i]; 
            $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').hide();
            var contentWidth = $('#ht-content').width();  // width of the module
            // $('ht-tab-content').attr('restore-width', contentWidth);
            var headWidth = $('#ht-head').width();  
        
            var modwidth = $('.ht-tab[data-id="'+o.id+'"]').width() +2; //  +2 compensates
            var width = (modwidth-40)/(modlens+80);
            console.log(modwidth);
            $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width', modwidth);
            // $('.ht-tab[data-id="'+o.id+'"]').css( { width : width*headfinal+'px'});
            // $('.ht-tab[data-id="'+o.id+'"]').css( { height : 300 +'px'});    
            $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width*headfinal+'px', height : 300 +'px' }, 200);
            // $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width*headfinal+'px'}, 200);
            $( "#ht-content" ).sortable("enable");
            // reformat();
        }
    });
    // re expand the state 
    $('#stupidfix').click(function(){
        $('#stupid').show();
        $('#stupidfix').hide();

        var headfinal = $(window).width(); // final width of the header taking into account the navbar
        var wH = $(window).height();
        var wrapperH = wH-26;
        var tab = wrapperH-60;

        // $('.ht-tab').css({ height: tab + 'px'});

        for(var i = 0; i < modules.length; i++){
            var o = modules[i]; 
            var width = $('.ht-tab[data-id="'+o.id+'"]').attr('restore-width');
            // $('.ht-tab[data-id="'+o.id+'"]').css( { width : width+ 'px'});
            // $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width+ 'px', height: tab + 'px'},200);
            $('.ht-tab[data-id="'+o.id+'"]').animate( { width : width},200);
            $('.ht-tab[data-id="'+o.id+'"] .ht-tab-content').show();
            $("#ht-content").sortable("disable");
            setTimeout(function(){
                reformat();
            }, 200);
        }
    });
    // let escape key exit expanded state

    // add sortable, refresh modules,
    $(function() {
        $("#ht-content").sortable({
            placeholder: "ghost-element ht-tab ui-state-default"
            // update:function(){
            //     modules = [];
            //     $('.ht-tab').each(function(){
            //     var header = $(this).children('.ht-tab-header');
            //     var id = $(this).attr('data-id'); // Get id 
            //     var title = header.find("h3").text(); // Get the title
            //     var width = $(this).width();  // Get the width 
            // //     modules.push({id : id, width : width, title : title});
            //     // reformat();
            //     });
            // }
            });

        $("#ht-content").sortable( "disable" );
        $("#ht-content").disableSelection();
  });