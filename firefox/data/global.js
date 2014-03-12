$(document).ready(function () {

    document.defaultView.addEventListener('message', function(event) {
        if(event.origin != 'https://bitcointa.lk') return;
        var data = JSON.parse(event.data);
        var r = {};
        r[data.action] = data.value;
        self.postMessage( r );
    }, false);
    
    $("body").on("click", "#refresh_login_sa", function (event) {
            event.preventDefault();
            self.postMessage({updateLoginStatus: true});
    });
        
    self.postMessage({getUnreadPmCount: true});
    self.on("message", function (response) {
        if (response.unreadPmCount) {
            response.unreadPmCount = parseInt(response.unreadPmCount);
            if (response.unreadPmCount > 0) {
                $('.breadBoxTop').append('<p style="margin-bottom: 0px;" class="importantMessage">You have <a href="https://bitcointalk.org/" target="_blank">' + response.unreadPmCount + ' unread private message on Bitcointalk.org</a>.</p>');
            }
        }
    });
});