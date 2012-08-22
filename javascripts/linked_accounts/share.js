with (Hasher('Share','Application')) {

  initializer(function() {
    // listen for twitter events to reward the user. not really spammable, since you can only receive 1 reward.
    twttr.ready(function(twttr) {
      twttr.events.bind('follow', function(event) {
        if (event.data.screen_name.match(/badger/i)) {
          Badger.api('/twitter/reward', 'POST', { twttr_action: 'follow' });
        }
      });

      twttr.events.bind('tweet', function() {
        Badger.api('/twitter/reward', 'POST', { twttr_action: 'tweet' });
      });
    });
  });
  
  define('icons', function(options) {
    options = options||{};
    var message = options.default_message || "I manage my domains with Badger, and love it!";
    return div(options || { style: 'margin: 15px 5px; display: inline-block;' },
      share_icon({ onclick: curry(facebook_share_modal, { default_message: message }), image_src: 'images/apps/facebook.png' }),
      share_icon({ onclick: curry(twitter_share_modal, { default_message: message }), image_src: 'images/apps/twitter.png' })
    );
  });

  define('share_icon', function(options) {
    return a({ style: 'cursor: pointer;', onclick: options.onclick }, img({ src: options.image_src, style: 'width: 30px; margin-right: 10px; border-radius: 5px;' }));
  });

  define('facebook_share_modal', function(options) {
    options = options||{};
    return show_modal(
      h2('Share to Facebook'),
      div({ id: 'errors' }),

      form({ 'class': 'fancy', style: 'margin-left: -100px;' },
        fieldset(
          label('Message:'),
          textarea({ id: 'share-message' }, (options.message || 'I manage my domains with Badger, and love it! https://www.badger.com'))
        )
      ),

      div({ style: 'text-align: right; margin-top: 20px;' },
        a({ 'class': 'myButton', onclick: share_message_to_facebook }, 'Share')
      )
    );
  });

  define('share_message_to_facebook', function() {
    var message = $('#share-message').val();

    $('#errors').empty();
    if (message.length <= 0) {
      hide_modal();
      $('#errors').html(error_message('Message cannot be blank.'));
    } else {
      FacebookSDK.after_load(function(fb) {
        fb.login(function(fb_response) {
          if (fb_response.status == 'connected') {
            Badger.api('/facebook/share_message', 'POST', { facebook_access_token: fb_response.authResponse.accessToken, message: message }, function(response) {
              hide_modal();
              if (response.meta.status != 'ok') {
                $('#errors').html(error_message('Unable to share message: ', response.data.message));
              }
            });
          } else {
            hide_modal();
          }
        }, { scope: 'email, publish_stream' });
      });
    }
  });

  define('twitter_share_modal', function(options) {
    options = options||{};
    var message = options.message || "I manage my domains with Badger, and love it!",
        url = options.url || 'https://www.badger.com';
    window.open('https://twitter.com/intent/tweet?via=Badger&url='+url+'&text='+message, '', 'width=600,height=400');
  });
};
