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

  // hide everything that requires the FB library. it is all made visible again when the library is loaded.
  after_filter(function() {
    if (FacebookSDK.facebook_sdk_loaded) return;

    $('.requires-facebook').each(function() {
      $(this).hide();
      $(this).after(
        div({ 'class': 'loader-for-requires-facebook', style: 'text-align: center; margin-left: -5px;' }, img({ src: 'images/spinner.gif' }))
      )
    });
  });

  // add FB JS library
  // WARNING: magical obfuscated JavaScript
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
        appId      : get_facebook_app_id(),
        status     : true, // check login status
        cookie     : true, // enable cookies to allow the server to access the session
        xfbml      : true  // parse XFBML
      });

      // show everything that asked to be hidden until FB was loaded, remove loading spinners
      $('.requires-facebook').each(function() { $(this).show() });
      $('.loader-for-requires-facebook').each(function() { $(this).remove() });
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
  * DOM helpers
  * */

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

  // You should use FB.login() instead of the social plugin (this).
  define('login_button', function(options) {
    return div(options,
      div({
        'class': 'fb-login-button',
        'data-show-faces': 'false',
        'data-width': '200px',
        'data-max-rows': '2',
        'registration-url': window.location.protocol + '//' + window.location.host + '#account/create'
      })
    );
  });
};