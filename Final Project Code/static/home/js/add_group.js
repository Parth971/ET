console.log('In add_group');


$(document).ready(function () {

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
                    $('#create_new_group_form').trigger("reset");
                },
                failure: function () {
                    console.log('failed');
                }
            });
        }

    });
    



   




});