with (Hasher('Tumblr', 'DomainApps')) {

  register_domain_app({
    id: 'badger_tumblr',
    name: 'Tumblr',
    icon: 'images/apps/tumblr.png',
    menu_item: { text: 'TUMBLR', href: '#domains/:domain/tumblr' },
    requires: {
      dns: [
        { type: 'a', content: "66.6.44.4" },
        { type: 'cname', subdomain: 'www', content: "domains.tumblr.com" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p("A feature rich and free blog hosting platform offering professional and fully customizable templates, bookmarklets, photos, mobile apps, and social network."),
        p('Install this app to point your domain to your Tumblr site.'),
        show_required_dns(app, domain_obj),
        form({ style: 'text-align: center', action: curry(install_app_button_clicked, app, domain_obj) },
          input({ 'class': 'myButton', type: 'submit', value: 'Install Tumblr' })
        )
      );
    }
  });

  route('#domains/:domain/tumblr', function(domain) {
    render(
      h1({ 'class': 'header-with-right-btn' }, div({ 'class': 'long-domain-name' }, 'TUMBLR FOR ' + domain)),
      domain_app_settings_button('badger_tumblr', domain),

      p("Tumblr DNS settings have successfully been installed into Badger DNS."),
      div(
        span("Last steps before you're all set:"), br(),
        span("1. Log in to ", a({ href: "www.tumblr.com", target: '_blank' }, "Tumblr"), "."), br(),
        span("2. Click the name of your blog at the top of ", a({ href: "www.tumblr.com/dashboard" }, "the Dashboard"), ", then click ", strong("Settings"), "."), br(),
        span("3. Check the ", strong("Use a custom domain name"), "box and enter your subdomain (www." + domain + ") or domain (" + domain + ")."), br(),
        span("4. Click the ", strong("Test your domain"), " button."), br(),
        span("This should work without any errors.  When you're done, click ", strong("Save"), " at the bottom of the page."), br()
      ),
      p("Once everything is set up and saved, your Tumblr URL, -enter Tumblr URL-, will automatically redirect to " + domain + "."),
      p (span("For more information, ", a({ href: 'http://www.tumblr.com/docs/en/custom_domains', target: '_blank' }, 'click here'), "."))
    )
  });


};