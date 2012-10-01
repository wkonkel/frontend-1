with (Hasher('GoogleAppsVerification', 'DomainApps')) {

  register_domain_app({
    id: 'badger_google_apps_verification',
    name: 'Google Apps Verification',
    icon: 'images/apps/googleapps.png',
    menu_item: { text: 'Google Apps Verification', href: '#domains/:domain/apps/google_verification' },
    requires: {
      dns: [
        { type: 'txt', content: /^(google-site-verification|google_site_verification).*/, content_input: 'google_app_verification_code' }
      ]
    },
  
    install_screen: function(app, domain_obj) {
      var google_apps_verification_link = 'https://www.google.com/webmasters/verification/verification?hl=en&siteUrl=http://' + domain_obj.name + '&priorities=vdns&tid=alternate';
      return div(
        p('Use this shortcut to verify your domain for Google Apps. ',
          a({ href: 'http://community.badger.com/badger/topics/using_the_google_apps_verification_widget_on_badger_com', target: '_blank' }, 'Learn more'), '.'),
        p('Visit the ', a({ href: google_apps_verification_link }, 'Google Apps verification page'), ' and select "Other" for domain name provider.'),
        p('Copy and paste the TXT record (beginning with google-site-verification) here:'),
        
        form({ action: curry(check_valid_input, app, domain_obj) },
          show_required_dns(app, domain_obj),
          div({ id: 'app-error-message', 'class': 'error-message hidden' }),
          text({ name: 'google_app_verification_code', placeholder: 'google-site-verification=aa37fe774dfdb416...', style: 'width: 250px' }),
          input({ 'class': 'myButton', type: 'submit', value: 'Install Google Apps Verification' })
        )
      );
    }
  });

  define('check_valid_input', function(app, domain_obj, form_data) {
    var patt = /^(google-site-verification|google_site_verification).*/;
    var google_app_verification_code = form_data.google_app_verification_code;
    if ((google_app_verification_code != '') && (patt.test(google_app_verification_code)) && (google_app_verification_code.length == 68)) {
      install_app_button_clicked(app, domain_obj, form_data);
    } else {
      $('#app-error-message').html('The code you entered is invalid. Validation codes usually start with "google-site-verification".');
      $('#app-error-message').removeClass('hidden');
    }
  });

  route('#domains/:domain/apps/google_verification', function(domain) {
    load_domain(domain, function(domain_obj) {
      var found_record = domain_has_record(domain_obj, Hasher.domain_apps.badger_google_apps_verification.requires.dns[0])
      if (found_record) {
        
        with_domain_nav_for_app(domain, Hasher.domain_apps['badger_google_apps_verification'], function(nav_table, domain_obj) {
          render(
            h1_for_domain(domain, 'Google Verification'),
            
            nav_table(
              domain_app_settings_button('badger_google_apps_verification', domain),

              p("The TXT record below has been added to the DNS configuration for ", domain,":"),
              p({ style: 'text-align: center; margin: 0px 20px;' }, found_record.content),
              p("You can complete the verification ",
                a({ href: 'http://www.google.com/a/' + domain, target: '_blank' }, 'here'),
                ". When you are done verifying this URL with Google, you can remove this app."
              ),
              p("For more detailed instructions, you can read ",
                a({ href: 'http://community.badger.com/badger/topics/using_the_google_apps_verification_widget_on_badger_com', target: '_blank' }, "this Knowledge Center article"),
                '.'
              )
            )
          );
        });
        
      } else {
        with_domain_nav_for_app(domain, function(nav_table, domain_obj) {
          render(
            h1_for_domain(domain, 'Google Verification'),
            
            nav_table(
              error_message('Could not find TXT record for Google Apps Verification.')
            )
          );
        });
      }

    });

  });


};
