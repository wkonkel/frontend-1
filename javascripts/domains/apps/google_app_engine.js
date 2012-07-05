with (Hasher('GoogleAppEngine', 'DomainApps')) {

  register_domain_app({
    id: 'badger_google_app_engine',
    name: 'Google App Engine',
    icon: 'images/apps/appengine.png',
    menu_item: { text: 'Google App Engine', href: '#domains/:domain/apps/google_app_engine' },
    requires: {
      dns: [
        { type: 'cname', subdomain: 'www', content: 'ghs.google.com' }
      ],
      subdomain_dns: [
        { type: 'cname', subdomain: /[a-zA-Z0-9_-]+/, content: "ghs.google.com", subdomain_input: "subdomain" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p('Google App Engine enables you to build and host web apps on the same systems that power Google applications. App Engine offers fast development and deployment; simple administration, with no need to worry about hardware, patches or backups; and effortless scalability.'),
        p('Install this app to point your domain to your Google App.'),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', value: 'Install Google App Engine' })
        )
      );
    }
  });

  route('#domains/:domain/apps/google_app_engine', function(domain) {
    
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_google_app_engine'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Google App Engine'),
        
        nav_table(
          domain_app_settings_button('badger_google_app_engine', domain),

          div("Google App Engine DNS settings have been installed into Badger DNS. ",
            'Also check out ',
            a({ href: 'http://code.google.com/appengine/docs/domain.html', target: '_blank' }, 'Google App Engine Custom Domains'), '.'
          )
        )
      );
    });
  });
};
