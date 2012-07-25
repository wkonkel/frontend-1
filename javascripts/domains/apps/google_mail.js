with (Hasher('GoogleMail', 'DomainApps')) { 

  register_domain_app({
    id: 'google_mail',
    name: 'Google Mail',
    icon: 'images/apps/gmail.png',
    menu_item: { text: 'Google Mail', href: '#domains/:domain/apps/google/gmail' },

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

  route('#domains/:domain/apps/google/gmail', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['google_mail'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Google Mail'),
        
        nav_table(
          domain_app_settings_button('google_mail', domain),
          p("Google Mail has successfully been set up at ", b("mail." + domain + ".")),
          p("If you haven't already, you will need to ", a({ href: 'https://www.google.com/a/cpanel/domain/new', target: '_blank'}, 'set up Google Apps for your domain'),'.'),
          p("Once you've done that, ", a({ href: "http://community.badger.com/badger/topics/configuring_google_mail_for_your_domain_on_badger_com", target: '_blank' }, "follow these steps"), " to complete the installation.")
        )
      );
    });
  });
  

 }
