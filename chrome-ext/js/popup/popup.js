
$(document).ready(function() {
    $(".contact").click(function() {
        if ($(this).hasClass("clicked")) {
            $(this).removeClass("clicked");
            $(this).find("input").prop('checked', false);
        }
        else {
            $(this).addClass("clicked");
            $(this).find("input").prop('checked', true);
        }
    });
});
