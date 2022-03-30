$(document).ready(function () {
    $('.dashboard_wrapper').css('display', 'block');
    $('.activity_wrapper').css('display', 'none');
    $('.all_expense_wrapper').css('display', 'none');

    $('#dashboard_side_bar').click(function () {
        $('.dashboard_wrapper').css('display', 'block');
        $('.activity_wrapper').css('display', 'none');
        $('.all_expense_wrapper').css('display', 'none');

        $('#dashboard_side_bar').addClass('side_bar_row_clicked');
        $('#activity_side_bar').removeClass('side_bar_row_clicked');
        $('#all_expense_side_bar').removeClass('side_bar_row_clicked');

    });
    $('#activity_side_bar').click(function () {
        $('.dashboard_wrapper').css('display', 'none');
        $('.activity_wrapper').css('display', 'block');
        $('.all_expense_wrapper').css('display', 'none');

        $('#dashboard_side_bar').removeClass('side_bar_row_clicked');
        $('#activity_side_bar').addClass('side_bar_row_clicked');
        $('#all_expense_side_bar').removeClass('side_bar_row_clicked');

    });
    $('#all_expense_side_bar').click(function () {
        $('.dashboard_wrapper').css('display', 'none');
        $('.activity_wrapper').css('display', 'none');
        $('.all_expense_wrapper').css('display', 'block');

        $('#dashboard_side_bar').removeClass('side_bar_row_clicked');
        $('#activity_side_bar').removeClass('side_bar_row_clicked');
        $('#all_expense_side_bar').addClass('side_bar_row_clicked');

    });

});