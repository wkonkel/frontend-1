with (Hasher('Squarespace', 'DomainApps')) {

  register_domain_app({
    id: 'badger_squarespace',
    name: 'Squarespace',
    icon: 'images/apps/squarespace.png',
    menu_item: { text: 'Squarespace', href: '#domains/:domain/apps/squarespace' },
    requires: {
      dns: [
        { type: 'a', content: "65.39.205.57" },
        { type: 'cname', subdomain: 'www', content: "www.squarespace6.com" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p('Squarespace offers a fully-hosted environment for creating and maintaining a website.'),
        p('Install this app to point your domain to your Squarespace.'),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', value: 'Install Squarespace' })
        )
      );
    }
  });

  route('#domains/:domain/apps/squarespace', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_squarespace'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Squarespace'),

        nav_table(
          domain_app_settings_button('badger_squarespace', domain),

          p("Squarespace DNS settings have successfully been installed into Badger DNS."),
          div(
            span("Last steps before you're all set:"), br(), br(),
            span("1. Log in to ", a({ href: "http://www.squarespace.com/", target: '_blank' }, "Squarespace"), "."), br(),
            span("2. Click ", strong("Settings"), " (see '",
                 a({ href: "http://help.squarespace.com/customer/portal/articles/413088-mapping-a-domain-general-instructions-?", target: '_blank' },
                   "Step 3 - Set Up Domain Mapping")), "')", br(),
            span("3. Click ", strong ("Domains"), "."), br(),
            span("4. Click ", strong("Link Existing Domain"), "."), br(),
            span("5. Enter this domain name and then click ", strong("Add"), ".")
          )
        )
      );
    });
  });


}
