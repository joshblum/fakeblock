var EMAIL_ROW_SELECTOR = "tr.zA";
var EMAIL_PREVIEW_SELECTOR = "span.y2";


function decryptPreviews(visible_inbox_data) {
    var email_rows = $(EMAIL_ROW_SELECTOR);
    $.each(email_rows, function(i,e) {
        try {
            var email_data = visible_inbox_data[i];
            var email_id = email_data.email_id;
            var email_content = email_data.email_content;
            // TODO: sanitize email_content... its origin is the javascript scope of the DOM and cannot be trusted
            var email_content_just_text = getTextFromHtml(email_content);
            if (isPTEncrypted(email_content_just_text)) {
                var email_preview_div = $(e).find(EMAIL_PREVIEW_SELECTOR);
                var old_preview = email_preview_div.html();
                var pt_html_regex = getPT_HTML_REGEX();
                var first_fakeblock = pt_html_regex.exec(email_content_just_text);
                // if it starts with a fakeblock, decrypt that fakblock and overwrite the old preview
                if (first_fakeblock != null) {
                    var encryptedJson = getEncryptedJson(first_fakeblock);
                    sendMessage({
                        'action': 'decrypt',
                        'json': encryptedJson
                    }, function(response) {
                        try {
                            var decryptedText = $.parseJSON(response).res;
                            var new_preview = decryptedText.slice(0,old_preview.length);
                            new_preview = getTextFromHtml(new_preview);
                            new_preview = "&nbsp;-&nbsp;" + new_preview;
                            email_preview_div.html(new_preview);
                        }
                        catch (err) {
                            // if we fail to decrypt a preview it's really not a big deal
                        }
                        });
                }
            }
        } catch (err) {
            // we couldn't decrypt one, that's ok
        }
    });
}


function isPTEncrypted(email_content) {
    if (email_content == null) {
        return false;
    }
    var is_match = email_content.substring(0,FAKEBLOCK_OPEN_TAG.length) == FAKEBLOCK_OPEN_TAG;
    if (is_match) {
        return true;
    } else {
        return false;
    }
}
