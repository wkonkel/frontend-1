with (Hasher('GoogleDocs', 'DomainApps')) { 

  register_domain_app({
    id: 'google_docs',
    name: 'Google Docs',
    icon: 'images/apps/googledocs.png',
    menu_item: { text: 'Google Docs', href: '#domains/:domain/apps/google/docs' },

    requires: {
      dns: [
        { type: 'cname', subdomain: 'docs', content: 'ghs.google.com' }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p("Install this app to integrate Google Docs to your domain."),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', style: 'margin-top: 10px', value: 'Install Google Docs' })
        )
      );
    }
  });

  route('#domains/:domain/apps/google/docs', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['google_docs'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Google Docs'),
        
        nav_table(
          domain_app_settings_button('google_docs', domain),
          p("If you haven't already, you'll need to ", a({ href: 'https://www.google.com/a/cpanel/domain/new', target: '_blank'}, 'setup Google Apps for Your Domain'), '.'),
          p("Once you've done that, you can head on over to ", a({ href: 'http://docs.' + domain + '/', target: '_blank' }, 'docs.' + domain), " and get started!")
        )
      );
    });
    
  });
  

 }
