with (Hasher('Registration','Domains')) {
  
  route('#domains/:domain/whois', function(domain) {
    with_domain_nav(domain, function(nav_table, domain_obj) {
      var show_whois_privacy_message = (domain_obj.permissions_for_person||[]).includes('modify_contacts') && !(domain_obj.whois && domain_obj.whois.privacy);
      
      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: domain },
          { text: 'Public Whois Listing' }
        ),
        
        nav_table(
          info_message({ style: 'display: ' + (show_whois_privacy_message ? '' : 'none' )  },
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
  
  route('#domains/:domain/settings', function(domain) {
    with_domain_nav(domain, function(nav_table, domain_obj) {
      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: domain },
          { text: 'Settings' }
        ),
        
        nav_table(
          form_with_loader({ 'class': 'fancy', action: curry(update_domain, domain_obj) },
            fieldset(
              label('Registrant Contact:'),
              select({ name: 'registrant_contact_id' },
                profile_options_for_select(domain_obj.registrant_contact.id)
              )
            ),

            fieldset(
              label('Administrative Contact:'),
              select({ name: 'administrator_contact_id' },
                option({ value: '' }, 'Same as Registrant'),
                profile_options_for_select(domain_obj.administrator_contact && domain_obj.administrator_contact.id)
              )
            ),

            fieldset(
              label('Technical Contact:'),
              select({ name: 'technical_contact_id' },
                option({ value: '' }, 'Same as Registrant'),
                profile_options_for_select(domain_obj.technical_contact && domain_obj.technical_contact.id)
              )
            ),

            fieldset(
              label('Billing Contact:'),
              select({ name: 'billing_contact_id' },
                option({ value: '' }, 'Same as Registrant'),
                profile_options_for_select(domain_obj.billing_contact && domain_obj.billing_contact.id)
              )
            ),

            fieldset(
              label('Whois Privacy:'),
              span(
                (domain_obj.whois.privacy ? checkbox({ name: 'privacy', checked: 'checked' }) : checkbox({ name: 'privacy' })),
                span({ style: 'margin-left: 10px' }, "Keep contact information private")
              )
            ),
            
            fieldset(
              label('Auto Renew:'),
              span(
                (domain_obj.auto_renew ? checkbox({ name: 'auto_renew', checked: 'checked' }) : checkbox({ name: 'auto_renew' })),
                span({ style: 'margin-left: 10px' }, "Automatically renew domain on ", span({ style: 'font-weight: bold' }, date(domain_obj.expires_at).toString('MMMM dd yyyy')))
              )
            ),
            
            fieldset(
              label('Transfer Lock:'),
              span(
                (domain_obj.locked ? checkbox({ name: 'locked', checked: 'checked' }) : checkbox({ name: 'locked' })),
                span({ style: 'margin-left: 10px' }, "Disable to allow transfer of domain")
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
  
  route('#domains/:domain/transfer-out', function(domain) {
    with_domain_nav(domain, function(nav_table, domain_obj) {
      
      var transfer_content_for_status = div();
      
      var days_registered;
      if (domain_obj.registered_at) {
        days_registered = (date().getDate() - date(domain_obj.registered_at).getDate());
      }
      
      if (domain_obj.locked) {
        render({ into: transfer_content_for_status },
          p('This domain is currently locked. Before you can transfer the domain out of Badger, you need to ', a({ href: '#domains/' + domain + '/settings' }, 'unlock it.'))
        );
      } else if (days_registered && days_registered < 60) {
        render({ into: transfer_content_for_status },
          p("Unfortunately, domains cannot be transferred within 60 days of registration."),
          p("You will be able to transfer the domain on ", span({ style: 'font-weight: bold' }, date().add(60-days_registered).days().toString('MMMM dd yyyy')), '.')
        );
      } else if (domain_obj.transfer_out) {
        render({ into: transfer_content_for_status },
          p("We have received a transfer request from ", span({ style: "font-weight: bold" }, domain_obj.transfer_out.receiving_registrar), "."),
          p("If you approve this transfer request, then your domain will be transferred out of Badger."),
          p("If you do not take action by ", span({ style: "font-weight: bold" }, date(domain_obj.transfer_out.auto_approval_date).toString('MMMM dd yyyy')), ", the transfer will automatically be approved."),
          
          div(
            a({ 'class': 'myButton', href: curry(transfer_out, domain_obj, "approve") }, 'Approve'),
            a({ 'class': 'myButton red', style: "margin-left: 10px", href: curry(transfer_out, domain_obj, "reject") }, 'Reject')
          )
        );
      } else {
        render({ into: transfer_content_for_status },
          p("Provide the receiving registrar with this auth code. When the receiving registrar sends us a transfer request, this page will be updated, allowing you to reject or accept the request."),
          
          form({ 'class': 'fancy', onclick: function(e) { $('input#auth-code').select() } },
            fieldset(
              label('Domain Auth Code:'),
              input({ id: 'auth-code', style: "text-align: center", value: domain_obj.auth_code, disabled: true })
            )
          )
        );
      }
      
      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: domain },
          { text: 'Transfer Out' }
        ),
        
        nav_table(
          div({ 'class': 'sidebar' }),
          
          div({ 'class': 'fancy' },
            transfer_content_for_status
          )
        )
      );
    });
  });
  
  
  route('#domains/:domain/registration/extend', function(domain) {
    var target_div = div(spinner('Loading...'));
    
    render(
      chained_header_with_links(
        { href: '#domains', text: 'Domains' },
        { href: '#domains/' + domain, text: domain },
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
  
  define('update_domain', function(domain, form_data) {
    // force sends a "privacy=false"... exclusion isn't enough
    form_data['privacy'] = form_data['privacy'] ? 'true' : 'false';
    form_data['auto_renew'] = form_data['auto_renew'] ? 'true' : 'false';
    form_data['locked'] = form_data['locked'] ? 'true' : 'false';

    BadgerCache.flush('domains');
    
    Badger.updateDomain(domain.name, form_data, function(response) {
      set_route(get_route());
    });
  });
  
  define('transfer_out', function(domain_obj, operation) {
    // perform transfer out request and reload the page
    Badger.transferOutDomain(domain_obj.name, operation, curry(set_route, '#domains/' + domain_obj.name + '/registration'));
  })
  
}
