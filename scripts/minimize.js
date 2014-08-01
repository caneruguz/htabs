
$('#1min').one("click", mminimize);

function mminimize() {
    $('#1min').attr('expand-size', $('#1tab').width());
    $('#1content').hide();
    $('#1tabhead').hide();
    $("#1tab").css("width", '39px' );
    reformat();
    $('#1tab .fa-minus').hide();
    $('#1tab .fa-plus').show();
    $(this).one("click", mmaximize);
    reformat();
}

function mmaximize() {
    $("#1tab").css("width", $('#1min').attr('expand-size') + 'px' );
    $(this).one("click", mminimize);
    $('#1tab .fa-minus').show();
    $('#1tab .fa-plus').hide();
    $('#1content').show();
    $('#1tabhead').show();
    reformat();
}
