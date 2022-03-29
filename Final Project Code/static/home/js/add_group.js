console.log('In add_group');


$(document).ready(function () {    

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

    var friends_ids = new Array();
    $('.target_friend').click(function() {
        let current_selected_friend_name = $(this).text();
        let current_selected_friend_id = this.id;

        if (friends_ids.indexOf(current_selected_friend_id) < 0) {

            friends_ids.push(current_selected_friend_id);
            
            $('.span_friend_group').append(`<span class="alert alert-success alert-dismissible fade show" id='_`+                  current_selected_friend_id + `' role="alert">` + current_selected_friend_name + ` 
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </span>`);
        }
        $('.alert').click(function() {
            let index = friends_ids.indexOf(this.id.slice(1,));
            if (index > -1) {
                friends_ids.splice(index, 1);
            }
        });

    });


    $('#add_group_btn').click(function(){

        let error = false;
        let group_name;
        let member_ids = friends_ids;

        if( member_ids.length < 2 ){
            error = true;
            $('#group_member_number_error').css('display', 'inline');
        }
        else {
            $('#group_member_number_error').css('display', 'none');
        }

        var re = /^(?!\s)(?!.*\s$)(?=.*[a-zA-Z0-9])[a-zA-Z0-9 ]{2,}$/;
        if (re.test( $('#group_name_input').val() )) {
            $('#group_name_error').css('display', 'none');
            group_name = $('#group_name_input').val();
        }
        else {
            $('#group_name_error').css('display', 'inline');
            error = true;
        }


        if(!error) {
            console.log('submitted!');
            
            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'add_new_group',
                    'group_name': group_name,
                    'member_ids': JSON.stringify(member_ids)
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
                    console.log(result)
                    $('#create_new_group_form').trigger("reset");
                    $('.span_friend_group').empty();
                    friends_ids = [];

                    
                    $('#add_group_response').css('display', 'block');
                    if (result.status == 'Failed') {
                        $('#add_group_response').removeClass('alert-success');
                        $('#add_group_response').addClass('alert-danger');
                        
                    }
                    else {
                        $('#add_group_response').removeClass('alert-danger');
                        $('#add_group_response').addClass('alert-success');
                    }
                    $('#add_group_response').text(result.message);

                },
                failure: function () {
                    console.log('failed');
                }
            });
        }

    });
    

    $('.group_target').click(function(){
        let currnt_grp_id = this.id;

        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: crf_token,
                state: "inactive",
                'request_motive': 'get_grp_details',
                'group_id': currnt_grp_id
            },
            type: 'post',
            success: function (result) {
                console.log(result);

            },
            failure: function () {
                console.log('failed');
            }
        });


    });



    $('#group_name').change(function () {
        let wrapper = $('#all_grp_members_with_amount_wrapper .row')
        wrapper.empty();
        $('#total_amount').val(0);

        let actual_amount_wrapper = $('#all_grp_members_with_actual_amount_wrapper .row')
        actual_amount_wrapper.empty();

        if ($('#group_name option:selected').text() != 'Choose...') {
            let current_id = $(this).val();
            let s = `<p>Payers</p>`;
            let s2 = `<p>After Split</p>`;
        
            let current_members_tuple = groups_members[current_id];
            for(let k=0; k<current_members_tuple.length; k++) {
                let name = current_members_tuple[k][1];
                let id = current_members_tuple[k][0];

                s += `<div class="col-md-6 col-sm-6 col-lg-6">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" aria-label="Username"
                        value='`+ name +`' disabled>
                    <span class="input-group-text">$</span>
                    <input type="text" class="form-control grp_members_input_target" id="`+ id + '_' + name + `" aria-label="amount" value='0'>
                </div>
            </div>`;

                s2 += `<div class="col-md-6 col-sm-6 col-lg-6">
                    <div class="input-group mb-3">
                        <input type="text" class="form-control" aria-label="Username"
                            value='`+ name +`' disabled>
                        <span class="input-group-text">$</span>
                        <input type="text" class="form-control grp_members_must_pay_input_target" id="mustpay_`+ id + '_' + name + `" aria-label="amount" value='0'>
                        <span class="input-group-text percentage-span" style='display:none;'>%</span>
                    </div>
                </div>`;
            }

            wrapper.append(s);
            actual_amount_wrapper.append(s2);

            let all_ele = $('.grp_members_input_target');
            for(let k=0; k<all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#'+current_input.id);
                current_ele.keyup(validate_amounts);
                current_ele.keyup(validate_amounts);
            }

            let all_ele2 = $('.grp_members_must_pay_input_target');
            for(let k=0; k<all_ele2.length; k++) {
                let current_input = all_ele2[k];
                let current_ele = $('#'+current_input.id);
                current_ele.keyup(must_pay_amounts);
                current_ele.keyup(must_pay_amounts);
            }

        }
    });

    function must_pay_amounts() {
        let all_ele = $('.grp_members_must_pay_input_target');
        for(let k=0; k<all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#'+current_input.id);
            if (isPositiveInteger(current_ele.val())) {
                current_ele.css('border', '1px solid #ced4da');
            }
            else {
                current_ele.css('border', '1px solid red');
            }
        }
    }

    function validate_amounts() {
        let all_ele = $('.grp_members_input_target');
        let total = 0;
        for(let k=0; k<all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#'+current_input.id);
            if (isPositiveInteger(current_ele.val())) {
                total += parseFloat(current_ele.val());
                current_ele.css('border', '1px solid #ced4da');
            }
            else {
                current_ele.css('border', '1px solid red');
            }
        }
        split_type_update();
        $('#total_amount').val(total);
    }
    
    function split_type_update() {
        let all_ele = $('.grp_members_must_pay_input_target');
        let per_person_amount = (parseFloat($('#total_amount').val())/all_ele.length).toFixed(2);
        let not_divisible = false;
        let remaining_amount = 0;
        if (parseInt(per_person_amount) != per_person_amount){
            not_divisible = true;
            remaining_amount =  (per_person_amount - parseFloat(+ per_person_amount.toString().split(".")[0])) * all_ele.length;
            remaining_amount = Math.round(remaining_amount);
            console.log(remaining_amount);
            per_person_amount = parseInt(per_person_amount);
        }
        if($('#split_type option:selected').text() == 'Equal') {
            for(let k=0; k<all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#'+current_input.id);
                current_ele.attr('disabled', true);
                
                if(not_divisible) {
                    if (remaining_amount != 0) {
                        current_ele.val(per_person_amount+1);
                        remaining_amount -= 1;
                    }
                    else {
                        current_ele.val(per_person_amount)
                    }
                    
                } 
                else {
                    current_ele.val(per_person_amount);
                }
            }  
        }
        else {
            for(let k=0; k<all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#'+current_input.id);
                current_ele.attr('disabled', false);
            }
        }

        if($('#split_type option:selected').text() == 'Percentage') {
            for(let k=0; k<all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#'+current_input.id);
                $('.percentage-span').css('display', 'block');
            }    
        }
        else {
            for(let k=0; k<all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#'+current_input.id);
                $('.percentage-span').css('display', 'none');
            }
        }
        
    }
    $('#split_type').change(split_type_update);

    function add(accumulator, a) {
        return accumulator + a;
      }


    $('#add_group_expense_btn').click(function(){
        let error = false;
        let group_id;
        let expense_name;
        let total_amount;
        let member_payed_amount_dic = {};
        let member_must_pay_amount_dic = {};
        let split_type;
        let datetime;
        let message;

        if ($('#group_name option:selected').text() == 'Choose...') {
            $('#group_name').css('border', '1px solid red');
            error = true;
        }
        else {
            $('#group_name').css('border', '1px solid #ced4da');
            group_id = $('#group_name option:selected').val();
        }

        var re = /^(?!\s)(?!.*\s$)(?=.*[a-zA-Z0-9])[a-zA-Z0-9 ]{2,}$/;
        if (re.test( $('#expense_name').val() )) {
            $('#expense_name').css('border', '1px solid #ced4da');
            expense_name = $('#expense_name').val();
        } else {
            $('#expense_name').css('border', '1px solid red');
            error = true;
        }

        let all_ele2 = $('.grp_members_input_target');
        for(let k=0; k<all_ele2.length; k++) {
            let current_input = all_ele2[k];
            let current_ele = $('#'+current_input.id);
            if (isPositiveInteger(current_ele.val())) {
                current_ele.css('border', '1px solid #ced4da');
                let current_id = (current_input.id).split('_')[0];
                member_payed_amount_dic[current_id] = parseFloat(current_ele.val());
            }
            else {
                current_ele.css('border', '1px solid red');
                error = true;
            }
        }

        if (parseInt($('#total_amount').val()) == 0) {
            $('#amount-zero').css('display', 'block');
            error = true;
        }
        else {
            total_amount = parseInt($('#total_amount').val());
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
        
        let all_ele = $('.grp_members_must_pay_input_target');
        let sum = 0;
        for(let k=0; k<all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#'+current_input.id);
            if (isPositiveInteger(current_ele.val())) {
                current_ele.css('border', '1px solid #ced4da');
                let current_id = (current_input.id).split('_')[1];
                member_must_pay_amount_dic[current_id] = parseFloat(current_ele.val());
                sum += parseFloat(current_ele.val());
            }
            else {
                current_ele.css('border', '1px solid red');
                error = true;
            }
        }

        if (split_type == 'equal' && total_amount) {
            if (sum == total_amount) {
                $('#total_amount_remaining').css('display', 'none');
            }
            else {
                $('#total_amount_remaining').css('display', 'block');
                error = true;
            }
        }

        if (split_type == 'exact' && total_amount) {
            if (sum == total_amount) {
                $('#total_amount_remaining').css('display', 'none');
            }
            else {
                $('#total_amount_remaining').css('display', 'block');
                error = true;
            }
        }

        if (split_type == 'percentage' && total_amount) {
            if (sum == 100) {
                $('#total_amount_remaining').css('display', 'none');
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
            console.log('Submitted!');
            console.log(group_id);
            console.log(expense_name);
            console.log(total_amount);
            console.log(member_payed_amount_dic);
            console.log(member_must_pay_amount_dic);
            console.log(split_type);
            console.log(datetime);
            console.log(message);

            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'add_group_expense',
                    'group_id': group_id,
                    'expense_name': expense_name,
                    'total_amount': total_amount,
                    'member_payed_amount_dic': JSON.stringify(member_payed_amount_dic),
                    'member_must_pay_amount_dic': JSON.stringify(member_must_pay_amount_dic),
                    'split_type': split_type,
                    'datetime': datetime,
                    'message': message,
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
                    $('#expense_form').trigger("reset");
                },
                failure: function () {
                    console.log('failed');
                }
            });
        };


    });


    $('.group_invites_target button').click(function () {
        let state = $(this).text();
        let current_id = $(this).parent()[0].id;

        console.log(state);
        console.log(current_id);


        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: crf_token,
                state: "inactive",
                'request_motive': 'accept_reject_group_invite',
                'group_id': current_id,
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
});