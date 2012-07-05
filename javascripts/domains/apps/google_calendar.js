with (Hasher('GoogleCalendar', 'DomainApps')) {

  register_domain_app({
    id: 'google_calendar',
    name: 'Google Calendar',
    icon: 'images/apps/google_calendar.png',
    menu_item: { text: 'Google Calendar', href: '#domains/:domain/apps/google/calendar' },

    requires: {
      dns: [
        { type: 'cname', subdomain: 'calendar', content: 'ghs.google.com' }
      ]
    },

    install_screen: function(app, domain_obj) {
      return div(
        p("With Google's free online calendar, it's easy to keep track of life's important events all in one place. Install this app to integrate Google Calendar to your domain."),
        form({ action: curry(install_app_button_clicked, app, domain_obj) },
          show_required_dns(app, domain_obj),
          input({ 'class': 'myButton', type: 'submit', style: 'margin-top: 10px', value: 'Install Google Calendar' })
        )
      );
    }
  });


  route('#domains/:domain/apps/google/calendar', function(domain) {
    with_domain_nav_for_app(domain, Hasher.domain_apps['google_calendar'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'Google Calendar'),
        
        nav_table(
          domain_app_settings_button('google_calendar', domain),
          p("If you haven't already, you'll need to ", a({ href: 'https://www.google.com/a/cpanel/domain/new', target: '_blank'}, 'setup Google Apps for Your Domain'), '.'),
          p("Once you've done that, you can head on over to ", a({ href: 'http://calendar.' + domain + '/', target: '_blank' }, 'calendar.' + domain), " and get started!")
        )
      );
    });
    
  });


 }
