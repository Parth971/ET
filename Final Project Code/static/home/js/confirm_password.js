$(document).ready(function () {

    let url = window.location.href;


    console.log(url);


    var myInput = document.getElementById("new_password");
    var letter = document.getElementById("letter");
    var capital = document.getElementById("capital");
    var number = document.getElementById("number");
    var length = document.getElementById("length");
    var is_password_valid = true;

    myInput.onfocus = function () {
        document.getElementById("message").style.display = "block";
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

    $('#reset_password_button').click(function () {
        let password;
        let confirm_password;
        let error = false;

        let new_password = $('#new_password').val();
        let new_password_confirm = $('#new_password_confirm').val();

        if (new_password != '' && is_password_valid) {
            $('#reset_password_error').css('display', 'none');
            password = new_password;
        }
        else {
            $('#reset_password_error').css('display', 'inline');
            error = true;
        }

        if (new_password_confirm != '' && new_password_confirm == new_password) {
            $('#reset_confirm_password_error').css('display', 'none');
            confirm_password = new_password_confirm;
        }
        else {
            $('#reset_confirm_password_error').css('display', 'inline');
            error = true;
        }

        if (!error) {
            console.log('submitted!');
            $('#reset_password_form').submit();
        }



    });



});