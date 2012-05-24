with (Hasher('GoogleMail', 'DomainApps')) { 

  register_domain_app({
    id: 'google_mail',
    name: 'Google Mail',
    icon: 'images/apps/gmail.png',
    menu_item: { text: 'GOOGLE MAIL', href: '#domains/:domain/google_apps/gmail' },

    requires: {
      dns: [
        { type: 'cname', subdomain: 'mail', content: 'ghs.google.com' },
        { type: 'txt', content: 'v=spf1 include:_spf.google.com ~all' },
        { type: 'mx', priority: 1, content: "aspmx.l.google.com" },
        { type: 'mx', priority: 5, content: "alt1.aspmx.l.google.com" },
        { type: 'mx', priority: 5, content: "alt2.aspmx.l.google.com" },
        { type: 'mx', priority: 10, content: "aspmx2.googlemail.com" },
        { type: 'mx', priority: 10, content: "aspmx3.googlemail.com" },
        { type: 'mx', priority: 10, content: "aspmx4.googlemail.com" },
        { type: 'mx', priority: 10, content: "aspmx5.googlemail.com" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p("Install this app to integrate Google Mail to your domain."),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', style: 'margin-top: 10px', value: 'Install Google Mail' })
        )
      );
    }
  });


  // set up Google Apps for your domain if you haven't already.  You can get started on that here(same link).
  // 
  // For more detailed instructions, please see <a href="https://www.badger.com/#knowledge_center/47-Properly-configuring-Google-Mail-on-your-Badger-domain">this Knowledge Center article</a>.

  route('#domains/:domain/google_apps/gmail', function(domain) {
    render(
      h1_for_domain(domain, 'Google Mail'),
      domain_app_settings_button('google_mail', domain),
      p("Before anything else, you will need to ", a({ href: 'https://www.google.com/a/cpanel/domain/new', target: '_blank'}, 'set up Google Apps for your domain'), ' if you haven\'t already.'),
      p("For more detailed instructions, please see ", a({ href: "http://community.badger.com/badger/topics/configuring_google_mail_for_your_domain_on_badger_com" }, "this Knowledge Center article"), ".")
    );
  });
  

 }
