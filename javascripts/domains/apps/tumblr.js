with (Hasher('Tumblr', 'DomainApps')) {

  var app = register_domain_app({
    id: 'badger_tumblr',
    name: 'Tumblr',
    icon: 'images/apps/tumblr.png',
    menu_item: { text: 'Tumblr', href: '#domains/:domain/apps/tumblr' },
    requires: {
      dns: [
        { type: 'a', content: "66.6.44.4" },
        { type: 'cname', subdomain: 'www', content: "domains.tumblr.com" }
      ],
      subdomain_dns: [
        { type: 'cname', subdomain: /[a-zA-Z0-9_-]+/, content: "domains.tumblr.com", subdomain_input: "subdomain" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p("A feature rich and free blog hosting platform offering professional and fully customizable templates, bookmarklets, photos, mobile apps, and social network."),
        p('Install this app to point your domain to your Tumblr site.'),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', value: 'Install Tumblr' })
        )
      );
    }
  });

  route('#domains/:domain/apps/tumblr', function(domain) {
    with_domain_nav_for_app(domain, app, function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Tumblr'),
        
        nav_table(
          domain_app_settings_button('badger_tumblr', domain),

          p("Tumblr DNS settings have successfully been installed into Badger DNS."),
          div(
            span("Last steps before you're all set:"), br(),
            span("1. Log in to ", a({ href: "http://www.tumblr.com", target: '_blank' }, "Tumblr"), "."), br(),
            span("2. Click the name of your blog at the top of ", a({ href: "http://www.tumblr.com/dashboard", target: '_blank' }, "the Dashboard"), ", then click ", strong("Settings"), "."), br(),
            span("3. Check the ", strong("Use a custom domain name"), " box and enter your subdomain (www." + domain + ") or domain (" + domain + ")."), br(),
            span("4. Click the ", strong("Test your domain"), " button."), br(),
            span("5. This should work without any errors.  When you're done, click ", strong("Save"), " at the bottom of the page."), br()
          ),
          p("Once everything is set up and saved, your Tumblr URL will automatically redirect to your domain."),
          p (span("For more information, ", a({ href: 'http://www.tumblr.com/docs/en/custom_domains', target: '_blank' }, 'click here'), "."))
        )
      )
    });
  });


};