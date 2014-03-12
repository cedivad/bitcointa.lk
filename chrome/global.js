$(document).ready(function(){
    var editorExtensionId = "bjblmgnciihnnakeaadddcdlklhniljk";
    
    chrome.runtime.sendMessage(editorExtensionId, {getUnreadPmCount: true},
    function(response) {
        response.unreadPmCount = parseInt(response.unreadPmCount);
        if(response.unreadPmCount > 0) {
            $('.breadBoxTop').append('<p style="margin-bottom: 0px;" class="importantMessage">You have <a href="https://bitcointalk.org/" target="_blank">'+response.unreadPmCount+' unread private message on Bitcointalk.org</a>.</p>');
        }
    });
});