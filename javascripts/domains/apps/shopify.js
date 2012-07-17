with (Hasher('Shopify', 'DomainApps')) {

  register_domain_app({
    id: 'badger_shopify',
    name: 'Shopify',
    icon: 'images/apps/shopify.png',
    menu_item: { text: 'Shopify', href: '#domains/:domain/apps/shopify' },
    requires: {
      dns: [
        { type: 'a', content: "204.93.213.45" },
        { type: 'cname', subdomain: 'www', content: /[a-zA-Z0-9_-]+\.myshopify\.com/, content_input: 'shopify_app_url' }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p("Shopify offers a complete ecommerce solution that allows you to create and run your own online store. List your products, customize your store's design, accept credit card orders, and ship your goods - all with a few clicks of the mouse. Shopify is easy to use and there's no software to download or maintain."),
        p('Install this app to point your domain to your shop on Shopify.'),
        form({ action: curry(check_valid_input, app, domain_obj) },
          show_required_dns(app, domain_obj),
          div({ id: 'app-error-message', 'class': 'error-message hidden' }),
          'http://',
          text({ name: 'shopify_app_url', placeholder: 'YOURSHOPNAME.myshopify.com', style: 'width: 250px' }),
          '/ ',
          input({ 'class': 'myButton', type: 'submit', value: 'Install Shopify' })
        )
      );
    }
  });

  define('check_valid_input', function(app, domain_obj, form_data) {
    var patt = /[a-zA-Z0-9_-]+\.myshopify\.com/;
    var shopify_app_url = form_data.shopify_app_url;
    if ((shopify_app_url != '') && (patt.test(shopify_app_url))) {
      install_app_button_clicked(app, domain_obj, form_data);
    } else {
      $('#app-error-message').html('Shopify URL is invalid.');
      $('#app-error-message').removeClass('hidden');
    }
  });

  route('#domains/:domain/apps/shopify', function(domain) {
    
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_shopify'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Shopify'),
        
        nav_table(
          domain_app_settings_button('badger_shopify', domain),
          p("Shopify DNS settings have successfully been installed into Badger DNS."),
          div(
            span("Last steps before you're all set:"), br(), br(),
            span("1. Log in to ", a({ href: "http://www.shopify.com/", target: '_blank' }, "Shopify"), '.'), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/Shopify/1.png' }), br(), br(),
            span("2. Click on ", strong("Preferences "), "then click on ", strong("DNS & Domains"), '.'), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/Shopify/2.png' }), br(), br(),
            span("3. Under Domain Manager, click on ", strong("Add a domain you already own"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/Shopify/3.png' }), br(), br(),
            span("4. Add", strong(" 'www." + domain + "'"), " then click ", strong("Claim this domain"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/Shopify/4.png' }), br(), br(),
            span("5. Add", strong(" '" + domain + "'"), " then click ", strong("Claim this domain"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/Shopify/5.png' }), br(), br(),
            span("6. Beside either", strong(" '" + domain + "'"), " or ", strong("'www." + domain + "'"), ", click on ", strong("make this my primary domain"), "."), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/Shopify/6.png' }), br(), br(),
            span("7. Make sure the ", strong("always redirect customers here?"), " box is checked, and you're all set!"), br(),
            img({ src: 'https://dl.dropbox.com/u/57131205/Badger/Shopify/7.png' }), br()
          ),
          p (span("For more information, ", a({ href: 'http://wiki.shopify.com/Using_Your_Own_Domains', target: '_blank' }, 'click here'), "."))
        )
      );
    });
  });


};