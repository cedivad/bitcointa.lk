if (window.location.href.toString().indexOf("lk/threads") != -1) {

    $(document).ready(function () {

        setInterval(function () {
            self.postMessage({getLoginStatus: true});

            self.on('message', function (response) {
                if(!response.pluginStatus) return;
                if (response.pluginStatus.status == 1) {
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
}