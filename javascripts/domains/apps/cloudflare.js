with (Hasher('CloudFlare', 'DomainApps')) {

  register_domain_app({
    id: 'badger_cloudflare',
    name: 'CloudFlare',
    icon: 'images/apps/cloudflare.png',
    menu_item: { text: 'CloudFlare', href: '#domains/:domain/apps/cloudflare' },

    name_servers_valid: function() {
      var arguments = flatten_to_array(arguments);
      for (var i=0; i<arguments.length; i++) if (!arguments[i].match(/\.ns\.cloudflare\.com$/)) return false;
      return true;
    },

    is_installed: function(domain_obj) {
      return ((domain_obj.name_servers||[]).length == 2) && Hasher.domain_apps['badger_cloudflare'].name_servers_valid(domain_obj.name_servers);
    },

    install_href: '#domains/:domain/apps/cloudflare/install',
    settings_href: '#domains/:domain/apps/cloudflare/settings'
  });

  route('#domains/:domain/apps/cloudflare/install', function(domain) {
    var app = Hasher.domain_apps['badger_cloudflare'];

    with_domain_nav(domain, function(nav_table, domain_obj) {
      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: Domains.truncate_domain_name(domain) },
          { text: 'Apps', href: '#domains/'+domain },
          { text: 'CloudFlare' },
          { text: 'Install' }
        ),

        nav_table(
          form_with_loader({ id: 'cloudflare-install', 'class': 'fancy', loading_message: 'Installing Cloudflare...', action: curry(update_domain_with_cloudflare_nameservers, domain_obj) },
            div({ id: 'cloudflare-install-errors' }),

            fieldset(
              label({ 'for': 'years' }, 'Nameservers:'),
              div(input({ 'class': 'ns', placeholder: 'cody', style: 'width: 50px' }), span({ 'class': 'big-text' }, '.ns.cloudflare.com')),
              div(input({ 'class': 'ns', placeholder: 'dina', style: 'width: 50px' }), span({ 'class': 'big-text' }, '.ns.cloudflare.com'))
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
    var app = Hasher.domain_apps['badger_cloudflare'];

    with_domain_nav(domain, function(nav_table, domain_obj) {
      var name_servers = (domain_obj.name_servers||[]);

      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: domain, href: '#domains/'+domain },
          { text: 'Apps', href: '#domains/'+domain },
          { text: 'CloudFlare' }
        ),

        nav_table(
          div({ 'class': 'sidebar' },
            div({ style: "float: right; margin-top: -47px" },
              a({ 'class': 'myButton', href: app.settings_href.replace(/:domain/,domain) }, 'Settings' )
            ),

            (name_servers.length > 0) && info_message(
              h3('Current Nameservers'),
              ul(
                name_servers.map(function(ns) { return li(ns) })
              )
            )
          ),

          div({ 'class': 'has-sidebar'},
            p("CloudFlare is currently installed."),
            ul(
              li(a({ href: 'https://www.cloudflare.com/dns-settings?z=' + domain }, 'Change DNS Settings')),
              li(a({ href: 'https://www.cloudflare.com/cloudflare-settings?z=' + domain }, 'Change CloudFlare Settings'))
            ),
            p("Fore more information, visit the ", a({ href: 'https://www.cloudflare.com/help' }, "CloudFlare Help Center"), '.')
          )
        )
      );
    });
  });

  route('#domains/:domain/apps/cloudflare/settings', function(domain) {
    var app = Hasher.domain_apps['badger_cloudflare'];

    with_domain_nav(domain, function(nav_table, domain_obj) {
      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: Domains.truncate_domain_name(domain) },
          { text: 'Apps', href: '#domains/'+domain },
          { text: 'CloudFlare', href: app.menu_item.href.replace(/:domain/,domain) },
          { text: 'Settings' }
        ),

        nav_table(
          p("To uninstall the application, update your domain to no longer use Cloudflare's name servers."),

          a({ 'class': 'myButton', href: curry(DnsApp.change_name_servers_modal, domain_obj) }, "Change Name Servers")
        )
      );
    });
  });

  define('update_domain_with_cloudflare_nameservers', function(domain_obj) {
    var app = Hasher.domain_apps['badger_cloudflare'],
        name_servers = [];

    $('form#cloudflare-install input.ns').each(function() {
      if (this.value.length > 0) name_servers.push(this.value+'.ns.cloudflare.com');
    });

    if (name_servers.length <= 0) {
      hide_form_submit_loader();
      $('#cloudflare-install-errors').html(error_message('Missing name servers.'));
    } else if (!app.name_servers_valid(name_servers)) {
      hide_form_submit_loader();
      $('#cloudflare-install-errors').html(error_message('Invalid Cloudflare name servers.'));
    } else {
      Badger.updateDomain(domain_obj.name, { name_servers: name_servers }, function(response) {
        if (response.meta.status == 'ok') {
          BadgerCache.flush('domains');
          set_route(app.menu_item.href.replace(/:domain/,domain_obj.name));
        } else {
          hide_form_submit_loader();
          $('#cloudflare-install-errors').html(error_message(response));
        }
      });
    }
  });

};
