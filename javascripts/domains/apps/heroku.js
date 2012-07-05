with (Hasher('Heroku', 'DomainApps')) {

  register_domain_app({
    id: 'badger_heroku',
    name: 'Heroku',
    icon: 'images/apps/heroku.png',
    menu_item: { text: 'Heroku', href: '#domains/:domain/apps/heroku' },
    requires: {
      dns: [
        { type: 'a', content: "75.101.163.44" },
        { type: 'a', content: "75.101.145.87" },
        { type: 'a', content: "174.129.212.2" },
        { type: 'cname', subdomain: 'www', content: /[a-zA-Z0-9_-]+\.heroku(app)?\.com/, content_input: 'heroku_app_url' }
      ]
    },

    install_screen: function(app, domain_obj) {
      // Aspen & Bamboo Apps: Use YOURAPPNAME.heroku.com
      // Cedar Apps: Use YOURAPPNAME.herokuapp.com      ]
      return div(
        p("Heroku is a cloud application platform - a new way of building and deploying web apps."),
        p("Before installing this app, you will need to run these console commands in your project directory:"),
        
        div({ style: 'background: #3b4249; color: #f8f8f8; padding: 10px; font-family: Monaco, monospace; font-size: 11px; margin-top: 6px' }, 
          div({ style: 'color: #8DA6CE' }, "$ heroku addons:add custom_domains"),
          div("Adding custom_domains to YOURAPPNAME...done."),
          div({ style: 'color: #8DA6CE; margin-top: 5px' }, "$ heroku domains:add www." + domain_obj.name),
          div("Added www." + domain_obj.name + " as a custom domain name to YOURAPPNAME.heroku[app].com"),
          div({ style: 'color: #8DA6CE; margin-top: 5px' }, "$ heroku domains:add "+ domain_obj.name),
          div("Added " + domain_obj.name + " as a custom domain name to YOURAPPNAME.heroku[app].com")
        ),
        
        div({ style: 'margin: 25px 0 15px 0' }, "Then, copy and paste your Heroku Application URL below:"),
        div({ id: 'app-error-message', 'class': 'error-message hidden' }),
        form({ action: curry(check_valid_input, app, domain_obj) },
          show_required_dns(app, domain_obj),
          'http://',
          text({ name: 'heroku_app_url', placeholder: 'YOURAPPNAME.heroku[app].com', style: 'width: 250px' }),
          '/ ', 
          input({ 'class': 'myButton', type: 'submit', value: 'Install Heroku' })
        )
      );
    }
  });

  define('check_valid_input', function(app, domain_obj, form_data) {
    var patt = /[a-zA-Z0-9_-]+\.heroku(app)?\.com/;
    var heroku_app_url = form_data.heroku_app_url;
    if ((heroku_app_url != '') && (patt.test(heroku_app_url))) {
      install_app_button_clicked(app, domain_obj, form_data);
    } else {
      $('#app-error-message').html('Heroku Application URL is invalid.');
      $('#app-error-message').removeClass('hidden');
    }
  });
  
  route('#domains/:domain/apps/heroku', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['badger_heroku'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Heroku'),
        
        nav_table(
          domain_app_settings_button('badger_heroku', domain),

          div({ id: 'web-forwards-errors' }),

          div("Heroku DNS settings have been installed into ", a({ href: '#domains/' + domain + '/dns' }, "Badger DNS"), '.'),
          br(),
          div("Also check out ", a({ href: 'http://devcenter.heroku.com/articles/custom-domains', target: '_blank' }, 'Heroku Custom Domains'), '.')
        )
      );
    });
  });
  
   
};