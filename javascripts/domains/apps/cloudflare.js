with (Hasher('CloudFlare', 'DomainApps')) {

  register_domain_app({
    id: 'badger_cloudflare',
    name: 'CloudFlare',
    icon: 'images/apps/cloudflare.png',
    menu_item: { text: 'CloudFlare', href: '#domains/:domain/apps/cloudflare' },

    is_installed: function(domain_obj) {
      return (
        (domain_obj.name_servers.length == 2)
        && domain_obj.name_servers[0].match(/\.ns\.cloudflare\.com$/)
        && domain_obj.name_servers[1].match(/\.ns\.cloudflare\.com$/)
      ); 
    },
    
    install_href: '#domains/:domain/apps/cloudflare/install'
  });

  route('#domains/:domain/apps/cloudflare/install', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_cloudflare'], function(nav_table, domain_obj) {
      render(
        
        nav_table(
          h1_for_domain(domain, 'Install CloudFlare'),
          
          form({ 'class': 'fancy', action: curry(install_app_button_clicked, Hasher.domain_apps['badger_cloudflare'], domain_obj) },
            fieldset(
              label({ 'for': 'years' }, 'Nameservers:'),
              div(text({ placeholder: 'cody', style: 'width: 50px' }), span({ 'class': 'big-text' }, '.ns.cloudflare.com')),
              div(text({ placeholder: 'dina', style: 'width: 50px' }), span({ 'class': 'big-text' }, '.ns.cloudflare.com'))
            ),
            
            fieldset(
              submit({ 'class': 'myButton' }, 'Install CloudFlare')
            )
          )
        )
      );
    });
  });

  route('#domains/:domain/apps/cloudflare', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_flavorsme'], function(nav_table, domain_obj) {
      render(
        nav_table(
          h1_for_domain(domain, 'CloudFlare'),
          div({ style: "float: right; margin-top: -47px"},
            a({ 'class': 'myButton', href: '#domains/' + domain_obj.name + '/apps/cloudflare/install' }, 'Settings' )
          ),

          p("CloudFlare is currently installed."),
          ul(
            li(a({ href: 'https://www.cloudflare.com/dns-settings?z=' + domain }, 'Change DNS Settings')),
            li(a({ href: 'https://www.cloudflare.com/cloudflare-settings?z=' + domain }, 'Change CloudFlare Settings'))
          ),
          p("Fore more information, visit the ", a({ href: 'https://www.cloudflare.com/help' }, "CloudFlare Help Center"), '.')
        )
      );
    });
  });


};