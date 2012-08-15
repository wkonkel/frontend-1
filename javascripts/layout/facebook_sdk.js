with (Hasher('FacebookSDK','Application')) {
  FacebookSDK.facebook_sdk_loaded = false;

  // get the correct app id based on env
  define('get_facebook_app_id', function() {
    if (Badger.api_host.match(/api.badger.dev/i))
      return '175882215854335';
    else if (Badger.api_host.match(/api-qa.badger.com/i))
      return '298128640251387';
    else
      return '252117218197771';
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
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
      });

      // on login, render info for currently logged in user, with logout button. store info in session.
      // on logout, clear session.
      // both events will reload the page.
      FB.Event.subscribe('auth.statusChange', function(fb_response) {
        if (fb_response.status == 'connected') {
          var fb_info = { access_token: fb_response.authResponse.accessToken };

          FB.api('/me', function(fb_api_response) {
            FB.api('/me/picture', function(profile_image_src) {
              // filter out unnecessary values from response
              var allowed_keys = ['first_name', 'last_name', 'name', 'email', 'username'];
              for (k in fb_api_response) if (allowed_keys.indexOf(k) >= 0) fb_info[k] = fb_api_response[k];

              // add profile image src to info hash.
              fb_info.profile_image_src = profile_image_src;

              // store data to session and reload page
              Badger.Session.write({ facebook_info: fb_info });
              set_route(get_route());
            });
          });
        } else {
          Badger.Session.remove('facebook_info');
          set_route(get_route());
        }
      });
    }
  });

  // after render, reload any facebook elements (like buttons, login buttons, etc.)
  // only reloads buttons in content (not always present elements, like in header and footer)
  // NOTE: while we don't't actually use XFBML, the parse method is still in that module. Awesome.
  define('parse_facebook_elements', function() {
    FacebookSDK.after_load(function(fb) {
      $('.content').each(function() { fb.XFBML.parse(this) });
    });
  });
  after_filter(parse_facebook_elements);

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

  /*
 * DOM helpers
 * */

  // show a login button, if FB not connected, or the currently logged in user's info with a logout button.
  define('connect_button', function(options) {
    var facebook_div = div(options||{},
      div({ style: 'text-align: center; margin-left: -5px;' }, img({ src: 'images/spinner.gif' }))
    );

    FacebookSDK.after_load(function(fb) {
      var fb_info = Badger.Session.get('facebook_info');
      if (fb_info) {
        render({ into: facebook_div },
          div({ 'class': 'centered-button' },
            img({ src: fb_info.profile_image_src }),
            p({ style: '' }, 'Logged in as ', b(fb_info.name)),
            a({ onclick: fb.logout }, "That's not me!")
          )
        );
      } else {
        render({ into: facebook_div }, login_button({ style: 'margin-top: 10px;' }));
        fb.XFBML.parse(); // parse login button
      }
    });

    return facebook_div;
  });

  define('login_button', function(options) {
    setTimeout(parse_facebook_elements, 100);
    return div(options||{},
      div({
        'class': 'fb-login-button',
        'data-show-faces': 'false',
        'data-width': '200',
        'data-max-rows': '1',
        'scope': 'email,publish_stream'
      })
    );
  });

  // auto-parsed by FB library
  define('like_button', function(options) {
    setTimeout(parse_facebook_elements, 100);
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