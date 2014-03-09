$(document).ready(function(){
    var editorExtensionId = "bjblmgnciihnnakeaadddcdlklhniljk";
    
    $('#no_ext').css('display', 'none');
    $('#yes_ext').css('display', 'block');
        
    $("body").on("click", "#refresh_login_sa", function(event){
        event.preventDefault();
        chrome.runtime.sendMessage(editorExtensionId, {updateLoginStatus: true});
    });
    
    $("body").on("click", "#signature", function(event){
        event.preventDefault();
        chrome.runtime.sendMessage(editorExtensionId, {importDetail: 'signature'});
        $('#signature').prop("disabled", true);
        $('#signature').addClass("disabled");
    });
    
    $("body").on("click", "#ignore", function(event){
        event.preventDefault();
        chrome.runtime.sendMessage(editorExtensionId, {importDetail: 'ignore'});
        $('#ignore').prop("disabled", true);
        $('#ignore').addClass("disabled");
    });
    
    $("body").on("click", "#threads", function(event){
        event.preventDefault();
        chrome.runtime.sendMessage(editorExtensionId, {importDetail: 'threads'});
        $('#threads').prop("disabled", true);
        $('#threads').addClass("disabled");
    });
    
    $("body").on("click", "#forums", function(event){
        event.preventDefault();
        chrome.runtime.sendMessage(editorExtensionId, {importDetail: 'forums'});
        $('#forums').prop("disabled", true);
        $('#forums').addClass("disabled");
    });
    
    update_status_bar();
    
    setInterval(function() {update_status_bar();}, 200);
    
    
    
});

function update_status_bar() {

var editorExtensionId = "bjblmgnciihnnakeaadddcdlklhniljk";
chrome.runtime.sendMessage(editorExtensionId, {getLoginStatus: true},
    function(response) {
        if(response.pluginStatus.status == 1) {
            $('#etx_status_div').css('display', 'none');
            $('#ext_import').css('display', 'block');
            $('#etx_status_cont').html('');
        }
        else {
            $('#etx_status_div').css('display', 'block');
            $('#ext_import').css('display', 'none');
            $('#etx_status_cont').html(response.pluginStatus.html);
        }
    });
}