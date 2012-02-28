with (Hasher('GoogleAppsVerification', 'DomainApps')) {

  register_domain_app({
    id: 'badger_google_apps_verification',
    name: 'Google Apps Verification',
    icon: 'images/apps/googleapps.png',
    menu_item: { text: 'GOOGLE APPS VERIFICATION', href: '#domains/:domain/google_verification' },
    requires: {
      dns: [
        { type: 'txt', content: /^(google-site-verification|google_site_verification):.*/, name: 'google_app_verification_code' }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p('Please copy and paste the unique Google Apps security token for your app here:'),
        show_required_dns(app, domain_obj),
        div({ id: 'error-message', 'class': 'error-message hidden' }),
        form({ style: 'text-align: center', action: curry(check_valid_input, app, domain_obj) },
          text({ name: 'google_app_verification_code', placeholder: 'google-site-verification:aa37fe774dfdb416...', style: 'width: 250px' }),
          input({ 'class': 'myButton', type: 'submit', value: 'Install Google Apps Verification' })
        )
      );
    }
  });

  define('check_valid_input', function(app, domain_obj, form_data) {
    var patt = /^(google-site-verification|google_site_verification):.*/;
    var google_app_verification_code = form_data.google_app_verification_code;
    if ((google_app_verification_code != '') && (patt.test(google_app_verification_code)) && (google_app_verification_code.length == 68)) {
      install_app_button_clicked(app, domain_obj, form_data);
    } else {
      $('#error-message').html('The token must be a 68-character string that begins with "google-site-verification:", followed by 43 additional characters.');
      $('#error-message').removeClass('hidden');
    }
  });

  route('#domains/:domain/google_verification', function(domain) {
    render(
      h1({ 'class': 'header-with-right-btn' }, div({ 'class': 'long-domain-name' }, 'GOOGLE APPS VERIFICATION FOR ' + domain)),
      domain_app_settings_button('badger_google_apps_verification', domain),

      div("The TXT record has been created. You can complete the verification ",
          a({ href: 'https://www.google.com/webmasters/tools/home', target: '_blank' }, 'here'),
          ". When you are done verifying this URL with Google, you can remove this app."
      )
    );
  });


};