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

//  // the FB channel file, used to address issues with cross domain communication
//  define('get_channel_file_url', function() {
//    if (Badger.api_host.match(/api.badger.dev/i))
//      return 'http://frontend.dev/channel.html';
//    else if (Badger.api_host.match(/api-qa.badger.dev/i))
//      return 'https://www-qa.badger.com/channel.html';
//    else
//      return 'https://www.badger.com/channel.html';
//  });

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
        cookie     : true, // enable cookies to allow the server to access the session
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
        return callback(((!timed_out && FacebookSDK.facebook_sdk_loaded) ? FB : null), {
          timed_out: timed_out
        });
      }
      elapsed_time += interval;
    }, interval);
  });

  define('get_authenticated_info', function(callback) {
    var fb_info = {
      access_token: FB.getAccessToken()
    };

    FB.api('/me', function(fb_api_response) {
      FB.api('/me/picture', function(profile_image_src) {
        // filter out unnecessary values from response
        var allowed_keys = ['first_name', 'last_name', 'name', 'email', 'username'];
        fb_api_response = select_keys(fb_api_response, function(k,v) { return allowed_keys.includes(k) });
        for (k in fb_api_response) fb_info[k] = fb_api_response[k];

        // add profile image src.
        fb_info.profile_image_src = profile_image_src;

        if (callback) callback(fb_info);
      });
    });
  });

  /*
   * Prompt the user to authenticate with Facebook, then make authenticated call to Facebook API to fetch
   * basic contact info, which is stored in a session variable 'facebook_info'.
   * */
  define('login_to_facebook_and_get_info', function(callback) {
    FB.login(function(fb_response) {
      if (fb_response.status == 'connected') {
        get_authenticated_info(function(fb_info) {
          fb_info.access_token = fb_response.authResponse.accessToken;
          fb_info.user_id = fb_response.authResponse.userID;

          // save data and execute callback
          Badger.Session.set('facebook_info', fb_info);
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

    FacebookSDK.after_load(function(fb, response) {
      if (response.timed_out) return render({ into: facebook_div }, '');

      var callback = function(fb_login_response) {
        if (!fb_login_response || fb_login_response.status != 'connected') {
          render({ into: facebook_div },
            div({ 'class': 'centered-button' }, a({ href: login_to_facebook_and_get_info }, img({ src: 'images/linked_accounts/facebook.png', style: 'width: 100%; height: 100%' })))
          );
        } else {
          get_authenticated_info(function(fb_info) {
            hide_modal();
            render({ into: facebook_div },
              div({ 'class': 'centered-button' },
                img({ src: fb_info.profile_image_src }),
                p({ style: '' }, 'Logged in as ', b(fb_info.name)),
                a({ onclick: curry(fb.logout, function() { Badger.Session.remove('facebook_info'); set_route(get_route()) }) }, "That's not me!")
              )
            );
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