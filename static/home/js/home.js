$(document).ready(function () {

    console.log(login_url);
    console.log(sign_up_url);
    console.log(forgot_password_url);


    $('#login_modal').on('hidden.bs.modal', function (e) {
        $(this)
            .find("input,textarea,select")
            .val('')
            .end()
            .find("input[type=checkbox], input[type=radio]")
            .prop("checked", "")
            .end();

        $('#login_user_error').css('display', 'none');
        $('#login_password_error').css('display', 'none');

    });

    $('#signup_modal').on('hidden.bs.modal', function (e) {
        $(this)
            .find("input,textarea,select")
            .val('')
            .end()
            .find("input[type=checkbox], input[type=radio]")
            .prop("checked", "")
            .end();

        $('#signup_username_error').css('display', 'none');
        $('#signup_email_error').css('display', 'none');
        $('#signup_password_error').css('display', 'none');
        $('#signup_confirm_password_error').css('display', 'none');
        $('#signup_phone_error').css('display', 'none');

    });

    $('#login_button').click(function () {

        $('#login_failed').empty();

        let username;
        let userpassword;

        let login_user_name = $('#login_user_name').val();
        let login_password = $('#login_password').val();
        let error = false;

        if (login_user_name) {

        }

        var re = /^[a-zA-Z0-9]+$/;
        if (re.test(login_user_name)) {
            $('#login_user_error').css('display', 'none');
            username = login_user_name;
        }
        else {
            $('#login_user_error').css('display', 'inline');
            error = true;
        }

        if (login_password != '' && login_password.length >= 6 && login_password.length <= 15) {
            $('#login_password_error').css('display', 'none');
            userpassword = login_password;
        }
        else {
            $('#login_password_error').css('display', 'inline');
            error = true;
        }

        if (!error) {
            console.log('submitted!');

            $.ajax({
                url: login_url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'username': username,
                    'userpassword': userpassword

                },
                type: 'post',
                success: function (result) {
                    if (result.message == 'success') {
                        location.reload();
                    }
                    else {
                        $('#login_failed').empty();
                        $('#login_failed').append(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                        Login Credentials Invalid!
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                      </div>`);
                    }

                },
                failure: function () {
                    console.log('failed');
                }
            });
        }


    });




    $('#open_signup a').click(function () {
        $("#login_modal").modal('hide');
        $("#signup_modal").modal('show');
    });

    $('#open_login a').click(function () {
        $("#login_modal").modal('show');
        $("#signup_modal").modal('hide');
    });


    $('#forgot_password a').click(function () {
        $("#login_modal").modal('hide');
        $("#forgot_password_modal").modal('show');
    });

    $('#send_password_reset_mail').click(function () {
        let email;

        let reset_password_email = $('#reset_password_email').val();
        let error = false;

        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(reset_password_email)) {
            $('#reset_password_email_error').css('display', 'none');
            email = reset_password_email;
        }
        else {
            $('#reset_password_email_error').css('display', 'inline');
            error = true;
        }

        if (!error) {
            console.log('validate');

            $.ajax({
                url: forgot_password_url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'email': email
                },
                type: 'post',
                success: function (result) {
                    console.log(result);
                    if (result.message == 'success') {
                        $('#reset_password_message').empty();
                        $('#reset_password_message').append(`<div class="alert alert-success alert-dismissible fade show" role="alert">
                        Email sent successfully.
                        <p>We've emailed you instructions for setting your password, if an account exists with the email you entered. You should receive them shortly.<br>If you don't receive an email, please make sure you've entered the address you registered with, and check your spam folder.</p>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                      </div>`);
                        $('#reset_password_form').trigger("reset");
                    }
                    if (result.message == 'no_user_found') {
                        $('#reset_password_message').empty();
                        $('#reset_password_message').append(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                        No user with this email exist!! Check email again.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                      </div>`);
                    }
                },
                failure: function () {
                    console.log('failed');
                }
            });

        }


    });



    var myInput = document.getElementById("signup_password");
    var letter = document.getElementById("letter");
    var capital = document.getElementById("capital");
    var number = document.getElementById("number");
    var length = document.getElementById("length");
    var is_password_valid = true;

    myInput.onfocus = function () {
        document.getElementById("message").style.display = "block";
        letter.classList.remove("valid");
        letter.classList.add("invalid");
        capital.classList.remove("valid");
        capital.classList.add("invalid");
        number.classList.remove("valid");
        number.classList.add("invalid");
        length.classList.remove("valid");
        length.classList.add("invalid");
    }
    myInput.onblur = function () {
        document.getElementById("message").style.display = "none";
    }

    myInput.onkeyup = function () {
        // Validate lowercase letters
        var lowerCaseLetters = /[a-z]/g;
        if (myInput.value.match(lowerCaseLetters)) {
            letter.classList.remove("invalid");
            letter.classList.add("valid");
            is_password_valid = true;
        } else {
            letter.classList.remove("valid");
            letter.classList.add("invalid");
            is_password_valid = false;
        }

        // Validate capital letters
        var upperCaseLetters = /[A-Z]/g;
        if (myInput.value.match(upperCaseLetters)) {
            capital.classList.remove("invalid");
            capital.classList.add("valid");
            is_password_valid = true;
        } else {
            capital.classList.remove("valid");
            capital.classList.add("invalid");
            is_password_valid = false;
        }

        // Validate numbers
        var numbers = /[0-9]/g;
        if (myInput.value.match(numbers)) {
            number.classList.remove("invalid");
            number.classList.add("valid");
            is_password_valid = true;
        } else {
            number.classList.remove("valid");
            number.classList.add("invalid");
            is_password_valid = false;
        }

        // Validate length
        if (myInput.value.length >= 8) {
            length.classList.remove("invalid");
            length.classList.add("valid");
            is_password_valid = true;
        } else {
            length.classList.remove("valid");
            length.classList.add("invalid");
            is_password_valid = false;
        }
    }

    $('#signup_button').click(function () {
        let username;
        let password;
        let confirmPassword;
        let email;
        let phone;
        let error = false;

        let signup_user_name = $('#signup_user_name').val();
        let signup_email = $('#signup_email').val();
        let signup_password = $('#signup_password').val();
        let signup_confirm_password = $('#signup_confirm_password').val();
        let signup_phone = $('#signup_phone').val();


        var re = /^[a-zA-Z0-9]+$/;
        if (re.test(signup_user_name)) {
            $('#signup_username_error').css('display', 'none');
            username = signup_user_name;
        }
        else {
            $('#signup_username_error').css('display', 'inline');
            error = true;
        }


        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(signup_email)) {
            $('#signup_email_error').css('display', 'none');
            email = signup_email;
        }
        else {
            $('#signup_email_error').css('display', 'inline');
            error = true;
        }


        if (signup_password != '' && is_password_valid) {
            $('#signup_password_error').css('display', 'none');
            password = signup_password;
        }
        else {
            $('#signup_password_error').css('display', 'inline');
            error = true;
        }

        if (signup_confirm_password != '' && signup_confirm_password == signup_password) {
            $('#signup_confirm_password_error').css('display', 'none');
            confirmPassword = signup_confirm_password;
        }
        else {
            $('#signup_confirm_password_error').css('display', 'inline');
            error = true;
        }


        if (signup_phone.match(/^[9876]{1}\d{9}$/)) {
            phone = signup_phone;
            $('#signup_phone_error').css('display', 'none');
        }
        else {
            $('#signup_phone_error').css('display', 'inline');
            error = true;
        }

        if (!error) {
            console.log('submitted!');

            $.ajax({
                url: sign_up_url,
                data: {
                    csrfmiddlewaretoken: crf_token,
                    state: "inactive",
                    'username': username,
                    'password': password,
                    'confirmPassword': confirmPassword,
                    'email': email,
                    'phone': phone,
                },
                type: 'post',
                success: function (result) {
                    if (result.message == 'success') {
                        $('#signup_failed').empty();
                        $('#signup_failed').append(`<div class="alert alert-success alert-dismissible fade show" role="alert">
                        Email Verification sent. Please verify email to proceed!
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                      </div>`);
                        $('#signup_form').trigger("reset");
                    }
                    else {
                        $('#signup_failed').empty();
                        $('#signup_failed').append(`<div class="alert alert-danger alert-dismissible fade show" role="alert">
                        Signup Failed!
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                      </div>`);
                    }

                },
                failure: function () {
                    console.log('failed');
                }
            });
        }



    });

});