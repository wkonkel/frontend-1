with (Hasher('Registration','DomainApps')) {
  
  register_domain_app({
    id: 'badger_registration',
    icon: function(domain_obj) {
      return Registrar.logo_url_for_registrar(domain_obj.current_registrar);
    },
    name: function(domain_obj) {
      //return "Registration: " + domain_obj.current_registrar;
      return "Registration";
    },
    menu_item: { text: 'Registration', href: '#domains/:domain/registration', css_class: 'registration' },
    requires: {}
  });
  
  /*
    Build a nav table for a specific domain. Fetches domain info from server
    and passes it to the callback.
    
    example:
    registration_nav_table_for_domain('test.com', function(nav_table, domain_obj) {
      render(
        h1('My Page'),
        
        nav_table(
          div('code wrapped by nav'),
          div('My domain: ' + domain_obj.name)
        )
      );
    });
  */
  define('with_registration_nav_table_for_domain', function(domain, callback) {
    Badger.getDomain(domain, function(response) {
      // if trying to load this and the domain is available,
      // just redirect to the 'register this domain' page
      if ((response.data || {}).available) return set_route('#domains/' + domain);
      
      var active_url = get_route();
      var base_url = '#domains/' + domain;
      
      var permissions = (response.data || {}).permissions_for_person || {};
      var show_contacts = permissions.includes('modify_contacts'),
          show_settings = permissions.includes('renew');
      
      var nav_table = function() {
        return table({ style: 'width: 100%' }, tbody(
          tr(
            td({ style: 'width: 200px; vertical-align: top' },
              ul({ id: 'domains-left-nav' },
                li(a({ href: (base_url + '/registration'), 'class': (active_url.match(/^#domains\/.+?\/registration$/) ? 'active' : '') }, 'Registration')),
                li(a({ href: (base_url + '/whois'), 'class': (active_url.match(/^#domains\/.+?\/whois$/) ? 'active' : '') }, 'Whois')),
                
                show_contacts ? [
                  li({ style: ('display: ' + show_contacts ? '' : 'none') },
                    a({ href: (base_url + '/contacts'), 'class': (active_url.match(/^#domains\/.+?\/contacts$/) ? 'active' : '') }, 'Contacts')
                  )
                ] : [],
                
                show_settings ? [
                  li({ style: 'display: ' + show_settings ? '' : 'none' },
                    a({ href: (base_url + '/settings'), 'class': (active_url.match(/^#domains\/.+?\/settings$/) ? 'active' : '') }, 'Settings')
                  )
                ] : []
              )
            ),
            
            td({ style: 'vertical-align: top'},
              arguments
            )
          )
        ));
      }
      
      callback(nav_table, response.data);
    });
  });
  
  route('#domains/:domain/registration', function(domain) {
    with_registration_nav_table_for_domain(domain, function(nav_table, domain_obj) {
      var created_registrar_div = div(),
          previous_registrar_div = div(),
          updated_registrar_div = div();
          
      if (domain_obj.created_registrar) {
        render({ into: created_registrar_div },
          fieldset(
            label('Created By:'),
            Registrar.small_icon(domain_obj.created_registrar)
          )
        )
      }
      
      if (domain_obj.previous_registrar) {
        render({ into: previous_registrar_div },
          fieldset(
            label('Previous Registrar:'),
            Registrar.small_icon(domain_obj.previous_registrar)
          )
        )
      }
      
      if (domain_obj.updated_registrar) {
        render({ into: updated_registrar_div },
          fieldset(
            label('Last Action By:'),
            Registrar.small_icon(domain_obj.updated_registrar)
          )
        )
      }
      
      var sidebar_content = div();
      if ((domain_obj.permissions_for_person||[]).includes('modify_contacts')) {
        render({ into: sidebar_content },
          info_message(
            h3("Don't lose your domain!"),
            p("1 year can pass quickly, and your domain is important. Take action now:"),
            ul(
              li(a({ href: '#domains/' + domain + '/registration/extend' }, 'Extend the registration')),
              li(a({ href: '#domains/' + domain + '/settings' }, 'Enable auto renewal'))
            )
          )
        );
      }
      
      render(
        chained_header_with_links(
          { text: 'My Domains', href: '#domains' },
          { text: domain.toLowerCase(), href: '#domains/' + domain },
          { text: 'Registration' }
        ),
        
        nav_table(
          div({ 'class': 'sidebar'},
            sidebar_content
          ),
          
          div({ 'class': 'has-sidebar' },
            form({ 'class': 'fancy' },
              fieldset(
                label('Current Registrar:'),
                Registrar.small_icon(domain_obj.current_registrar)
              ),
              
              created_registrar_div,
              previous_registrar_div,
              // updated_registrar_div, // this might confuse people, and isn't really necessary
              
              fieldset(
                label('Expires:'),
                span(date(domain_obj.expires_on).toString('MMMM dd yyyy'))
              ),
              
              fieldset(
                label('Created:'),
                span(date(domain_obj.registered_at).toString('MMMM dd yyyy'))
              )
            )
          )
        )
      );
    });
  });
  
  route('#domains/:domain/whois', function(domain) {
    with_registration_nav_table_for_domain(domain, function(nav_table, domain_obj) {
      var show_whois_pricay_message = (domain_obj.permissions_for_person||[]).includes('modify_contacts') && !(domain_obj.whois && domain_obj.whois.privacy);
      
      render(
        chained_header_with_links(
          { text: 'My Domains', href: '#domains' },
          { text: domain.toLowerCase(), href: '#domains/' + domain },
          { text: 'Public Whois Listing' }
        ),
        
        nav_table(
          info_message({ style: 'display: ' + (show_whois_pricay_message ? '' : 'none' )  },
            "Don't want your contact information available to the public? ", a({ href: '#domains/' + domain + '/settings' }, 'Enable Whois privacy.'), " It's free!"
          ),
          
          // hard-code the width, because it will go off the page since we're using pre whitespace
          info_message({ style: 'overflow: scroll; width: 700px; border-color: #aaa; background: #eee; white-space: pre; padding: 10px' },
            (domain_obj.whois || {}).raw || 'Missing'
          )
        )
      );
    });
  });
  
  route('#domains/:domain/contacts', function(domain) {
    with_registration_nav_table_for_domain(domain, function(nav_table, domain_obj) {
      render(
        chained_header_with_links(
          { text: 'My Domains', href: '#domains' },
          { text: domain, href: '#domains/' + domain },
          { text: 'Whois Contacts' }
        ),
        
        nav_table(
          form_with_loader({ 'class': 'fancy', action: curry(update_whois, domain_obj), loading_message: 'Updating Whois Contacts...' },
            fieldset(
              label('Registrant:'),
              select({ name: 'registrant_contact_id' },
                profile_options_for_select(domain_obj.registrant_contact.id)
              )
            ),
            
            fieldset(
              label('Administrator:'),
              select({ name: 'administrator_contact_id' },
                option({ value: '' }, 'Same as Registrant'),
                profile_options_for_select(domain_obj.administrator_contact && domain_obj.administrator_contact.id)
              )
            ),
            
            fieldset(
              label('Technical:'),
              select({ name: 'technical_contact_id' },
                option({ value: '' }, 'Same as Registrant'),
                profile_options_for_select(domain_obj.technical_contact && domain_obj.technical_contact.id)
              )
            ),
            
            fieldset(
              label('Billing:'),
              select({ name: 'billing_contact_id' },
                option({ value: '' }, 'Same as Registrant'),
                profile_options_for_select(domain_obj.billing_contact && domain_obj.billing_contact.id)
              )
            ),
            
            fieldset(
              label('Privacy:'),
              span(
                (domain_obj.whois.privacy ? checkbox({ name: 'privacy', checked: 'checked' }) : checkbox({ name: 'privacy' })),
                span({ style: 'margin-left: 5px' }, 'Keep contact information private')
              )
            ),
            
            fieldset({ 'class': 'no-label' },
              submit({ value: 'Save Contacts' })
            )
          )
        )
      );
    });
  });
  
  route('#domains/:domain/settings', function(domain) {
    with_registration_nav_table_for_domain(domain, function(nav_table, domain_obj) {
      render(
        chained_header_with_links(
          { text: 'My Domains', href: '#domains' },
          { text: domain, href: '#domains/' + domain },
          { text: 'Settings' }
        ),
        
        nav_table(
          form_with_loader({ 'class': 'fancy', action: curry(update_whois, domain_obj) },
            fieldset(
              label('Auto Renew:'),
              (domain_obj.auto_renew ? checkbox({ name: 'auto_renew', checked: 'checked' }) : checkbox({ name: 'auto_renew' }))
            ),
            
            fieldset(
              label('Whois Privacy:'),
              span(
                (domain_obj.whois.privacy ? checkbox({ name: 'privacy', checked: 'checked' }) : checkbox({ name: 'privacy' }))
              )
            ),
            
            fieldset(
              submit({ value: 'Save Changes' })
            )
          )
        )
      );
    });
  });
  
  
  
  
  route('#domains/:domain/registration/extend', function(domain) {
    var target_div = div(spinner('Loading...'));
    
    render(
      chained_header_with_links(
        { href: '#domains', text: 'My Domains' },
        { href: '#domains/' + domain, text: domain.toLowerCase() },
        { href: '#domains/' + domain + '/registration', text: 'Registration' },
        { text: 'Extend' }
      ),
      
      target_div
    );
    
    Badger.getDomain(domain, function(response) {
      if (response.meta.status == 'ok') {
        render({ into: target_div },
          div({ 'class': 'sidebar' },
            info_message(
              h3('Registration Renewal'),
              p("Your domain will automatically renew on its expiration date. If you'd prefer, you can extend the registration now by using this form.")
            )
          ),
          
          div({ 'class': 'fancy has-sidebar' },
            div({ id: 'errors' }),
        
            Billing.show_num_credits_added({ delete_var: true }),
        
            form_with_loader({ 'class': 'fancy', action: curry(renew_domain, response.data), loading_message: 'Extending registration...' },
              input({ type: "hidden", value: domain, name: "domain" }),
        
              fieldset(
                label({ 'for': 'years' }, 'Years:'),
                select({ name: 'years' },
                  option({ value: 1 }, "1"),
                     option({ value: 2 }, "2"),
                     option({ value: 3 }, "3"),
                     option({ value: 4 }, "4"),
                     option({ value: 5 }, "5"),
                  option({ value: 6 }, "6"),
                  option({ value: 7 }, "7"),
                  option({ value: 8 }, "8"),
                  option({ value: 9 }, "9"),
                     option({ value: 10 }, "10")
                )
              ),
              
              fieldset(
                label('Expiration Date:'),
                span({ id: 'expiration-date', 'class': 'big-text' }, date(response.data.expires_at).toString("MMMM dd, yyyy"))
              ),
        
              fieldset({ 'class': 'no-label' },
                submit({ name: 'Submit', value: 'Renew Domain' })
              )
            )
          )
        );
        
        $('select').change(function() {
          var new_expiration_date = date(response.data.expires_at).add(parseInt(this.value)).years();
          $("#expiration-date").html(new_expiration_date.toString("MMMM dd, yyyy"));
        });
      }
    });
  });
  
  define('renew_domain', function(domain_obj, form_data) {
    if (date(domain_obj.expires_at).add(parseInt(form_data.years)).years() > date(domain_obj.expires_at).add(10).years()) {
      hide_form_submit_loader();
      $("#errors").html(error_message("Cannot extend registration by more than 10 years"));
      return;
    }
    
    Badger.renewDomain(form_data.domain, form_data.years, function(response) {
      if (response.meta.status == "ok") {
        set_route("#domains/" + form_data.domain + "/registration");
        update_credits(true);
      } else {
        if (response.data && response.data.extra) {
          
          Badger.Session.write({
            years: form_data.years,
            necessary_credits: response.data.extra.necessary_credits,
            redirect_url: get_route()
          });
          
          set_route("#account/billing/credits");
        }
        
        hide_form_submit_loader();
        $("#errors").html(error_message(response));
      }
    });
  });
  
  define('profile_options_for_select', function(selected_id) {
    if (BadgerCache.cached_contacts) {
      return BadgerCache.cached_contacts.data.map(function(profile) { 
        var opts = { value: profile.id };
        if (''+profile.id == ''+selected_id) opts['selected'] = 'selected';
        return option(opts, profile.first_name + ' ' + profile.last_name + (profile.organization ? ", " + profile.organization : '') + " (" + profile.address + (profile.address2 ? ', ' + profile.address2 : '') + ")");
      });
    } else {
      var dummy_opt = option({ disabled: 'disabled' }, 'Loading...');
  
      BadgerCache.getContacts(function(contacts) { 
        contacts.data.map(function(profile) { 
          var opts = { value: profile.id };
          if (''+profile.id == ''+selected_id) opts['selected'] = 'selected';
          var node = option(opts, profile.first_name + ' ' + profile.last_name + (profile.organization ? ", " + profile.organization : '') + " (" + profile.address + (profile.address2 ? ', ' + profile.address2 : '') + ")");
          dummy_opt.parentNode.insertBefore(node,null);
        });
        dummy_opt.parentNode.removeChild(dummy_opt);
      });
  
      return dummy_opt;
    }
  });
  
  define('update_whois', function(domain, form_data) {
    // force sends a "privacy=false"... exclusion isn't enough
    form_data['privacy'] = form_data['privacy'] ? 'true' : 'false';
    form_data['auto_renew'] = form_data['auto_renew'] ? 'true' : 'false';
    
    Badger.updateDomain(domain.name, form_data, function(response) {
      // console.log(response); --- commented out debug output CAB
      set_route(get_route());
    });
  });
  
  define('transfer_out_domain_if_allowed', function(domain_obj) {
    if ((domain_obj.permissions_for_person || []).indexOf('transfer_out') == -1) return div();
    
    if (domain_obj.transfer_out) {
      return div({ id: "transfer-out-pending", 'class': 'info-message', style: 'border-color: #aaa; background: #eee; margin-top: 42px' },
        h3("Transfer request received"),
        
        p("We have received a transfer request from ", span({ style: "font-weight: bold" }, domain_obj.transfer_out.receiving_registrar), "."),
        p("If you approve this transfer request, then your domain will be transferred out of Badger."),
        p("If you do not take action by ", span({ style: "font-weight: bold" }, date(domain_obj.transfer_out.auto_approval_date).toString('MMMM dd yyyy')), ", the transfer will automatically be approved."),
        
        div({ id:  "approve-reject-buttons", style: "text-align: right" },
          a({ id: "approve-transfer_button", 'class': 'myButton small', href: curry(transfer_out, domain_obj, "approve") }, 'Approve'),
          a({ id: "reject-transfer-button", 'class': 'myButton small red', style: "margin-left: 10px", href: curry(transfer_out, domain_obj, "reject") }, 'Reject')
        )
      );
    } else {
      return div({ id: "lock-domain", 'class': 'info-message', style: 'border-color: #aaa; background: #eee; margin-top: 30px' },
        h3('Want to transfer this domain to another registrar?'),
        domain_obj.locked ? [
          p({ style: "padding-bottom: 10px" }, "This domain is currently locked.  If you'd like to transfer this domain to another registrar, unlock this domain to receive the auth code."),
          
          div({ id: "unlock-domain-button-div", style: "text-align: right" },
            a({ 'class': 'myButton small', id: "unlock-domain-button", href: curry(lock_domain, domain_obj.name, false) }, 'Unlock Domain')
          )
        ]
        : [
          p({ style: "font-weight: bold; text-align: center; margin-bottom: 0px" }, "Domain Auth Code:"),
          
          div({ style: "text-align: center; margin-bottom: 10px" },
            input({ id: "auth-code", 'class': "fancy", style: "text-align: center", size: "17", value: domain_obj.auth_code, readonly: true })
          ),
          
          // TODO I have no idea how long it will registrars to acknowledge their poll messages
          p("When the registrar you want to transfer this domain to sends the transfer request, this page will be updated, allowing you to reject or accept the transfer."),
          p("If you do not plan on transferring this domain out of Badger, we recommend that you lock the domain again."),

          div({ id: "lock-domain-button-div", style: "text-align: right" },
            a({ 'class': 'myButton small', href: curry(set_route, get_route()) }, 'Reload Page'),
            a({ 'class': 'myButton small', style: "margin-left: 15px", href: curry(lock_domain, domain_obj.name, true) }, 'Lock Domain')
          )
        ]
      );
    }
  });
  
  define('transfer_out', function(domain_obj, operation) {
    hide_and_show_ajax_loader("#approve-reject-buttons");
    
    // perform transfer out request and reload the page
    Badger.transferOutDomain(domain_obj.name, operation, curry(set_route, get_route()));
  })
  
  define('hide_and_show_ajax_loader', function(button_id) {
    $(button_id).hide().after(
      div({ style: "text-align: right" },
        img({ src: "images/ajax-loader.gif" })
      )
    );
  });
  
  define('lock_domain', function(domain, locked) {
    hide_and_show_ajax_loader("#" + (locked ? "lock" : "unlock") + "-domain-button-div");
    
    Badger.updateDomain(domain, { locked: locked }, function(response) {
      set_route(get_route());
      if (response.meta.status == 'ok') {
        // $('#success-message').html(locked ? 'Domain has been locked' : 'Domain has been unlocked');
        // $('#success-message').removeClass('hidden');
        $('#error-message').addClass('hidden');
      } else {
        $('#error-message').html(response.data.message);
        $('#error-message').removeClass('hidden');
        $('#success-message').addClass('hidden');
      }
    });
  });
  
}
