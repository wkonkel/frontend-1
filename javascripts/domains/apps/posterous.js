with (Hasher('Posterous', 'DomainApps')) {

  register_domain_app({
    id: 'badger_posterous',
    name: 'Posterous',
    icon: 'images/apps/posterous.png',
    menu_item: { text: 'Posterous', href: '#domains/:domain/apps/posterous' },
    requires: {
      dns: [
        { type: 'a', content: "184.106.20.102" }
      ],
      subdomain_dns: [
        { type: 'cname', subdomain: /[a-zA-Z0-9_-]+/, content: "posterous.com", subdomain_input: "subdomain" }
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

  route('#domains/:domain/apps/posterous', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_posterous'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Posterous'),
        
        nav_table(
          domain_app_settings_button('badger_posterous', domain),

          p("Posterous DNS settings have successfully been installed into Badger DNS."),
          div(
            span("Last steps before you're all set:"), br(), br(),
            span("1. Log in to ", a({ href: "http://posterous.com/", target: '_blank' }, "Posterous"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/posterous/1.png' }), br(), br(),
            span("2. Click on ", strong("Manage Spaces"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/posterous/2.png' }), br(), br(),
            span("3. Under the appropriate Space, click on the gear icon, then click on ", strong ("Space Settings"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/posterous/3.png' }), br(), br(),
            span("4. Click ", strong("Edit"), " beside your Space."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/posterous/4.png' }), br(), br(),
            span("5.  Under ", strong("Setup a custom domain I already own"), ", click on ", strong("Setup my domain »"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/posterous/5.png' }), br(), br(),
            span("6.  Enter your domain, " + domain + ", into the box provided and then click on ", strong("Save Settings"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/posterous/6.png' }), br()
          ),
          p (span("For more information, ", a({ href: 'http://posterous.uservoice.com/knowledgebase/articles/36303-setting-up-posterous-spaces-with-a-third-party-reg', target: '_blank' }, 'click here'), "."))
        )
      );
    });
  });


}
