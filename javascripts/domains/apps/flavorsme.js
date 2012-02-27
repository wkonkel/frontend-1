with (Hasher('FlavorsMe', 'DomainApps')) {

  register_domain_app({
    id: 'badger_flavorsme',
    name: 'FlavorsMe',
    icon: 'images/apps/flavorsme.png',
    menu_item: { text: 'FLAVORS ME', href: '#domains/:domain/flavorsme' },
    requires: {
      dns: [
        { type: 'a', content: "184.73.237.244" },
        { type: 'a', subdomain: "www", content: "184.73.237.244" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p('Flavors allows you to create a gorgeous website in minutes, bringing together social media updates, photos, videos and more into a unified web presence. Install this app to point your domain to your FlavorsMe account.'),
        p('Install this app to point your domain to your FlavorsMe account.'),
        show_required_dns(app, domain_obj),
        form({ style: 'text-align: center', action: curry(install_app_button_clicked, app, domain_obj) },
          input({ 'class': 'myButton', type: 'submit', value: 'Install Flavors Me' })
        )
      );
    }
  });

  route('#domains/:domain/flavorsme', function(domain) {
    render(
      h1({ 'class': 'header-with-right-btn' }, div({ 'class': 'long-domain-name' }, 'FLAVORS ME FOR ' + domain)),
      domain_app_settings_button('badger_flavorsme', domain),

      p("FlavorsMe DNS settings have successfully been installed into Badger DNS."),
      div(
        span("Last steps before you're all set:"), br(),
        span("1. Log in to ", a({ href: "http://flavors.me/", target: '_blank' }, "FlavorsMe"), "."), br(),
        span("2. Hover over ", strong("the Account"), " tab, then click on ", strong("Settings"), '.'), br(),
        span("3. Under ", strong("Domains"), " add your domain, " + domain + ", then click the ", strong("Save changes"), " button. Please note that it could take up to 72 hours for the change to fully take place."), br()
      ),
      p (span("For more information, ", a({ href: 'http://help.flavors.me/kb/settings/setting-up-your-custom-domain-name', target: '_blank' }, 'click here'), "."))
    );
  });


};