with (Hasher('Posterous', 'DomainApps')) {

  register_domain_app({
    id: 'badger_posterous',
    name: 'Posterous',
    icon: 'images/apps/posterous.png',
    menu_item: { text: 'POSTEROUS', href: '#domains/:domain/posterous' },
    requires: {
      dns: [
        { type: 'a', content: "184.106.20.102" }
      ],
      subdomain_dns: [
        { type: 'cname', subdomain: /[a-zA-Z0-9_-]+/, content: "posterours.com", subdomain_input: "subdomain" }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p('Posterous Spaces is one of the most amazing tools available to share safely online.'),
        p('Install this app to point your domain to your Posterous Space.'),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', value: 'Install Posterous' })
        )
      );
    }
  });

  route('#domains/:domain/posterous', function(domain) {
    render(
      h1_for_domain(domain, 'Posterous'),
      domain_app_settings_button('badger_posterous', domain),

      p("Posterous DNS settings have successfully been installed into Badger DNS."),
      div(
        span("Last steps before you're all set:"), br(),
        span("1. Log in to ", a({ href: "http://posterous.com/", target: '_blank' }, "Posterous"), "."), br(),
        span("2. Click on ", strong("Manage Spaces"), "."), br(),
        span("3. Under the appropriate Space, click on the gear icon, then click on ", strong ("Space Settings"), "."), br(),
        span("4. Click ", strong("Edit"), " beside your Space."), br(),
        span("5.  Under ", strong("Setup a custom domain I already own"), ", enter your domain, " + domain + ", then click on ", strong("Save Settings"), "."), br()
      ),
      p (span("For more information, ", a({ href: 'http://posterous.uservoice.com/knowledgebase/articles/36303-setting-up-posterous-spaces-with-a-third-party-reg', target: '_blank' }, 'click here'), "."))
    );
  });


};