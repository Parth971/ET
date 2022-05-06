
function isPositiveInteger(str) {
    if (str == '') {
        return false;
    }
    if (typeof str !== 'string') {
        return false;
    }

    const num = Number(str);

    if (Number.isInteger(num) && num >= 0) {
        return true;
    }

    return false;
}

console.log('Inside add friend');

$(document).ready(function () {
    console.log("ready!");

    $('.bill_request_table button').click(function () {
        let AR = $(this).text();
        let bill_id = $('#div_bill_id').text();

        url = '{% url 'add_friend' %}';
        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: "{{ csrf_token }}",
                state: "inactive",
                'request_motive': 'accept_reject_bill_validation',
                'bill_id': bill_id,
                'state': AR
            },
            type: 'post',
            success: function (result) {
                console.log(result);
                $('.bill_request_table').css('display', 'none');
                $('#' + bill_id).remove();
            },
            failure: function () {
                console.log('failed');
            }
        });

    });

    $('.bill_request').click(function () {
        let bill_request_class = this;
        let bill_id = this.id;
        console.log(bill_id);
        url = '{% url 'add_friend' %}';
        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: "{{ csrf_token }}",
                state: "inactive",
                'request_motive': 'get_settlements_data',
                'bill_id': bill_id,
            },
            type: 'post',
            success: function (result) {

                paid = result.data_dict.paid;
                debt = result.data_dict.debt;
                receiving_amount = result.data_dict.receiving_amount;

                let table = $('.bill_request_table').css('display', 'table');


                $('#table_bill_name').text($(bill_request_class).children('.bill_name').text());
                $('#table_bill_amount').text($(bill_request_class).children('.bill_amount').text());
                $('#table_bill_split').text($(bill_request_class).children('.bill_split_type').text());
                $('#table_bill_date').text($(bill_request_class).children('.bill_date').text());
                $('#table_bill_amount_paid').text(paid);
                $('#table_bill_amount_debt').text(debt);
                $('#table_bill_amount_receive').text(receiving_amount);

                $('#div_bill_id').text(bill_request_class.id);


            },
            failure: function () {
                console.log('failed');
            }
        });
    });

    $('.all-friends').click(function () {
        let current_id = this.id;
        url = '{% url 'add_friend' %}';
        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: "{{ csrf_token }}",
                state: "inactive",
                'request_motive': 'send_friend_request',
                'friend_id': current_id
            },
            type: 'post',
            success: function (result) {
                $('#' + current_id).remove();
            },
            failure: function () {
                console.log('failed');
            }
        });
    });

    $('.my_friends').click(function () {
        let current_id = this.id;
        url = '{% url 'add_friend' %}';
        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: "{{ csrf_token }}",
                state: "inactive",
                'request_motive': 'get_bills_of_my_friend',
                'friend_id': current_id
            },
            type: 'post',
            success: function (result) {

                let main_dict = result.main_dict;

                let tbody = $('.active_expenses tbody');
                tbody.empty();

                for (let i = 0; i < main_dict.length; i++) {
                    let pk = JSON.parse(main_dict[i].bills)[0].pk
                    let bill_fields = JSON.parse(main_dict[i].bills)[0].fields
                    let receiving_amount = main_dict[i].receiving_amount
                    let current_settlement = JSON.parse(main_dict[i].current_settlement)[0].fields


                    s = `<tr>
							<td>`+ bill_fields.bill_name + `</td>
							<td>`+ bill_fields.amount + `</td>
							<td>`+ bill_fields.split_type + `</td>
							<td>`+ bill_fields.date + `</td>
							<td>`+ bill_fields.status + `</td>
							<td>`+ current_settlement.paid + `</td>
							<td>`+ current_settlement.debt + `</td>
							<td>`+ receiving_amount + `</td>`


                    if (current_settlement.debt != 0) {
                        s += `<td><button type="button" class="btn btn-primary settle_bill_class" id='` + pk + `' data-bs-toggle="modal" data-bs-target="#settlement_modal">Settle</button></td>`
                    }
                    s += `</tr>`

                    tbody.append(s);
                }

                $('.settle_bill_class').click(function () {
                    let current_clicked_id = this.id;
                    $('#settle_bill_id').val(current_clicked_id);
                    $('#max_payment_amount').val($(this).parent().prev().prev().text());

                });

            },
            failure: function () {
                console.log('failed');
            }
        });
    });

    $('#settle_payment_pay_button').click(function () {
        let bill_id = $('#settle_bill_id').val();
        let max_payment_amount = parseInt($('#max_payment_amount').val());


        let current_value = parseInt($('#settle_payment').val());

        if (current_value > 0 && current_value <= max_payment_amount) {
            $('.invalid_value_error').css('display', 'none');
            url = '{% url 'add_friend' %}';
            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: "{{ csrf_token }}",
                    state: "inactive",
                    'request_motive': 'settle_payment',
                    'bill_id': bill_id,
                    'payed_amount': current_value
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
                    location.reload();

                },
                failure: function () {
                    console.log('failed');
                }
            });
        }
        else {
            $('.invalid_value_error').css('display', 'block');
        }


    });

    $('.friend_request button').click(function () {
        let state = $(this).text();
        let current_id = $(this).parent()[0].id;

        console.log(state);
        console.log(current_id);

        url = '{% url 'add_friend' %}';
        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: "{{ csrf_token }}",
                state: "inactive",
                'request_motive': 'accept_reject_friend_request',
                'activity_id': current_id,
                'state': state
            },
            type: 'post',
            success: function (result) {
                console.log(result);
                $('#' + current_id).remove();
            },
            failure: function () {
                console.log('failed');
            }
        });
    });

    function validate_amounts() {
        if (isPositiveInteger($('#current_user_amount').val())) {
            $('#current_user_amount').css('border', '1px solid #ced4da');
        }
        else {
            $('#current_user_amount').css('border', '1px solid red');
            $('#current_user_amount').val(0);
        }
        if (isPositiveInteger($('#other_user_amount').val())) {
            $('#other_user_amount').css('border', '1px solid #ced4da');
        }
        else {
            $('#other_user_amount').css('border', '1px solid red');
            $('#other_user_amount').val(0);
        }

        $("#total_amount").val(parseInt($('#current_user_amount').val()) + parseInt($('#other_user_amount').val()));
    }
    $("#current_user_amount").keyup(validate_amounts);

    $("#other_user_amount").keyup(validate_amounts);

    $('#friend_name').change(function () {
        if ($('#friend_name option:selected').text() == 'Choose...') {
            $('#other_user').val('Friend paid');
            $('#other_user2').val('Friend must pay');
        }
        else {
            $('#other_user').val($('#friend_name option:selected').text() + ' paid');
            $('#other_user2').val($('#friend_name option:selected').text() + ' must pay');

        }
    });

    function must_pay_amounts() {
        if (isPositiveInteger($('#current_user_must_pay').val())) {
            $('#current_user_must_pay').css('border', '1px solid #ced4da');
        }
        else {
            $('#current_user_must_pay').css('border', '1px solid red');
            $('#current_user_must_pay').val(0);
        }
        if (isPositiveInteger($('#other_user_must_pay').val())) {
            $('#other_user_must_pay').css('border', '1px solid #ced4da');
        }
        else {
            $('#other_user_must_pay').css('border', '1px solid red');
            $('#other_user_must_pay').val(0);
        }
    }

    $("#current_user_must_pay").keyup(must_pay_amounts);

    $("#other_user_must_pay").keyup(must_pay_amounts);

    $('#split_type').change(function () {
        if ($('#split_type option:selected').text() == 'Choose...') {
            $('#current_user_must_pay').attr('disabled', false);
            $('#other_user_must_pay').attr('disabled', false);
            $('.percentage-span').css('display', 'none');
        }
        else if ($('#split_type option:selected').text() == 'Equal') {
            let ta = parseInt($('#total_amount').val());
            $('#current_user_must_pay').attr('disabled', true);
            $('#other_user_must_pay').attr('disabled', true);
            $('#current_user_must_pay').val(ta / 2);
            $('#other_user_must_pay').val(ta / 2);
            $('.percentage-span').css('display', 'none');
        }
        else if ($('#split_type option:selected').text() == 'Exact') {
            $('#current_user_must_pay').attr('disabled', false);
            $('#other_user_must_pay').attr('disabled', false);
            $('.percentage-span').css('display', 'none');
        }
        else if ($('#split_type option:selected').text() == 'Percentage') {
            $('#current_user_must_pay').attr('disabled', false);
            $('#other_user_must_pay').attr('disabled', false);
            $('.percentage-span').css('display', 'block');
        }
    });

    $('#add_expense').click(function () {
        let error = false;
        let friend_id;
        let expense_name;
        let total_amount;
        let current_user_amount;
        let other_user_amount;
        let split_type;
        let datetime;
        let message;
        let current_user_must_pay;
        let other_user_must_pay;

        if ($('#friend_name option:selected').text() == 'Choose...') {
            $('#friend_name').css('border', '1px solid red');
            error = true;
        }
        else {
            $('#friend_name').css('border', '1px solid #ced4da');
            friend_id = $('#friend_name option:selected').val();
        }

        if ($('#expense_name').val().match('^[a-zA-Z]{2,19}$')) {
            $('#expense_name').css('border', '1px solid #ced4da');
            expense_name = $('#expense_name').val();
        } else {
            $('#expense_name').css('border', '1px solid red');
            error = true;
        }

        if (isPositiveInteger($('#current_user_amount').val())) {
            $('#current_user_amount').css('border', '1px solid #ced4da');
        }
        else {
            $('#current_user_amount').css('border', '1px solid red');
            error = true;
        }

        if (isPositiveInteger($('#other_user_amount').val())) {
            $('#other_user_amount').css('border', '1px solid #ced4da');
        }
        else {
            $('#other_user_amount').css('border', '1px solid red');
            error = true;
        }

        if (parseInt($('#total_amount').val()) == 0) {
            $('#amount-zero').css('display', 'block');
            error = true;
        }
        else {
            total_amount = parseInt($('#total_amount').val());
            current_user_amount = parseInt($('#current_user_amount').val());
            other_user_amount = parseInt($('#other_user_amount').val());
            $('#amount-zero').css('display', 'none');
        }


        if ($('#split_type option:selected').text() == 'Choose...') {
            $('#split_type').css('border', '1px solid red');
            error = true;
        }
        else {
            $('#split_type').css('border', '1px solid #ced4da');
            split_type = $('#split_type option:selected').val();
        }

        if (isPositiveInteger($('#current_user_must_pay').val())) {
            $('#current_user_must_pay').css('border', '1px solid #ced4da');
        }
        else {
            $('#current_user_must_pay').css('border', '1px solid red');
            error = true;
        }

        if (isPositiveInteger($('#other_user_must_pay').val())) {
            $('#other_user_must_pay').css('border', '1px solid #ced4da');
        }
        else {
            $('#other_user_must_pay').css('border', '1px solid red');
            error = true;
        }

        if (split_type == 'equal' && total_amount) {
            if (parseInt($('#current_user_must_pay').val()) + parseInt($('#other_user_must_pay').val()) == total_amount) {
                $('#total_amount_remaining').css('display', 'none');
                current_user_must_pay = $('#current_user_must_pay').val();
                other_user_must_pay = $('#other_user_must_pay').val();
            }
            else {
                $('#total_amount_remaining').css('display', 'block');
                error = true;
            }
        }

        if (split_type == 'exact' && total_amount) {
            if (parseInt($('#current_user_must_pay').val()) + parseInt($('#other_user_must_pay').val()) == total_amount) {
                $('#total_amount_remaining').css('display', 'none');
                current_user_must_pay = $('#current_user_must_pay').val();
                other_user_must_pay = $('#other_user_must_pay').val();
            }
            else {
                $('#total_amount_remaining').css('display', 'block');
                error = true;
            }
        }

        if (split_type == 'percentage' && total_amount) {

            if (parseInt($('#current_user_must_pay').val()) + parseInt($('#other_user_must_pay').val()) == 100) {
                $('#total_amount_remaining').css('display', 'none');
                current_user_must_pay = $('#current_user_must_pay').val();
                other_user_must_pay = $('#other_user_must_pay').val();
            }
            else {
                $('#total_amount_remaining').css('display', 'block');
                error = true;
            }
        }



        if ($('#datetime-local').val() == '') {
            $('#datetime-local').css('border', '1px solid red');
            error = true;
        }
        else {
            datetime = $('#datetime-local').val();
            $('#datetime-local').css('border', '1px solid #ced4da');
        }


        if ($('#message-text').val() == '') {
            message = 'New Expense, hurry and accept it!!';
        }
        else {
            message = $('#message-text').val();
        }

        if (!error) {
            {% comment %} console.log(friend_id);
            console.log(expense_name);
            console.log(total_amount);
            console.log(current_user_amount);
            console.log(other_user_amount);
            console.log(split_type);
            console.log(datetime);
            console.log(message);
            console.log(current_user_must_pay);
            console.log(other_user_must_pay); {% endcomment %}


            url = '{% url 'add_friend' %}';
            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: "{{ csrf_token }}",
                    state: "inactive",
                    'request_motive': 'add_expense',
                    'friend_id': friend_id,
                    'expense_name': expense_name,
                    'total_amount': total_amount,
                    'current_user_amount': current_user_amount,
                    'other_user_amount': other_user_amount,
                    'split_type': split_type,
                    'datetime': datetime,
                    'message': message,
                    'current_user_must_pay': current_user_must_pay,
                    'other_user_must_pay': other_user_must_pay
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
                    $('#expense_form').trigger("reset");
                },
                failure: function () {
                    console.log('failed');
                }
            })
        }

    });
});
