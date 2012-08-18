with (Hasher('Share','Application')) {

//  define('message_form', function(default_message) {
//    return div(
//      div({ id: 'errors' }),
//
//      form({ 'class': 'fancy', style: 'margin-left: -130px;' },
//        fieldset(
//          label('Message:'),
//          textarea({ id: 'share-message', style: 'width: 300px;' }, default_message||'')
//        ),
//        fieldset(
//          label('Share to:'),
//          div({ style: 'display: inline-block; margin: 15px 0px;' },
//            share_icon({ onclick: share_message_on_facebook, image_src: 'images/apps/facebook.png' }),
//            share_icon({ onclick: share_message_on_twitter, image_src: 'images/apps/twitter.png' })
//          )
//        )
//      )
//    );
//  });

  define('share_icon', function(options) {
    return a({ style: 'cursor: pointer;', onclick: options.onclick }, img({ src: options.image_src, style: 'width: 30px; margin-right: 10px;' }));
  });

  define('facebook_share_modal', function() {
    return show_modal(
      h2('Share to Facebook'),
      div({ id: 'errors' }),

      form({ 'class': 'fancy', style: 'margin-left: -100px;' },
        fieldset(
          label('Message:'),
          textarea({ id: 'share-message' }, 'I manage my domains with Badger, and love it! https://www.badger.com')
        )
      ),

      div({ style: 'text-align: right; margin-top: 20px;' },
        a({ 'class': 'myButton', onclick: share_message_to_facebook }, 'Share')
      )
    );
  });

  define('share_message_to_facebook', function() {
    var message = $('#share-message').val();

    if (message.length <= 0) {
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

  define('twitter_share_modal', function() {
    window.open('https://twitter.com/share?url=https://www.badger.com&text=I manage my domains with Badger, and love it!','','width=600,height=400');
  });
};
