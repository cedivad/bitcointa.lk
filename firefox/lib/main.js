var data = require("sdk/self").data;
var pageMod = require("sdk/page-mod");
var ss = require("sdk/simple-storage");
var Request = require("sdk/request").Request;
var tmr = require('sdk/timers');

pageMod.PageMod({
    include: "*.bitcointa.lk",
    contentScriptFile: [data.url("jquery.js"),
        data.url("global.js"),
        data.url("initialize_quickreply.js"),
        data.url("import_actions.js"),
        data.url("initialize_newreply.js"),
        data.url("initialize_newthread.js")],

    onAttach: function (worker) {
        worker.on('message', function (message) {
            if (message.getLoginStatus) {
                worker.postMessage({'pluginStatus': JSON.parse(ss.storage.pluginStatus)});
            }
            if (message.updateLoginStatus) {
                auth_local();
            }
            if (message.getUnreadPmCount) {
                worker.postMessage({'unreadPmCount': JSON.parse(ss.storage.unreadPmCount)});
            }
            if (message.importDetail) {
                import_detail(message.importDetail);
            }
            if (message.addAction) {
                tmr.setTimeout(function () {
                    ss.storage.actionCount = JSON.stringify(JSON.parse(ss.storage.actionCount) + 1);
                }, 2000);

            }
            if (message.setCsrf) {
                ss.storage.csrf = JSON.stringify(message.setCsrf);
            }

        });
    }
});


if (!ss.storage.actionCount) {
    ss.storage.actionCount = JSON.stringify(0);
}
if (!ss.storage.unreadPmCount) {
    ss.storage.unreadPmCount = JSON.stringify(0);
}
if (!ss.storage.pluginStatus) {
    ss.storage.pluginStatus = JSON.stringify({'status': -1, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Loading Status... <a id="refresh_login_sa" href="#">Refresh</a></div>'});
}
var is_running = false;

tmr.setInterval(function () {
    if (JSON.parse(ss.storage.actionCount) != 0) {
        if (is_running) return;
        Request({
            url: "https://bitcointa.lk/sync-action",
            content: {'_xfToken': JSON.parse(ss.storage.csrf)},
            onComplete: function (data) {
                data = data.text;
                if(data.indexOf('Security error occurred') > 1) {
                    ss.storage.actionCount = JSON.stringify(0);
                    return;
                }
                
                data = JSON.parse(data);
                if(data == false) return;
                
                if (typeof data.action_count !== 'undefined' && data.action_count == 0) {
                    ss.storage.actionCount = JSON.stringify(0);
                    return;
                }
                
                is_running = true;
                get_auth(data);
          
          }}).post();
    }
}, 1000);


tmr.setInterval(function () {
    ss.storage.actionCount = JSON.stringify(JSON.parse(ss.storage.actionCount) + 1);
    // auth_local();
    // While useful, this check would fake the number of online hours on Bitcointalk.org. Disabling for now.
}, 300000);

tmr.setTimeout(function() {auth_local();}, 4000);

function auth_local() {
    ss.storage.pluginStatus = JSON.stringify({'status': -1, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Loading Status... <a id="refresh_login_sa" href="#">Refresh</a></div>'});
    
    Request({
    url: "https://bitcointa.lk/sync-action/info",
    onComplete: function (data) {
        data = JSON.parse(data.text);
        
        if (1 != data.firefox_version)
            ss.storage.pluginStatus = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Browser extension outdated.</div>'});

        else if (0 == data.remote_uid)
            ss.storage.pluginStatus = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Account not linked. <a id="refresh_login_sa" href="#">Refresh</a></div>'});

        else {
            Request({
              url: "https://bitcointalk.org/index.php?action=profile",
              onComplete: function (html) {
                    html = html.text;
                    check_unread_pm(html);
                    if (html.indexOf('https://bitcointalk.org/index.php?action=profile;u=' + data.remote_uid + ';sa=summary') > 0)
                        ss.storage.pluginStatus = JSON.stringify({'status': 1, 'html': ''});
                    else if (html.indexOf('Total time logged in:') > 0)
                        ss.storage.pluginStatus = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Your are logged in on Bitcointalk.org, just with the wrong profile. <a id="refresh_login_sa" href="#">Refresh</a></div>'});
                    else
                        ss.storage.pluginStatus = JSON.stringify({'status': 0, 'html': '<img id="post_ext_status" src="https://bitcointa.lk/styles/default/xenforo/permissions/deny.png" style="float: left;margin-top: 0px;margin-right: 5px;"><div style="float: left;margin-top: 1px;font-size: 11px;line-height: 12px;text-align: left;" id="post_ext_status_text">Please login on Bitcointalk.org before. <a id="refresh_login_sa" href="#">Refresh</a></div>'});
              }
            }).get();
        }
    }
    }).get();
}



function get_auth(data) {

  Request({
      url: "https://bitcointalk.org/",
      onComplete: function (html) {
        if(html.status != 200) {
            tmr.setTimeout( function() { is_running = false; }, 60000);
            return;
        }
        html = html.text;
        check_unread_pm(html);
        var res = html.match(/smf_setThemeOption\("collapse_header", mode \? 1 : 0, null, "([0-9a-zA-Z]+)"/i);
        if (res && typeof res[1] !== 'undefined' && res[1].length > 5)
            run_action(data, res[1]);
        else
            tmr.setTimeout( function() { is_running = false; }, 10000);
  }}).get();
}

function import_detail(what) {

    if (what == 'signature') {
        Request({
              url: "https://bitcointa.lk/sync-action/info",
              onComplete: function (data) {
                  data = JSON.parse(data.text);
                  Request({
                          url: 'https://bitcointalk.org/index.php?action=profile;u=' + data.remote_uid + ';sa=forumProfile',
                          onComplete: function (html) {
                          html = html.text;
                          var res = html.match(/<textarea class="editor" onkeyup="calcCharLeft\(\);" name="signature" rows="5" cols="50">([\s\S]+?)<\/textarea>/i);
                          if (res && typeof res[1] !== 'undefined' && res[1].length > 1)
                            Request({
                                  url: "https://bitcointa.lk/sync-action/import",
                                  content: {'import': what, 'raw': res[1], '_xfToken': JSON.parse(ss.storage.csrf)}
                              }).post();
                      
                  }}).get();
        }}).get();
    }
    
    if (what == 'ignore') {
        Request({
              url: "https://bitcointa.lk/sync-action/info",
              onComplete: function (data) {
                  data = JSON.parse(data.text);
                  Request({
                          url: 'https://bitcointalk.org/index.php?action=profile;u=' + data.remote_uid + ';sa=ignprefs',
                          onComplete: function (html) {
                          html = html.text;
                          var res = html.match(/<textarea name="ign_ignore_list" id="ign_ignore_list" rows="10" cols="50">([\s\S]+?)<\/textarea>/i);
                          if (res && typeof res[1] !== 'undefined' && res[1].length > 1)
                            Request({
                                  url: "https://bitcointa.lk/sync-action/import",
                                  content: {'import': what, 'raw': res[1], '_xfToken': JSON.parse(ss.storage.csrf)}
                              }).post();
                      
                  }}).get();
        }}).get();
    }
    
    if (what == 'forums') {
        Request({
              url: "https://bitcointa.lk/sync-action/info",
              onComplete: function (data) {
                  data = JSON.parse(data.text);
                  Request({
                          url: 'https://bitcointalk.org/index.php?action=profile;u=' + data.remote_uid + ';sa=notification',
                          onComplete: function (html) {
                          html = html.text;
                          var res = html.match(/<td class="catbg" width="100%">Current Board Notifications<\/td><\/tr>([\s\S]+?)<input type="hidden"/i);
                          if (res && typeof res[1] !== 'undefined' && res[1].length > 1)
                            Request({
                                  url: "https://bitcointa.lk/sync-action/import",
                                  content: {'import': what, 'raw': res[1], '_xfToken': JSON.parse(ss.storage.csrf)}
                              }).post();
                      
                  }}).get();
        }}).get();
    }
    
    if (what == 'threads') {
        Request({
              url: "https://bitcointa.lk/sync-action/info",
              onComplete: function (data) {
                  data = JSON.parse(data.text);
                  Request({
                          url: 'https://bitcointalk.org/watchlist.php',
                          onComplete: function (html) {
                          html = html.text;
                          var res = html.match(/<input type="submit" value="Remove checked" \/><br \/><table>([\s\S]+?)<input type="submit" value="Remove checked"/i);
                          if (res && typeof res[1] !== 'undefined' && res[1].length > 1)
                            Request({
                                  url: "https://bitcointa.lk/sync-action/import",
                                  content: {'import': what, 'raw': res[1], '_xfToken': JSON.parse(ss.storage.csrf)}
                              }).post();
                      
                  }}).get();
        }}).get();
    }
}

function run_action(data, csfr) {

    if (data.action == 'new_post') {
        
        var fd = {};
        
        fd['topic'] = data.thread_id;
        fd['subject'] = 'Re: ' + data.thread_title;
        fd['message'] = data.raw;
        fd['sc'] = csfr;
        fd['icon'] = 'xx';
        
        Request({
          url: "https://bitcointalk.org/index.php?action=post2;start=8690123;board=" + data.forum_id,
          content: fd,
          onComplete: function (html) {
              if(html.status != 200) {
                  report_status(data.id, 'delay');
                  return;
              }
              html = html.text;
              if (html.indexOf('An Error Has Occurred') > 1 && html.indexOf('Please try again later') > 1)
                    if (html.indexOf('The last posting from your IP was less than') > 1) {
                        var res = html.match(/less than ([0-9]+) seconds ago/i);
                        if (res && typeof res[1] !== 'undefined' && parseInt(res[1]) > 1)
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
      }).post();
    }

    if (data.action == 'new_thread') {
        
        var fd = {};
        
        fd['topic'] = '0';
        fd['subject'] = data.thread_title;
        fd['message'] = data.raw;
        fd['sc'] = csfr;
        fd['icon'] = 'xx';
        
        Request({
          url: "https://bitcointalk.org/index.php?action=post2;start=0;board=" + data.forum_id,
          content: fd,
          onComplete: function (html) {
              if(html.status != 200) {
                  report_status(data.id, 'delay');
                  return;
              }
              html = html.text;
              if (html.indexOf('An Error Has Occurred') > 1 && html.indexOf('Please try again later') > 1)
                    if (html.indexOf('The last posting from your IP was less than') > 1)
                        report_status(data.id, 'delay');
                    else
                        report_status(data.id, 'stop');
                else {
                    console.log('message posted');
                    report_status(data.id, 'ok');
                }
          }
      }).post();
    }


    if (data.action == 'post_edit') {

    var fd = {};

    fd['topic'] = data.thread_id;
    fd['subject'] = 'Re: ' + data.thread_title;
    fd['message'] = data.raw;
    fd['sc'] = csfr;
    fd['icon'] = 'xx';
        
        Request({
          url: "https://bitcointalk.org/index.php?action=post2;start=0;msg=" + data.remote_id + ";sesc=" + csfr + ";board=" + data.forum_id,
          content: fd,
          onComplete: function (html) {
              if(html.status != 200) {
                  report_status(data.id, 'delay');
                  return;
              }
              html = html.text;
              if (html.indexOf('An Error Has Occurred') > 1 && html.indexOf('Please try again later') > 1)
                    report_status(data.id, 'stop');
                else {
                    console.log('message edited');
                    report_status(data.id, 'ok');
                }
          }
      }).post();
    }

    if (data.action == 'post_delete') {
        Request({
          url: 'https://bitcointalk.org/index.php?action=deletemsg;topic=' + data.thread_id + '.0;msg=' + data.remote_id + ';sesc=' + csfr,
          onComplete: function (html) {
              if(html.status != 200) {
                  report_status(data.id, 'delay');
                  return;
              }
              report_status(data.id, 'ok');
          }
      }).get();
    }
}

function report_status(id, status) {
    Request({
          url: "https://bitcointa.lk/sync-action/report",
          content: {'id': id, 'status': status, '_xfToken': JSON.parse(ss.storage.csrf)},
          onComplete: function (data) {
              data = JSON.parse(data.text);
              if (data == false)
                tmr.setTimeout( function() { is_running = false; }, 10000);
              else
                is_running = false;
          }
      }).post();
}

function check_unread_pm(html) {
    var res = html.match(/>My Messages \[<strong>([0-9]+)<\/strong>\]</i);
    if (res && typeof res[1] !== 'undefined' && parseInt(res[1]) > 0)
        ss.storage.unreadPmCount = JSON.stringify(res[1]);
    else
        ss.storage.unreadPmCount = JSON.stringify(0);
}