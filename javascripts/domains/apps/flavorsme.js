with (Hasher('FlavorsMe', 'DomainApps')) {

  register_domain_app({
    id: 'badger_flavorsme',
    name: 'Flavors.me',
    icon: 'images/apps/flavorsme.png',
    menu_item: { text: 'Flavors Me', href: '#domains/:domain/apps/flavorsme' },
    requires: {
      dns: [
        { type: 'a', content: "184.73.237.244" },
        { type: 'a', subdomain: "www", content: "184.73.237.244" }
      ],
      subdomain_dns: [
        { type: 'a', subdomain: /[a-zA-Z0-9_-]+/, content: "184.73.237.244", subdomain_input: "subdomain" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p('Flavors allows you to create a gorgeous website in minutes, bringing together social media updates, photos, videos and more into a unified web presence.'),
        p('Install this app to point your domain to your FlavorsMe account.'),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', value: 'Install Flavors Me' })
        )
      );
    }
  });

  route('#domains/:domain/apps/flavorsme', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_flavorsme'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Flavors.me'),
        
        nav_table(
          domain_app_settings_button('badger_flavorsme', domain),

          p("Flavors.me DNS settings have successfully been installed into Badger DNS."),
          div(
            span("Last steps before you're all set:"), br(),
            span("1. Log in to ", a({ href: "http://flavors.me/", target: '_blank' }, "FlavorsMe"), "."), br(),
            span("2. Hover over the ", strong("Account"), " tab, then click on ", strong("Settings"), '.'), br(),
            span("3. Under ", strong("Domains"), ", add your domain (" + domain + ") then click the ", strong("Save changes"), " button. Please note that it could take up to 72 hours for the change to fully take place."), br()
          ),
          p(span("For more information, ", a({ href: 'http://help.flavors.me/kb/settings/setting-up-your-custom-domain-name', target: '_blank' }, 'click here'), "."))
        )
      );
    });
  });


};