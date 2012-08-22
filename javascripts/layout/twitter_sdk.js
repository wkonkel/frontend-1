with (Hasher('TwitterSDK','Application')) {
  TwitterSDK.twitter_sdk_loaded = false;

  // add Twitter JS library
  // WARNING: magical obfuscated JavaScript
  initializer(function() {
    window.twttr = (function (d,s,id) {
      var t, js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return; js=d.createElement(s); js.id=id;
      js.src="//platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs);
      return window.twttr || (t = { _e: [], ready: function(f){ t._e.push(f); TwitterSDK.twitter_sdk_loaded = true; } });
    }(document, "script", "twitter-wjs"));
  });

  // after render, reload any twitter elements
  after_filter('parse_twitter_elements', function() {
    if (TwitterSDK.twitter_sdk_loaded && twttr && twttr.widgets && twttr.widgets.load) twttr.widgets.load();
  });
  
  /*
  * DOM Helpers
  * */

  define('share_button', function(options) {
    return div(options,
      a({
        'class': 'twitter-share-button',
        'data-lang': 'en',
        href: 'https://twitter.com/share?url=https://www.badger.com&text=I love managing my domains with @Badger!'
      })
    );
  });

  define('follow_button', function(options) {
    return div(options,
      a({
        'class': 'twitter-follow-button',
        href: "https://twitter.com/Badger",
        'data-show-count': true
      })
    )
  });
};