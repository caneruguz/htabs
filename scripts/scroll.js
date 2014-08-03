
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

$('#exLeftNav').click(function(){
    $('#ht-wrapper').scrollTo($('#ht-wrapper'), 200,  {offset:-500});
});

$('#exRightNav').click(function(){
    $('#ht-wrapper').scrollTo($('#ht-wrapper'), 200,  {offset:500});
});
