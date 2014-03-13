if (localStorage.getItem('actionCount') === null)
    localStorage['actionCount'] = JSON.stringify(0);
    
if (localStorage.getItem('unreadPmCount') === null)
    localStorage['unreadPmCount'] = JSON.stringify(0);    
    
if (localStorage.getItem('pluginStatus') === null)
    localStorage['pluginStatus'] = JSON.stringify({'status': -1, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Loading Status... <a id="refresh_login_sa" href="#">Refresh</a></div>'});

auth_local();

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.addAction)
        setTimeout(function() { localStorage['actionCount'] = JSON.stringify(JSON.parse(localStorage['actionCount']) + 1); }, 2000);
    if (request.setCsrf)
        localStorage['csrf'] = JSON.stringify(request.setCsrf);
    if (request.getLoginStatus)
        sendResponse({'pluginStatus' : JSON.parse(localStorage['pluginStatus'])});
    if (request.getUnreadPmCount)
        sendResponse({'unreadPmCount' : JSON.parse(localStorage['unreadPmCount'])});
  });

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.getLoginStatus)
        sendResponse({'pluginStatus' : JSON.parse(localStorage['pluginStatus'])});
    if (request.updateLoginStatus)
        auth_local();
    if (request.getUnreadPmCount)
        sendResponse({'unreadPmCount' : JSON.parse(localStorage['unreadPmCount'])});
    if (request.importDetail)
        import_detail(request.importDetail);
  });
  
  
var is_running = false;
  
setInterval(function() {
    if(JSON.parse(localStorage['actionCount']) != 0) {
        if(is_running) return;
        $.post( "https://bitcointa.lk/sync-action", 
            {'_xfToken': JSON.parse(localStorage['csrf'])}, 
            function( data ) {
                if(data.indexOf('Security error occurred') > 1) {
                    localStorage['actionCount'] = JSON.stringify(0);
                    return;
                }
                data = JSON.parse(data);
                if(data == false) return;
                if(typeof data.action_count !== 'undefined' && data.action_count == 0) {
                    localStorage['actionCount'] = JSON.stringify(0);
                    return;
                }
                
                is_running = true;
                get_auth(data);
        });
    }
}, 1000);




setInterval(function() {
    localStorage['actionCount'] = JSON.stringify(JSON.parse(localStorage['actionCount']) + 1);
    // auth_local();
    // While useful, this check would fake the number of online hours on Bitcointalk.org. Disabling for now.
}, 300000);


function auth_local() {
    localStorage['pluginStatus'] = JSON.stringify({'status': -1, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Loading Status... <a id="refresh_login_sa" href="#">Refresh</a></div>'});
    
    $.getJSON( "https://bitcointa.lk/sync-action/info", function( data ) {
            if(1 != data.chrome_version)
                localStorage['pluginStatus'] = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Browser extension outdated.</div>'});
                
            else if(0 == data.remote_uid) 
                localStorage['pluginStatus'] = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Account not linked. <a id="refresh_login_sa" href="#">Refresh</a></div>'});
            
            else
                $.get( "https://bitcointalk.org/index.php?action=profile", function( html ) {
                    check_unread_pm(html);
                    if(html.indexOf('https://bitcointalk.org/index.php?action=profile;u='+data.remote_uid+';sa=summary') > 0)
                        localStorage['pluginStatus'] = JSON.stringify({'status': 1, 'html': ''});
                    else
                        if(html.indexOf('Total time logged in:') > 0)
                            localStorage['pluginStatus'] = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Your are logged in on Bitcointalk.org, just with the wrong profile. <a id="refresh_login_sa" href="#">Refresh</a></div>'});
                        else
                            localStorage['pluginStatus'] = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Please login on Bitcointalk.org before. <a id="refresh_login_sa" href="#">Refresh</a></div>'});
                });
            
    });
}


function get_auth(data) {
    $.get( "https://bitcointalk.org/", function( html ) {
        check_unread_pm(html);
        var res = html.match(/smf_setThemeOption\("collapse_header", mode \? 1 : 0, null, "([0-9a-zA-Z]+)"/i);
        if(res && typeof res[1] !== 'undefined' && res[1].length > 5)
            run_action(data, res[1]);
        else
            setTimeout( function() { is_running = false; }, 60000);
    }).fail(function() {
        setTimeout( function() { is_running = false; }, 10000);
    });
}

function import_detail(what) {
    
    if(what == 'signature') {
        $.getJSON( "https://bitcointa.lk/sync-action/info", function( data ) {
            $.get('https://bitcointalk.org/index.php?action=profile;u='+data.remote_uid+';sa=forumProfile', function( html ) {
                var res = html.match(/<textarea class="editor" onkeyup="calcCharLeft\(\);" name="signature" rows="5" cols="50">([\s\S]+?)<\/textarea>/i);
                if(res && typeof res[1] !== 'undefined' && res[1].length > 1)
                    $.post( "https://bitcointa.lk/sync-action/import", 
                    {'import': what, 'raw': res[1], '_xfToken': JSON.parse(localStorage['csrf'])});
            });
        });
    }
    
    if(what == 'ignore') {
        $.getJSON( "https://bitcointa.lk/sync-action/info", function( data ) {
            $.get('https://bitcointalk.org/index.php?action=profile;u='+data.remote_uid+';sa=ignprefs', function( html ) {
                var res = html.match(/<textarea name="ign_ignore_list" id="ign_ignore_list" rows="10" cols="50">([\s\S]+?)<\/textarea>/i);
                if(res && typeof res[1] !== 'undefined' && res[1].length > 1)
                    $.post( "https://bitcointa.lk/sync-action/import", 
                    {'import': what, 'raw': res[1], '_xfToken': JSON.parse(localStorage['csrf'])});
            });
        });
    }
    
    if(what == 'forums') {
        $.getJSON( "https://bitcointa.lk/sync-action/info", function( data ) {
            $.get('https://bitcointalk.org/index.php?action=profile;u='+data.remote_uid+';sa=notification', function( html ) {
                var res = html.match(/<td class="catbg" width="100%">Current Board Notifications<\/td><\/tr>([\s\S]+?)<input type="hidden"/i);
                if(res && typeof res[1] !== 'undefined' && res[1].length > 1)
                    $.post( "https://bitcointa.lk/sync-action/import", 
                    {'import': what, 'raw': res[1], '_xfToken': JSON.parse(localStorage['csrf'])});
            });
        });
    }
    
    if(what == 'threads') {
        $.getJSON( "https://bitcointa.lk/sync-action/info", function( data ) {
            $.get('https://bitcointalk.org/watchlist.php', function( html ) {
                var res = html.match(/<input type="submit" value="Remove checked" \/><br \/><table>([\s\S]+?)<input type="submit" value="Remove checked"/i);
                if(res && typeof res[1] !== 'undefined' && res[1].length > 1)
                    $.post( "https://bitcointa.lk/sync-action/import", 
                    {'import': what, 'raw': res[1], '_xfToken': JSON.parse(localStorage['csrf'])});
            });
        });
    }
}

function run_action(data, csfr) {
    
    if(data.action == 'new_post') {
        fd = new FormData();
        fd.append( 'topic', data.thread_id );
        fd.append( 'subject', 'Re: ' + data.thread_title );
        fd.append( 'message', data.raw );
        fd.append( 'sc', csfr );
        fd.append( 'icon', 'xx' );
        
        $.ajax({
            url: "https://bitcointalk.org/index.php?action=post2;start=8690123;board=" + data.forum_id,
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            error: function() { is_running = false; },
            success: function(html) {
                
                if(html.indexOf('An Error Has Occurred') > 1 && html.indexOf('Please try again later') > 1)
                    if(html.indexOf('The last posting from your IP was less than') > 1) {
                        var res = html.match(/less than ([0-9]+) seconds ago/i);
                        if(res && typeof res[1] !== 'undefined' && parseInt(res[1]) > 1)
                            report_status(data.id, 'delay:' + parseInt(res[1]));
                        else
                            report_status(data.id, 'delay');
                    }
                    else
                        report_status(data.id, 'stop');
                else {
                    console.log('message posted');
                    report_status(data.id, 'ok');
                }  
            }
        });
    }
    
    if(data.action == 'new_thread') {
        fd = new FormData();
        fd.append( 'topic', '0' );
        fd.append( 'subject', data.thread_title );
        fd.append( 'message', data.raw );
        fd.append( 'sc', csfr );
        fd.append( 'icon', 'xx' );
        
        $.ajax({
            url: "https://bitcointalk.org/index.php?action=post2;start=0;board=" + data.forum_id,
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            error: function() { is_running = false; },
            success: function(html) {
                
                if(html.indexOf('An Error Has Occurred') > 1 && html.indexOf('Please try again later') > 1)
                    if(html.indexOf('The last posting from your IP was less than') > 1)
                        report_status(data.id, 'delay');
                    else
                        report_status(data.id, 'stop');
                else {
                    console.log('message posted');
                    report_status(data.id, 'ok');
                }     
            }
        });
    }
    
    
    
    if(data.action == 'post_edit') {
        fd = new FormData();
        fd.append( 'topic', data.thread_id );
        fd.append( 'subject', 'Re: ' + data.thread_title );
        fd.append( 'message', data.raw );
        fd.append( 'sc', csfr );
        fd.append( 'icon', 'xx' );
       
        $.ajax({
            url: "https://bitcointalk.org/index.php?action=post2;start=0;msg="+data.remote_id+";sesc="+csfr+";board=" + data.forum_id,
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            error: function() { is_running = false; },
            success: function(html){
                
                if(html.indexOf('An Error Has Occurred') > 1 && html.indexOf('Please try again later') > 1)
                    report_status(data.id, 'stop');
                else {
                    console.log('message edited');
                    report_status(data.id, 'ok');
                }
                    
                    
            }
        });
    }
    
    if(data.action == 'post_delete') {
        $.get( 'https://bitcointalk.org/index.php?action=deletemsg;topic='+data.thread_id+'.0;msg='+data.remote_id+';sesc='+csfr, function( html ) {
            report_status(data.id, 'ok');
        }).fail(function() {
            is_running = false;
        });
    }
}

function report_status(id, status)
{
    $.post( "https://bitcointa.lk/sync-action/report", 
        {'id': id, 'status': status, '_xfToken': JSON.parse(localStorage['csrf'])}, 
        function( data ) {
            if(data == false)
                setTimeout( function() { is_running = false; }, 10000);
            else
                is_running = false;
    }, 'json').fail(function() {
        setTimeout( function() { is_running = false; }, 10000);
    });
}

function check_unread_pm(html) {
    var res = html.match(/>My Messages \[<strong>([0-9]+)<\/strong>\]</i);
    if(res && typeof res[1] !== 'undefined' && parseInt(res[1]) > 0)
        localStorage['unreadPmCount'] = JSON.stringify(res[1]);
    else
        localStorage['unreadPmCount'] = JSON.stringify(0);
}