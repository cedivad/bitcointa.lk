$(document).ready(function(){
    var editorExtensionId = "bjblmgnciihnnakeaadddcdlklhniljk";
    
     $("body").on("click", "#refresh_login_sa", function(event){
        event.preventDefault();
        chrome.runtime.sendMessage(editorExtensionId, {updateLoginStatus: true});
    });
    
    setInterval(function(){
    
        chrome.runtime.sendMessage(editorExtensionId, {getLoginStatus: true},
        function(response) {
            if(response.pluginStatus.status == 1) {
                $('#post_ext_submit').css('display', 'block');
                $('#etx_status_cont').html('');
            }
            else {
                $('#post_ext_submit').css('display', 'none');
                $('#etx_status_cont').html(response.pluginStatus.html);
            }
        });
        
    }, 500);
});