if (window.location.href.toString().indexOf("browser-extension") != -1) {

    $(document).ready(function () {

        $('#no_ext').css('display', 'none');
        $('#yes_ext').css('display', 'block');
        
        $("body").on("click", "#signature", function (event) {
            event.preventDefault();
            self.postMessage({importDetail: 'signature'});
            $('#signature').prop("disabled", true);
            $('#signature').addClass("disabled");
        });

        $("body").on("click", "#ignore", function (event) {
            event.preventDefault();
            self.postMessage({importDetail: 'ignore'});
            $('#ignore').prop("disabled", true);
            $('#ignore').addClass("disabled");
        });

        $("body").on("click", "#threads", function (event) {
            event.preventDefault();
            self.postMessage({importDetail: 'threads'});
            $('#threads').prop("disabled", true);
            $('#threads').addClass("disabled");
        });

        $("body").on("click", "#forums", function (event) {
            event.preventDefault();
            self.postMessage({importDetail: 'forums'});

            $('#forums').prop("disabled", true);
            $('#forums').addClass("disabled");
        });

        update_status_bar();

        setInterval(function () {
            update_status_bar();
        }, 200);


    });

    function update_status_bar() {
        self.postMessage({getLoginStatus: true});
        self.on("message", function (response) {
            if(!response.pluginStatus) return;
            if (response.pluginStatus.status == 1) {
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
}