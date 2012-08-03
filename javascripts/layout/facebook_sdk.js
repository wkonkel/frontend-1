with (Hasher('FacebookSDK','Application')) {
  FacebookSDK.facebook_sdk_loaded = false;

  // get the correct app id based on env
  define('get_facebook_app_id', function() {
    if (Badger.api_host.match(/api.badger.dev/i))
      return '175882215854335';
    else if (Badger.api_host.match(/api-qa.badger.dev/i))
      return '298128640251387';
    else
      return '252117218197771';
  });

  // the FB channel file, used to address issues with cross domain communication
  define('get_channel_file_url', function() {
    return '//frontend.dev/channel.html';
  });

  // add FB JS library
  initializer(function() {
    $(document.body).prepend(div({ id: 'fb-root', style: 'display: none' }));
    (function(d){
      var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
      if (d.getElementById(id)) {return;}
      js = d.createElement('script'); js.id = id; js.async = true;
      js.src = "//connect.facebook.net/en_US/all.js";
      ref.parentNode.insertBefore(js, ref);
    }(document));

    // once the Facebook library is loaded, initialize with app info, and listen for login/logout events.
    window.fbAsyncInit = function() {
      FacebookSDK.facebook_sdk_loaded = true;

      FB.init({
        appId      : get_facebook_app_id(), // our FB app id, specific to current environment
//        channelUrl : get_channel_file_url(), // channel file, specific to current environment
        status     : true, // check login status
        cookie     : false, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
      });
    }
  });

  // after render, reload any facebook elements (like buttons, login buttons, etc.)
  // only reloads buttons in content (not always present elements, like in header and footer)
  // NOTE: while we don't't actually use XFBML, the parse method is still in that module. Awesome.
  after_filter('parse_facebook_elements', function() {
    if (!FacebookSDK.facebook_sdk_loaded) return;
    $('.content').each(function() { FB.XFBML.parse(this) });
  });

  /*
  * Execute callback when the FB sdk has been loaded.
  *
  * timeout defaults to 3 seconds
  * */
  define('after_load', function(callback, timeout) {
    timeout = timeout || 3000;
    var interval = 100,
        elapsed_time = 0,
        timed_out = false;

    var wait_for_fb = setInterval(function() {
      timed_out = elapsed_time >= timeout;
      if (timed_out || FacebookSDK.facebook_sdk_loaded) {
        clearInterval(wait_for_fb);
        return callback((!timed_out && FacebookSDK.facebook_sdk_loaded) ? FB : null);
      }
      elapsed_time += interval;
    }, interval);
  });

  /*
   * Prompt the user to authenticate with Facebook, then make authenticated call to Facebook API to fetch
   * basic contact info, which is stored in a session variable 'facebook_info'.
   * */
  define('get_authenticated_info', function() {
    show_spinner_modal('Linking with Facebook...');

    var facebook_info = {};

    FB.login(function(response) {
      hide_modal();
      if (response.status == 'connected') {
        facebook_info.access_token = response.authResponse.accessToken;
        facebook_info.user_id = response.authResponse.userID;

        FB.api('/me', function(fb_response) {
          // filter out unnecessary values from response
          var allowed_keys = ['first_name', 'last_name', 'email', 'username'];
          fb_response = select_keys(fb_response, function(k,v) { return allowed_keys.includes(k) });
          for (k in fb_response) facebook_info[k] = fb_response[k];
          Badger.Session.set('facebook_info', facebook_info);
          set_route('#account/create');
        });
      }
    }, { scope: 'email' });
  });

  /*
 * DOM helpers
 * */

  // show a login button, if FB not connected, or the currently logged in user's info with a logout button.
  define('connect_button', function(options) {
    var facebook_div = div({ 'class': '_fb_connect_button' },
      div({ style: 'text-align: center; margin-left: -5px;' }, img({ src: 'images/spinner.gif' }))
    );

    show_spinner_modal('Connecting with Facebook...');

    FacebookSDK.after_load(function(fb) {
      var callback = function(fb_login_response) {
        if (!fb_login_response || fb_login_response.status != 'connected') {
          hide_modal();
          render({ into: facebook_div },
            div({ 'class': 'centered-button' }, a({ href: get_authenticated_info }, img({ src: 'images/linked_accounts/facebook.png', style: 'width: 100%; height: 100%' })))
          );
        } else {
          fb.api('/me', function(fb_account_info) {
            fb.api('/me/picture', function(fb_profile_image_src) {
              hide_modal();
              render({ into: facebook_div },
                div({ 'class': 'centered-button' },
                  img({ src: fb_profile_image_src }),
                  p({ style: '' }, 'Logged in as ', b(fb_account_info.name)),
                  a({ href: function() {
                      show_spinner_modal('Connecting with Facebook...');
                      fb.logout(function() {
                        fb.login(function() {
                          hide_modal();
                          set_route(get_route());
                        });
                      });
                    }
                  }, "That's not me!")
                )
              );
            });
          });
        }
      };
      fb ? fb.getLoginStatus(callback) : callback();
    });

    return div(options||{}, facebook_div);
  });

  // auto-parsed by FB library
  define('like_button', function(options) {
    return div(options || {},
      div({
        'class': 'fb-like',
        'data-href': "http://www.facebook.com/BadgerDotCom",
        'data-send': 'false',
        'data-width': '500px;',
        'data-show-faces': 'false'
      })
    );
  });
};