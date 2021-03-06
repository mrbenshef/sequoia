// Sequoia Copyright (C) 2020  Zan Naeem
// This program comes with ABSOLUTELY NO WARRANTY; for details see LICENSE.
// This is free software, and you are welcome to redistribute it
// under certain conditions; see LICENSE for details.


function addUser() {
    $("#warning").css("visibility", "hidden")
    $("#p1").attr("class", "required field")
    $("#p2").attr("class", "required field")
    $("#u").attr("class", "required field")
    var username = escape_norm($("#username").val().trim())
    var password1 = escape_norm($("#password1").val().trim())
    var password2 = escape_norm($("#password2").val().trim())
    var email = escape_norm($("#email").val().trim())
    var occupation = escape_latex($("#occupation").val().trim())
    if (username == "" || password1 == "" || password2 == "") {
        if (username == "") {
            $("#u").attr("class", "required field error")
        }
        if (password1 == "") {
            $("#p1").attr("class", "required field error")
        }
        if (password2 == "") {
            $("#p2").attr("class", "required field error")
        }
        return
    } else if (username.length < 3 || password1.length < 8 || password2.length < 8) {
        if (username.length < 3) {
            $("#u").attr("class", "required field error")
        }
        if (password1.length < 8 ) {
            $("#p1").attr("class", "required field error")
        }
        if (password2.length < 8) {
            $("#p2").attr("class", "required field error")
        }
        $("#warning_header").html("Usernames must be at least three characters long, and passwords must be at least eight characters long.")
        $("#warning").css("visibility", "visible")
        return
    } else {
        $.get("/sequoia/api/users/"+username, function(data, status) {
            if (data.status == "success") {
                $("#u").attr("class", "required field error")
                $("#warning_header").html("Username already exists.")
                $("#warning").css("visibility", "visible")
                return
            } else {
                if (password1 != password2) {
                    $("#p1").attr("class", "required field error")
                    $("#p2").attr("class", "required field error")
                    $("#warning_header").html("Passwords are not the same.")
                    $("#warning").css("visibility", "visible")
                    return
                } else {
                    $.post("/sequoia/api/user", {username : username, password : password1, 
                        email : email, occupation : occupation}, function(data, status) {
                        window.location.href = "/sequoia/login"})
                }
            }
        })
    }
    return
}