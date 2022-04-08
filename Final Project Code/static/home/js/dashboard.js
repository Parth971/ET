$(document).ready(function () {    

    // display all not friends list 
    function display_not_friends_list(){
        not_friends = '';

        for(const [key, value] of Object.entries(not_friend_users)) {
            not_friends += `<li class="list-group-item d-flex align-items-center not_friend_target" id='${value['id']}'>
            <div class="col-xs-8 pull-left me-auto">
                <p><strong>${value['username']}</strong></p>
            </div>
            <div class="col-xs-4 pull-right">
                <button type="button" class="btn btn-success">invite<i class="fa fa-paper-plane-o"
                        aria-hidden="true"></i></button>
            </div>
        </li>`;
        }

        if(jQuery.isEmptyObject(not_friend_users) || not_friends == '') {
            not_friends = ` <li class="list-group-item d-flex align-items-center">
                                <div class="col-xs-8 pull-left me-auto">
                                    <p><strong>No Users</strong></p>
                                </div>
                            </li>`;
        }
        not_friends += `<li class="list-group-item align-items-center" id='invite_error'>
                            <div class="col-xs-8 pull-left me-auto">
                                <p><strong></strong></p>
                            </div>
                        </li> `;
        $('#add_friend_modal .modal-body .list-group').empty();
        $('#add_friend_modal .modal-body .list-group').append(not_friends);
    }

    display_not_friends_list();
    $('#search_friend input').keyup(function(){
        let search_string = $('#search_friend input').val();
        if(search_string == '') {
            display_not_friends_list();
        }
        else {
            let content = '';
            for(const [key, value] of Object.entries(not_friend_users)) {
                if (value['username'].toLowerCase().includes(search_string.toLowerCase())) {
                    content += `<li class="list-group-item d-flex align-items-center not_friend_target" id='${value['id']}'>
                    <div class="col-xs-8 pull-left me-auto">
                        <p><strong>${value['username']}</strong></p>
                    </div>
                    <div class="col-xs-4 pull-right">
                        <button type="button" class="btn btn-success">invite<i class="fa fa-paper-plane-o"
                                aria-hidden="true"></i></button>
                    </div>
                </li>`;
                }
            }
            if(jQuery.isEmptyObject(not_friend_users) || content == '') {
                content = ` <li class="list-group-item d-flex align-items-center">
                                    <div class="col-xs-8 pull-left me-auto">
                                        <p><strong>No Users</strong></p>
                                    </div>
                                </li>`;
            }
            content += `<li class="list-group-item align-items-center" id='invite_error'>
                                <div class="col-xs-8 pull-left me-auto">
                                    <p><strong></strong></p>
                                </div>
                            </li> `;
            $('#add_friend_modal .modal-body .list-group').empty();
            $('#add_friend_modal .modal-body .list-group').append(content);
        }
        
    });

    $('#search_friend input[type=search]').on('search', function () {
        display_not_friends_list();
    });



    function remove_clicked_class() {
        $('#dashboard_side_bar').removeClass('side_bar_row_clicked');
        $('#activity_side_bar').removeClass('side_bar_row_clicked');
        // $('#all_expense_side_bar').removeClass('side_bar_row_clicked');

        let all_friends_elements = $('.friends_name_list_wrapper').children()
        let all_groups_elements = $('.group_name_list_wrapper').children()

        for (let i = 0; i < all_friends_elements.length; i++) {
            $(all_friends_elements[i]).removeClass('side_bar_row_clicked');
        }
        for (let i = 0; i < all_groups_elements.length; i++) {
            $(all_groups_elements[i]).removeClass('side_bar_row_clicked');
        }

    }

    $('.dashboard_wrapper').css('display', 'block');
    $('.activity_wrapper').css('display', 'none');
    // $('.all_expense_wrapper').css('display', 'none');
    $('.data_box_wrapper').css('display', 'none');

    $('#dashboard_side_bar').click(function () {
        $('.dashboard_wrapper').css('display', 'block');
        $('.activity_wrapper').css('display', 'none');
        // $('.all_expense_wrapper').css('display', 'none');
        $('.data_box_wrapper').css('display', 'none');

        remove_clicked_class();
        $('#dashboard_side_bar').addClass('side_bar_row_clicked');

    });
    $('#activity_side_bar').click(function () {
        $('.dashboard_wrapper').css('display', 'none');
        $('.activity_wrapper').css('display', 'block');
        // $('.all_expense_wrapper').css('display', 'none');
        $('.data_box_wrapper').css('display', 'none');

        remove_clicked_class();
        $('#activity_side_bar').addClass('side_bar_row_clicked');

    });
    // $('#all_expense_side_bar').click(function () {
    //     $('.dashboard_wrapper').css('display', 'none');
    //     $('.activity_wrapper').css('display', 'none');
    //     $('.all_expense_wrapper').css('display', 'block');
    //     $('.data_box_wrapper').css('display', 'none');

    //     remove_clicked_class();
    //     $('#all_expense_side_bar').addClass('side_bar_row_clicked');

    // });

    $('#add_expense_modal').on('hidden.bs.modal', function (e) {
        reset_expense();
        $("#friend_radio_btn").prop("checked", true);
        $('.group_modal').addClass('hide-modal');
        $('.friend_modal').removeClass('hide-modal');
        $('#add_friend_expense_response').css('display', 'none');

    });

    $('#notification .dropdown-menu').click(function(e){
        e.stopPropagation();
    });

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // frind clicked 
    $('.friend_name_list').click(function () {
        $('.data_box_body').empty();
        console.log(this.id);
        let friend_user_id = this.id;
        remove_clicked_class();
        $(this).addClass('side_bar_row_clicked');

        $('.dashboard_wrapper').css('display', 'none');
        $('.activity_wrapper').css('display', 'none');
        // $('.all_expense_wrapper').css('display', 'none');
        $('.data_box_wrapper').css('display', 'block');

        // get this details for this friend id 
        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: crf_token,
                state: "inactive",
                'request_motive': 'get_friend',
                'friend_user_id': friend_user_id
            },
            type: 'post',
            success: function (result) {
                console.log(result);

                let content = `
                <div class="group_data_container" id='details_${result['friend_user_id']}'>
                    <div class="group_header d-flex" style="margin-bottom: 30px;">
                        <div class="me-auto">
                            <h3 >${capitalizeFirstLetter(result['friend_name'])}<span style='font-size: 15px;margin-left: 5px;'><span class="badge bg-success">${result['group_status']}</span></h3>
                            <button type="button" class="btn btn-success" disabled>
                                ${result['group_members_name'][0]} - ${result['group_members_name'][1]}
                            </button>
                            </div>
                        <p>Created on ${new Date(result['group_date']).toLocaleDateString("en-US")}</p>
                    </div>
                    <div class="group_body">

                        <div class="accordion" id="accordionExample">
                            `;
                let middle = '';
                for (let i = 0; i < result['settlements'].length; i++) {

                    let settlement = result['settlements'][i];
                    // console.log(settlement);

                    let settle_btn = '';
                    if (settlement['debt'] != 0 && settlement['bill_id__status'] == 'UNSETTLED') {
                        settle_btn = '<button type="button" class="btn btn-primary btn-sm settle_button_target" id="F_'+settlement['bill_id_id']+'" data-bs-toggle="modal" data-bs-target="#settlement_modal">Settle</button>';
                    }

                    let looping_content = `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="heading${i}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                    data-bs-target="#collapse${i}" aria-expanded="true"
                                    aria-controls="collapse${i}">
                                    ${settlement['bill_id__bill_name']} (${get_my_status(settlement['debt'], get_lent_amount(settlement['paid'], settlement['debt'], settlement['must_pay']), settlement['bill_id__status'])})
                                </button>
                            </h2>
                            <div id="collapse${i}" class="accordion-collapse collapse"
                                aria-labelledby="heading${i}" data-bs-parent="#accordionExample">
                                <div class="accordion-body">
                                    <table class="table table-hover table-striped">
                                        <tbody>
                                            <tr>
                                                <th class="table-dark" scope="col">Expense Name</th>
                                                <th class="table-dark" scope="col">${capitalizeFirstLetter(settlement['bill_id__bill_name'])}</th>
                                            </tr>
                                            <tr>
                                                <td scope="col">Date & Time</td>
                                                <td scope="col">${new Date(settlement['bill_id__date']).toLocaleDateString("en-US")}, ${new Date(settlement['bill_id__date']).getHours()}:${new Date(settlement['bill_id__date']).getMinutes()}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Split Type</td>
                                                <td scope="col">${capitalizeFirstLetter(settlement['bill_id__split_type'])}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Current Status</td>
                                                <td class="text-success" scope="col">${get_my_status(settlement['debt'], get_lent_amount(settlement['paid'], settlement['debt'], settlement['must_pay']), settlement['bill_id__status'])}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Amount Paid by You</td>
                                                <td scope="col">&#8377; ${settlement['paid']}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Amount on your Part</td>
                                                <td scope="col">&#8377; ${settlement['must_pay']}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Debt Amount</td>
                                                <td scope="col">
                                                    <div class="d-flex">
                                                        <span class="me-auto align-self-center">&#8377; ${settlement['debt']}</span>
                                                        ${settle_btn}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Lent Amount</td>
                                                <td scope="col">&#8377; ${get_lent_amount(settlement['paid'], settlement['debt'], settlement['must_pay'])}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold" scope="col">Total Amount</td>
                                                <td class="fw-bold" scope="col">&#8377; ${settlement['bill_id__amount']}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>`;
                    middle += looping_content;
                }

                let after_content = `
                        </div>
                    </div>
                </div>`;

                if (result['settlements'].length == 0) {
                    middle = `<div class="alert alert-info" role="alert">
                    No expenses found!
                  </div>`;
                }

                let html_content = content + middle + after_content;
                $('.data_box_body').empty();
                $('.data_box_body').append(html_content);

                $('.settle_button_target').click(function(){
                    let current_button = $(this);
                    let bill_id = current_button.attr('id');
                    console.log(bill_id);
                    $('#settle_bill_id').val(bill_id);
                    $('#max_payment_amount').val(current_button.prev().text());

                    $('#payers_list_dropdown_target').parent().hide();
                    let dropdown_content = `<option selected value="${result['friend_user_id']}">${result['friend_name']}</option>`;


                    $('#payers_list_dropdown_target').empty();
                    $('#payers_list_dropdown_target').append(dropdown_content);
                    
                });

            },
            failure: function () {
                console.log('failed');
            }
        });


    });

    $('#settle_payment_pay_button').click(function () {
        $('.settle_response_message').empty();
        $('.settle_response_message').css('display', 'none');

        let max_payment_amount = parseInt($('#max_payment_amount').val());
        let error = false;
        let payer_id;
        let category = $('#settle_bill_id').val().split('_')[0];
        let bill_id = $('#settle_bill_id').val().split('_')[1];
        let payer_val = $('#payers_list_dropdown_target option:selected').val()
        let current_value = $('#settle_payment').val()

        if(payer_val == '0') {
            $('#payers_list_dropdown_target').css('border', '1px solid red');
            error = true;
        }
        else {
            $('#payers_list_dropdown_target').css('border', '1px solid #ced4da');
            payer_id = $('#payers_list_dropdown_target option:selected').val();
        }
        
        if(isPositiveInteger(current_value)) {
            current_value = parseInt(current_value);
            if (current_value <= 0 || current_value > max_payment_amount) {
                $('.invalid_value_error').css('display', 'block');
                console.log('not valid');
                error = true;
            }
            else {
                $('.invalid_value_error').css('display', 'none');
            }
        }
        else {
            $('.invalid_value_error').css('display', 'block');
            error = true;
        }
        
        

        if (!error) {
            console.log(category);
            console.log(bill_id);
            console.log(current_value);
            console.log(payer_id);
            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'settle_payment',
                    'category': category,
                    'bill_id': bill_id,
                    'payed_amount': current_value,
                    'payer_id': payer_id
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
                    if(result.status == 'success') {
                    //     $('#max_payment_amount').val(max_payment_amount-current_value);
                    //     $('#settle_payment').val('');
                    //     $('.settle_response_message').empty();
                    //     $('.settle_response_message').css('display', 'block');
                    //     $('.settle_response_message').append(`<div class="alert alert-success d-flex align-items-center" role="alert">
                    //     <img class="bi flex-shrink-0 me-2" width="24" height="24" src = "${svg_success_image}" alt="Success icon"/>
                    //     <div>
                    //       ${result.message}
                    //     </div>
                    //   </div>`);
                        location.reload();
                    }
                    else {
                        $('.settle_response_message').empty();
                        $('.settle_response_message').css('display', 'block');
                        $('.settle_response_message').append(`<div class="alert alert-danger d-flex align-items-center" role="alert">
                        <img class="bi flex-shrink-0 me-2" width="24" height="24" src = "${svg_failed_image}" alt="Failed icon"/>
                        <div>
                          ${result.message}
                        </div>
                      </div>`);
                    }
                    

                },
                failure: function () {
                    console.log('failed');
                }
            });
        }


    });

    $('#settlement_modal').on('hidden.bs.modal', function (e) {
        $('#settle_bill_id').val('');
        $('#max_payment_amount').val('');
        $('#settle_payment').val('')
        $('.settle_response_message').empty();
        $('.settle_response_message').css('display', 'none');
        $('.invalid_value_error').css('display', 'none');
        $('#payers_list_dropdown_target').empty();

    });

    function get_lent_amount(paid, debt, must_pay) {
        if (debt != 0) {
            return 0;
        }
        return paid - must_pay;

    }

    function get_my_status(debt, lent, current_status) {
        if(current_status == 'PENDING' || current_status == 'REJECTED') {
            return current_status
        }
        
        if(lent == 0 && debt == 0) {
            return 'SETTLED'
        }
        else {
            return 'UNSETTLED'
        }
    }

    // group clicked 
    $('.group_name_list').click(function () {
        $('.data_box_body').empty();
        let group_id = this.id;
        console.log(group_id);

        remove_clicked_class();
        $(this).addClass('side_bar_row_clicked');

        $('.dashboard_wrapper').css('display', 'none');
        $('.activity_wrapper').css('display', 'none');
        // $('.all_expense_wrapper').css('display', 'none');
        $('.data_box_wrapper').css('display', 'block');

        // get this details for this group id 
        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: crf_token,
                state: "inactive",
                'request_motive': 'get_group',
                'group_id': group_id
            },
            type: 'post',
            success: function (result) {
                console.log(result);

                let content = `
                <div class="group_data_container" id='details_${result['group_id']}'>
                    <div class="group_header d-flex" style="margin-bottom: 30px;">
                        <div class="me-auto">
                            <h3 >${capitalizeFirstLetter(result['group_name'])}<span style='font-size: 15px;margin-left: 5px;'><span class="badge bg-success">${result['group_status']}</span></h3>
                            <div class="position-relative mt-3">
                                <button class="btn btn-success position-relative" type="button" data-bs-toggle="collapse" data-bs-target="#collapseWidthExample" aria-expanded="false" aria-controls="collapseWidthExample">
                                Members
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    ${result['total_members']}
                                    <span class="visually-hidden">unread messages</span>
                                </span>
                            </button>
                            <div style="position: absolute; top: -5px; left: 105px;">
                                <div class="collapse collapse-horizontal" id="collapseWidthExample">
                                    <div class="card card-body" style="width: 300px;">
                                        <span>${result['group_members_name'].join()}</span>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>
                        <p>Dated on ${new Date(result['group_date']).toLocaleDateString("en-US")}</p>
                    </div>
                    <div class="group_body">

                        <div class="accordion" id="accordionExample">
                            `;
                let middle = '';
                for (let i = 0; i < result['settlements'].length; i++) {
                    let settlement = result['settlements'][i];

                    let settle_btn = '';
                    if (settlement['debt'] != 0 && settlement['bill_id__status'] == 'UNSETTLED') {
                        settle_btn = '<button type="button" class="btn btn-primary btn-sm settle_button_target" id="G_'+settlement['bill_id_id']+'_'+i+'" data-bs-toggle="modal" data-bs-target="#settlement_modal">Settle</button>';
                    }

                    let looping_content = `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="heading${i}">
                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                    data-bs-target="#collapse${i}" aria-expanded="true"
                                    aria-controls="collapse${i}">
                                    ${capitalizeFirstLetter(settlement['bill_id__bill_name'])} (${get_my_status(settlement['debt'], get_lent_amount(settlement['paid'], settlement['debt'], settlement['must_pay']), settlement['bill_id__status'])})
                                </button>
                            </h2>
                            <div id="collapse${i}" class="accordion-collapse collapse"
                                aria-labelledby="heading${i}" data-bs-parent="#accordionExample">
                                <div class="accordion-body">
                                    <table class="table table-hover table-striped">
                                        <tbody>
                                            <tr>
                                                <th class="table-dark" scope="col">Expense Name</th>
                                                <th class="table-dark" scope="col">${capitalizeFirstLetter(settlement['bill_id__bill_name'])}</th>
                                            </tr>
                                            <tr>
                                                <td scope="col">Date & Time</td>
                                                <td scope="col">${new Date(settlement['bill_id__date']).toLocaleDateString("en-US")}, ${new Date(settlement['bill_id__date']).getHours()}:${new Date(settlement['bill_id__date']).getMinutes()}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Split Type</td>
                                                <td scope="col">${settlement['bill_id__split_type']}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Current Status</td>
                                                <td class="text-success" scope="col">${get_my_status(settlement['debt'], get_lent_amount(settlement['paid'], settlement['debt'], settlement['must_pay']), settlement['bill_id__status'])}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Amount Paid by You</td>
                                                <td scope="col">&#8377; ${settlement['paid']}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Amount on your Part</td>
                                                <td scope="col">&#8377; ${settlement['must_pay']}</td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Debt Amount</td>
                                                <td scope="col">
                                                    <div class="d-flex">
                                                        <span class="me-auto align-self-center">&#8377; ${settlement['debt']}</span>
                                                        ${settle_btn}
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td scope="col">Lent Amount</td>
                                                <td scope="col">&#8377; ${get_lent_amount(settlement['paid'], settlement['debt'], settlement['must_pay'])}</td>
                                            </tr>
                                            <tr>
                                                <td class="fw-bold" scope="col">Total Amount</td>
                                                <td class="fw-bold" scope="col">&#8377; ${settlement['bill_id__amount']}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>`;
                    middle += looping_content;
                }

                let after_content = `
                        </div>
                    </div>
                </div>`;

                if (result['settlements'].length == 0) {
                    middle = `<div class="alert alert-info" role="alert">
                    No expenses found!
                  </div>`;
                }

                let html_content = content + middle + after_content;
                $('.data_box_body').empty();
                $('.data_box_body').append(html_content);

                $('.settle_button_target').click(function(){
                    let current_button = $(this);
                    let bill_id = current_button.attr('id');
                    console.log(bill_id);
                    let dropdown_content = `<option value='0' selected>Select Payers</option>`;

                    let bill_number = parseInt(bill_id.split('_')[2]);
                    for(let k=0; k<result['payers_list'][bill_number].length; k++) {
                        dropdown_content += `<option value="${result['payers_list'][[bill_number]][k]['user_id_id']}">${result['payers_list'][[bill_number]][k]['user_id__username']}</option>`;
                    }

                    $('#payers_list_dropdown_target').empty();
                    $('#payers_list_dropdown_target').append(dropdown_content);
                    $('#payers_list_dropdown_target').parent().show();

                    $('#settle_bill_id').val(bill_id);
                    $('#max_payment_amount').val(current_button.prev().text());
                });

            },
            failure: function () {
                console.log('failed');
            }
        });




    });

    // add_group_btn
    $('#add_group_btn').click(function () {
        console.log('add_group_btn');
        $("#add_group_modal").modal('show');
    });

    // add_friend_btn
    $('#add_friend_btn').click(function () {
        console.log('add_friend_btn');
        $("#add_friend_modal").modal('show');
    });

    // invite friend 
    $('.not_friend_target button').click(function () {
        let cuurent_button = $(this);
        let friend_request_id = $(this).parent().parent().attr('id');

        $.ajax({
            url: url,
            data: {
                csrfmiddlewaretoken: crf_token,
                state: "inactive",
                'request_motive': 'invite_friend',
                'friend_id': friend_request_id
            },
            type: 'post',
            success: function (result) {
                console.log(result);

                if (result.status == 'success') {
                    cuurent_button.text('invite sent');
                    cuurent_button.attr('disabled', true);
                }
                else if (result.status == 'failed') {
                    cuurent_button.text(result.message);
                    cuurent_button.attr('disabled', true);
                }
                else {
                    $('#invite_error div p strong').text(result.message);
                    $('#invite_error').css('display', 'block');
                    $('#invite_error div p').css('color', 'red');
                }
            },
            failure: function () {
                console.log('failed');
            }
        });

    });

    // accept or reject friend request 
    $('.accept_reject_friend_invite_target button').click(function () {
        let cuurent_button_parent = $(this).parent()
        let act_send_id = $(this).parent().parent().attr('id');

        let status = $(this).css('content').slice(1,-1);
        console.log(status);
        console.log(this);
        let activity_id = parseInt(act_send_id.split('_')[0]);
        let sender_id = parseInt(act_send_id.split('_')[1]);


        if (status == 'Accept' || status == 'Reject') {
            console.log(status);
            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'accept_reject_friend_request',
                    'status': status,
                    'activity_id': activity_id,
                    'sender_id': sender_id,
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
    
                    if (result.status == 'success') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class=" mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                    }
                    else if (result.status == 'failed') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class="mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                    }
                    else {
                        $('#friend_request_error div p strong').text(result.message);
                        $('#friend_request_error').css('display', 'block');
                        $('#friend_request_error div p').css('color', 'red');
                    }
    
                },
                failure: function () {
                    console.log('failed');
                }
            });
        }
        

    });

    // accept or reject group request 
    $('.accept_reject_group_invite_target button').click(function () {
        let cuurent_button_parent = $(this).parent()
        let act_group_id = $(this).parent().parent().attr('id');

        let status = $(this).css('content').slice(1,-1);
        console.log(status);
        console.log(this);
        let activity_id = parseInt(act_group_id.split('_')[0]);
        let group_id = parseInt(act_group_id.split('_')[1]);

        if (status == 'Accept' || status == 'Reject') {
            console.log(status);

            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'accept_reject_group_request',
                    'status': status,
                    'activity_id': activity_id,
                    'group_id': group_id,
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
    
                    if (result.status == 'success') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class="mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                    }
                    else if (result.status == 'failed') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class="mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                    }
                    else {
                        $('#group_request_error div p strong').text(result.message);
                        $('#group_request_error').css('display', 'block');
                        $('#group_request_error div p').css('color', 'red');
                    }
    
                },
                failure: function () {
                    console.log('failed');
                }
            });

        }

        

    });

    // friend-group expense tabs 
    $('input[type=radio][name=friend_group_radio]').change(function () {
        if ($(this).val() == 'friend') {
            $('.group_modal').addClass('hide-modal');
            $('.friend_modal').removeClass('hide-modal');
        }
        else {
            $('.friend_modal').addClass('hide-modal');
            $('.group_modal').removeClass('hide-modal');
        }
        reset_expense();
        $('#add_friend_expense_response').css('display', 'none');
    });

    // for getting frends list for adding group 
    var friends_ids = new Array();
    $('.target_friend').click(function () {
        let current_selected_friend_name = $(this).text();
        let current_selected_friend_id = this.id;

        if (friends_ids.indexOf(current_selected_friend_id) < 0) {

            friends_ids.push(current_selected_friend_id);

            $('.span_friend_group').append(`<span class="alert alert-success alert-dismissible fade show" id='_` + current_selected_friend_id + `' role="alert">` + current_selected_friend_name + ` 
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </span>`);
        }
        $('.alert').click(function () {
            let index = friends_ids.indexOf(this.id.slice(1,));
            if (index > -1) {
                friends_ids.splice(index, 1);
            }
        });

    });
    // add group 
    $('#add_group_submit_btn').click(function () {

        // clear preveous messages 
        $('#add_group_response').css('display', 'none');
        $('#add_group_response').empty();

        let error = false;
        let group_name;
        let member_ids = friends_ids;

        if (member_ids.length < 2) {
            error = true;
            $('#group_member_number_error').css('display', 'inline');
        }
        else {
            $('#group_member_number_error').css('display', 'none');
        }

        var re = /^(?!\s)(?!.*\s$)(?=.*[a-zA-Z0-9])[a-zA-Z0-9 -]{2,}$/;
        if (re.test($('#group_name_input').val())) {
            $('#group_name_error').css('display', 'none');
            group_name = $('#group_name_input').val();
        }
        else {
            $('#group_name_error').css('display', 'inline');
            error = true;
        }


        if (!error) {
            console.log('submitted!');
            console.log(group_name);
            console.log(member_ids);

            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'invite_for_new_group',
                    'group_name': group_name,
                    'member_ids': JSON.stringify(member_ids)
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
                    $('#create_new_group_form').trigger("reset");
                    $('.span_friend_group').empty();
                    friends_ids = [];


                    $('#add_group_response').css('display', 'block');
                    if (result.status == 'failed') {
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


    // add expense btn 
    $('#add_expense').click(function () {
        let tab = $('input[type=radio][name=friend_group_radio]:checked').val();

        if (tab == 'friend') {
            add_expense_with_friend();
        }
        else {
            add_expense_with_group();
        }


    });

    // change in friend name inside expense 
    $('#friend_name').change(function () {
        let wrapper = $('#all_friend_members_with_amount_wrapper .row')
        wrapper.empty();

        $('#friend_total_amount').val(0);

        let actual_amount_wrapper = $('#all_friend_members_with_actual_amount_wrapper .row')
        actual_amount_wrapper.empty();

        if ($('#friend_name option:selected').text() != 'Choose...') {
            let current_id = $(this).val();
            let current_selceted_friend_name = $('#friend_name option:selected').text();

            let s = `<p>Payers</p>`;
            let s2 = `<p>After Split</p>`;


            s += `<div class="col-md-6 col-sm-6 col-lg-6">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" aria-label="Username"
                        value='`+ current_user_details[1] + `' disabled>
                    <span class="input-group-text">&#8377;</span>
                    <input type="text" class="form-control friend_members_input_target" id="`+ current_user_details[0] + '_' + current_user_details[1] + `" aria-label="amount" value='0'>
                </div>
            </div>`;

            s2 += `<div class="col-md-6 col-sm-6 col-lg-6">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" aria-label="Username"
                        value='`+ current_user_details[1] + `' disabled>
                    <span class="input-group-text">&#8377;</span>
                    <input type="text" class="form-control friend_members_must_pay_input_target" id="mustpay_`+ current_user_details[0] + '_' + current_user_details[1] + `" aria-label="amount" value='0'>
                    <span class="input-group-text friend-percentage-span" style='display:none;'>%</span>
                </div>
            </div>`;

            s += `<div class="col-md-6 col-sm-6 col-lg-6">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" aria-label="Username"
                        value='`+ current_selceted_friend_name + `' disabled>
                    <span class="input-group-text">&#8377;</span>
                    <input type="text" class="form-control friend_members_input_target" id="`+ current_id + '_' + current_selceted_friend_name + `" aria-label="amount" value='0'>
                </div>
            </div>`;

            s2 += `<div class="col-md-6 col-sm-6 col-lg-6">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" aria-label="Username"
                        value='`+ current_selceted_friend_name + `' disabled>
                    <span class="input-group-text">&#8377;</span>
                    <input type="text" class="form-control friend_members_must_pay_input_target" id="mustpay_`+ current_id + '_' + current_selceted_friend_name + `" aria-label="amount" value='0'>
                    <span class="input-group-text friend-percentage-span" style='display:none;'>%</span>
                </div>
            </div>`;

            wrapper.append(s);
            actual_amount_wrapper.append(s2);

            let all_ele = $('.friend_members_input_target');
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                current_ele.keyup(friend_validate_amounts);
                current_ele.keyup(friend_validate_amounts);
            }

            let all_ele2 = $('.friend_members_must_pay_input_target');
            for (let k = 0; k < all_ele2.length; k++) {
                let current_input = all_ele2[k];
                let current_ele = $('#' + current_input.id);
                current_ele.keyup(friend_must_pay_amounts);
                current_ele.keyup(friend_must_pay_amounts);
            }

        }
    });

    // check for split type inside friend
    $('#friend_split_type').change(friend_split_type_update);

    // change in group name inside expense 
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
            for (let k = 0; k < current_members_tuple.length; k++) {
                let name = current_members_tuple[k][1];
                let id = current_members_tuple[k][0];

                s += `<div class="col-md-6 col-sm-6 col-lg-6">
                <div class="input-group mb-3">
                    <input type="text" class="form-control" aria-label="Username"
                        value='`+ name + `' disabled>
                    <span class="input-group-text">&#8377;</span>
                    <input type="text" class="form-control grp_members_input_target" id="`+ id + '_' + name + `" aria-label="amount" value='0'>
                </div>
            </div>`;

                s2 += `<div class="col-md-6 col-sm-6 col-lg-6">
                    <div class="input-group mb-3">
                        <input type="text" class="form-control" aria-label="Username"
                            value='`+ name + `' disabled>
                        <span class="input-group-text">&#8377;</span>
                        <input type="text" class="form-control grp_members_must_pay_input_target" id="mustpay_`+ id + '_' + name + `" aria-label="amount" value='0'>
                        <span class="input-group-text percentage-span" style='display:none;'>%</span>
                    </div>
                </div>`;
            }

            wrapper.append(s);
            actual_amount_wrapper.append(s2);

            let all_ele = $('.grp_members_input_target');
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                current_ele.keyup(validate_amounts);
                current_ele.keyup(validate_amounts);
            }

            let all_ele2 = $('.grp_members_must_pay_input_target');
            for (let k = 0; k < all_ele2.length; k++) {
                let current_input = all_ele2[k];
                let current_ele = $('#' + current_input.id);
                current_ele.keyup(must_pay_amounts);
                current_ele.keyup(must_pay_amounts);
            }

        }
    });

    // check for split type inside group
    $('#split_type').change(split_type_update);

    // reset both forms 
    $('#reset_form').click(function () {
        reset_expense();
        $('#add_friend_expense_response').css('display', 'none');
    });


    function friend_validate_amounts() {
        let all_ele = $('.friend_members_input_target');
        let total = 0;
        for (let k = 0; k < all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#' + current_input.id);
            if (isPositiveInteger(current_ele.val())) {
                total += parseFloat(current_ele.val());
                current_ele.css('border', '1px solid #ced4da');
            }
            else {
                current_ele.css('border', '1px solid red');
            }
        }
        friend_split_type_update();
        $('#friend_total_amount').val(total);
    }

    function friend_must_pay_amounts() {
        let all_ele = $('.friend_members_must_pay_input_target');
        for (let k = 0; k < all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#' + current_input.id);
            if (isPositiveInteger(current_ele.val())) {
                current_ele.css('border', '1px solid #ced4da');
            }
            else {
                current_ele.css('border', '1px solid red');
            }
        }
    }

    function friend_split_type_update() {
        let all_ele = $('.friend_members_must_pay_input_target');
        let per_person_amount = (parseFloat($('#friend_total_amount').val()) / all_ele.length).toFixed(2);
        let not_divisible = false;
        let remaining_amount = 0;
        if (parseInt(per_person_amount) != per_person_amount) {
            not_divisible = true;
            remaining_amount = (per_person_amount - parseFloat(+ per_person_amount.toString().split(".")[0])) * all_ele.length;
            remaining_amount = Math.round(remaining_amount);
            per_person_amount = parseInt(per_person_amount);
        }
        if ($('#friend_split_type option:selected').text() == 'Equal') {
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                current_ele.attr('disabled', true);

                if (not_divisible) {
                    if (remaining_amount != 0) {
                        current_ele.val(per_person_amount + 1);
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
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                current_ele.attr('disabled', false);
            }
        }

        if ($('#friend_split_type option:selected').text() == 'Percentage') {
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                $('.friend-percentage-span').css('display', 'block');
            }
        }
        else {
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                $('.friend-percentage-span').css('display', 'none');
            }
        }

    }



    function must_pay_amounts() {
        let all_ele = $('.grp_members_must_pay_input_target');
        for (let k = 0; k < all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#' + current_input.id);
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
        for (let k = 0; k < all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#' + current_input.id);
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
        let per_person_amount = (parseFloat($('#total_amount').val()) / all_ele.length).toFixed(2);
        let not_divisible = false;
        let remaining_amount = 0;
        if (parseInt(per_person_amount) != per_person_amount) {
            not_divisible = true;
            remaining_amount = (per_person_amount - parseFloat(+ per_person_amount.toString().split(".")[0])) * all_ele.length;
            remaining_amount = Math.round(remaining_amount);
            console.log(remaining_amount);
            per_person_amount = parseInt(per_person_amount);
        }
        if ($('#split_type option:selected').text() == 'Equal') {
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                current_ele.attr('disabled', true);

                if (not_divisible) {
                    if (remaining_amount != 0) {
                        current_ele.val(per_person_amount + 1);
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
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                current_ele.attr('disabled', false);
            }
        }

        if ($('#split_type option:selected').text() == 'Percentage') {
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                $('.percentage-span').css('display', 'block');
            }
        }
        else {
            for (let k = 0; k < all_ele.length; k++) {
                let current_input = all_ele[k];
                let current_ele = $('#' + current_input.id);
                $('.percentage-span').css('display', 'none');
            }
        }

    }



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

    function reset_expense() {
        $('#friend_name').val('0');
        $('#friend_expense_name').val('');
        $('#all_friend_members_with_amount_wrapper .row').empty();
        $('#friend_total_amount').val('0');
        $('#friend_amount-zero').css('display', 'none');
        $('#friend_split_type').val('0');
        $('#all_friend_members_with_actual_amount_wrapper .row').empty();
        $('#friend_total_amount_remaining').css('display', 'none');
        $('#friend_datetime-local').val('');
        $('#friend_message-text').val('');

        $('#friend_name').css('border', '1px solid #ced4da');
        $('#friend_expense_name').css('border', '1px solid #ced4da');
        $('#friend_split_type').css('border', '1px solid #ced4da');
        $('#friend_datetime-local').css('border', '1px solid #ced4da');

        $('#group_name').val('0');
        $('#expense_name').val('');
        $('#all_grp_members_with_amount_wrapper .row').empty();
        $('#total_amount').val('0');
        $('#amount-zero').css('display', 'none');
        $('#split_type').val('0');
        $('#all_grp_members_with_actual_amount_wrapper .row').empty();
        $('#total_amount_remaining').css('display', 'none');
        $('#datetime-local').val('');
        $('#message-text').val('');

        $('#group_name').css('border', '1px solid #ced4da');
        $('#expense_name').css('border', '1px solid #ced4da');
        $('#split_type').css('border', '1px solid #ced4da');
        $('#datetime-local').css('border', '1px solid #ced4da');
    }


    function add_expense_with_friend() {
        console.log('friends');
        $('#add_friend_expense_response').css('display', 'none');
        $('#add_friend_expense_response').empty();

        let error = false;
        let friend_id;
        let friend_expense_name;
        let total_amount;
        let member_payed_amount_dic = {};
        let member_must_pay_amount_dic = {};
        let split_type;
        let datetime;
        let message;

        if ($('#friend_name option:selected').text() == 'Choose...') {
            $('#friend_name').css('border', '1px solid red');
            error = true;
        }
        else {
            $('#friend_name').css('border', '1px solid #ced4da');
            friend_id = $('#friend_name option:selected').val();

        }

        var re = /^(?!\s)(?!.*\s$)(?=.*[a-zA-Z0-9])[a-zA-Z0-9 -]{2,}$/;
        if (re.test($('#friend_expense_name').val())) {
            $('#friend_expense_name').css('border', '1px solid #ced4da');
            friend_expense_name = $('#friend_expense_name').val();
        } else {
            $('#friend_expense_name').css('border', '1px solid red');
            error = true;
        }

        let all_ele2 = $('.friend_members_input_target');
        for (let k = 0; k < all_ele2.length; k++) {
            let current_input = all_ele2[k];
            let current_ele = $('#' + current_input.id);
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

        if (parseInt($('#friend_total_amount').val()) == 0) {
            $('#friend_amount-zero').css('display', 'block');
            error = true;
        }
        else {
            total_amount = parseInt($('#friend_total_amount').val());
            $('#friend_amount-zero').css('display', 'none');
        }

        if ($('#friend_split_type option:selected').text() == 'Choose...') {
            $('#friend_split_type').css('border', '1px solid red');
            error = true;
        }
        else {
            $('#friend_split_type').css('border', '1px solid #ced4da');
            split_type = $('#friend_split_type option:selected').val();
        }

        let all_ele = $('.friend_members_must_pay_input_target');
        let sum = 0;
        for (let k = 0; k < all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#' + current_input.id);
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
                $('#friend_total_amount_remaining').css('display', 'none');
            }
            else {
                $('#friend_total_amount_remaining').css('display', 'block');
                error = true;
            }
        }

        if (split_type == 'exact' && total_amount) {
            if (sum == total_amount) {
                $('#friend_total_amount_remaining').css('display', 'none');
            }
            else {
                $('#friend_total_amount_remaining').css('display', 'block');
                error = true;
            }
        }

        if (split_type == 'percentage' && total_amount) {
            if (sum == 100) {
                $('#friend_total_amount_remaining').css('display', 'none');
            }
            else {
                $('#friend_total_amount_remaining').css('display', 'block');
                error = true;
            }
        }

        if ($('#friend_datetime-local').val() == '') {
            $('#friend_datetime-local').css('border', '1px solid red');
            error = true;
        }
        else {
            datetime = $('#friend_datetime-local').val();
            $('#friend_datetime-local').css('border', '1px solid #ced4da');
        }


        if ($('#friend_message-text').val() == '') {
            message = 'New Expense, hurry and accept it!!';
        }
        else {
            message = $('#friend_message-text').val();
        }

        if (!error) {
            console.log('Submitted!');
            console.log(friend_id);
            console.log(friend_expense_name);
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
                    'request_motive': 'add_friend_expense',
                    'friend_id': friend_id,
                    'friend_expense_name': friend_expense_name,
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
                    $('#add_friend_expense_response').css('display', 'block');
                    if (result.status == 'success') {
                        $('#add_friend_expense_response').removeClass('alert-danger');
                        $('#add_friend_expense_response').addClass('alert-success');
                        reset_expense();
                    }
                    else {
                        $('#add_friend_expense_response').removeClass('alert-success');
                        $('#add_friend_expense_response').addClass('alert-danger');
                    }
                    $('#add_friend_expense_response').text(result.message);

                },
                failure: function () {
                    console.log('failed');
                }
            });




        }




    };

    function add_expense_with_group() {
        console.log('groups');
        $('#add_group_expense_response').css('display', 'none');
        $('#add_group_expense_response').empty();

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

        var re = /^(?!\s)(?!.*\s$)(?=.*[a-zA-Z0-9])[a-zA-Z0-9 -]{2,}$/;
        if (re.test($('#expense_name').val())) {
            $('#expense_name').css('border', '1px solid #ced4da');
            expense_name = $('#expense_name').val();
        } else {
            $('#expense_name').css('border', '1px solid red');
            error = true;
        }

        let all_ele2 = $('.grp_members_input_target');
        for (let k = 0; k < all_ele2.length; k++) {
            let current_input = all_ele2[k];
            let current_ele = $('#' + current_input.id);
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
        for (let k = 0; k < all_ele.length; k++) {
            let current_input = all_ele[k];
            let current_ele = $('#' + current_input.id);
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
                    $('#add_group_expense_response').css('display', 'block');
                    if (result.status == 'success') {
                        $('#add_group_expense_response').removeClass('alert-danger');
                        $('#add_group_expense_response').addClass('alert-success');
                        reset_expense();
                    }
                    else {
                        $('#add_group_expense_response').removeClass('alert-success');
                        $('#add_group_expense_response').addClass('alert-danger');
                    }
                    $('#add_group_expense_response').text(result.message);
                },
                failure: function () {
                    console.log('failed');
                }
            });
        }

    };


    $('.accept_reject_group_expense_target button').click(function () {
        let btn_text = $(this).css('content').slice(1,-1);
        let cuurent_button_parent = $(this).parent();

        let id = $(this).parent().parent().attr('id');

        let ides = id.split('_')
        let activity_id = ides[0];
        let group_id = ides[1];
        let bill_id = ides[2];

        console.log(activity_id, group_id, bill_id);
        console.log($(this));

        console.log(btn_text);
        console.log(btn_text === "Accept");
        
        if (btn_text == 'Accept' || btn_text == 'Reject') {
            console.log(btn_text);

            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'accept_reject_group_expense_request',
                    'status': btn_text,
                    'activity_id': activity_id,
                    'group_id': group_id,
                    'bill_id': bill_id,
                },
                type: 'post',
                success: function (result) {
                    console.log(result);

                    if (result.status == 'success') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class="mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                        $('#billDetail_' + id).remove();
                    }
                    else if (result.status == 'failed') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class="mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                        $('#billDetail_' + id).remove();
                    }
                    else {
                        $('#group_expense_request_error div p strong').text(result.message);
                        $('#group_expense_request_error').css('display', 'block');
                        $('#group_expense_request_error div p').css('color', 'red');
                    }

                },
                failure: function () {
                    console.log('failed');
                }
            });



        }


    });


    $('.accept_reject_friend_expense_target button').click(function () {
        let btn_text = $(this).css('content').slice(1,-1);

        let cuurent_button_parent = $(this).parent();

        let id = $(this).parent().parent().attr('id');

        let ides = id.split('_')
        let activity_id = ides[0];
        let group_id = ides[1];
        let bill_id = ides[2];

        console.log(btn_text);
        console.log(this);

        console.log(activity_id, group_id, bill_id);

        if (btn_text == 'Accept' || btn_text == 'Reject') {
            console.log(btn_text);

            $.ajax({
                url: url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'request_motive': 'accept_reject_friend_expense_request',
                    'status': btn_text,
                    'activity_id': activity_id,
                    'group_id': group_id,
                    'bill_id': bill_id,
                },
                type: 'post',
                success: function (result) {
                    console.log(result);

                    if (result.status == 'success') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class="mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                        $('#billDetail_' + id).remove();
                    }
                    else if (result.status == 'failed') {
                        cuurent_button_parent.empty();
                        let s = `<button type="button" class="btn btn-success" disabled>` + result.message + `<i class="mx-2 fa-solid fa-check"></i></button>`;
                        cuurent_button_parent.append(s);
                        $('#billDetail_' + id).remove();
                    }
                    else {
                        $('#friend_expense_request_error div p strong').text(result.message);
                        $('#friend_expense_request_error').css('display', 'block');
                        $('#friend_expense_request_error div p').css('color', 'red');
                    }

                },
                failure: function () {
                    console.log('failed');
                }
            });



        }


    });


});