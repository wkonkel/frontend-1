with (Hasher('GoogleTalk', 'DomainApps')) {

  register_domain_app({
    id: 'google_talk',
    name: 'Google Talk',
    icon: 'images/apps/google_talk.png',
    menu_item: { text: 'Google Talk', href: '#domains/:domain/apps/google/google_talk' },

    requires: {
      dns: [
        { type: 'srv', service: 'xmpp-server', proto: 'tcp', priority: 5,  weight: 0, port: 5269, target: 'xmpp-server.l.google.com' },
        { type: 'srv', service: 'xmpp-server', proto: 'tcp', priority: 20, weight: 0, port: 5269, target: 'alt1.xmpp-server.l.google.com' },
        { type: 'srv', service: 'xmpp-server', proto: 'tcp', priority: 20, weight: 0, port: 5269, target: 'alt2.xmpp-server.l.google.com' },
        { type: 'srv', service: 'xmpp-server', proto: 'tcp', priority: 20, weight: 0, port: 5269, target: 'alt3.xmpp-server.l.google.com' },
        { type: 'srv', service: 'xmpp-server', proto: 'tcp', priority: 20, weight: 0, port: 5269, target: 'alt4.xmpp-server.l.google.com' }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p("Install this app to allow your domain users to use Google Talk to chat with other, non-Apps, messaging systems. "),
        p("You do ", em("not"), " need this app to chat to other Google Apps/Gmail users. ",
          a({ href: 'http://support.google.com/a/bin/answer.py?hl=en&answer=34143', target: '_blank' }, 'Learn more'), '.'),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', style: 'margin-top: 10px', value: 'Install Google Talk' })
        )
      );
    }
  });


  route('#domains/:domain/apps/google/google_talk', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['google_talk'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Google Talk'),

        nav_table(
          domain_app_settings_button('google_talk', domain),
          p("Google Talk has successfully been set up at ", b(domain), "."),
          p("If you haven't already, you will need to ", a({ href: 'https://www.google.com/a/cpanel/domain/new', target: '_blank'}, 'set up Google Apps for your domain'),'.')
          // p("Once you've done that, ", a({ href: "http://community.badger.com/badger/topics/configuring_google_talk_for_your_domain_on_badger_com", target: '_blank' }, "follow these steps"), " to complete the installation.")
        )
      );
    });
  });


}
