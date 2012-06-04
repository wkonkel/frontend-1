with (Hasher('Registration','DomainApps')) {

  register_domain_app({
    id: 'badger_registration',
    icon: function(domain_obj) {
      return logo_url_for_registrar(domain_obj.current_registrar);
    },
    name: function(domain_obj) {
      //return "Registration: " + domain_obj.current_registrar;
      return "Registration";
    },
    menu_item: { text: 'Registration', href: '#domains/:domain/registration', css_class: 'registration' },
    requires: {}
  });

  route('#domains/:domain/registration', function(domain) {
    var whois_div = div(spinner('Loading...'));
    var button_div = div();
    
    render(
      // h1_for_domain(domain, 'Registration'),
      chained_header_with_links(
        { href: '#domains', text: 'My Domains' },
        { href: '#domains/' + domain, text: domain.toLowerCase() },
        { text: 'Registration' }
      ),
      
      button_div,
      div({ 'class': 'error-message hidden', id: 'error-message' }),
      div({ 'class': 'success-message hidden', id: 'success-message' }),
      domain_nav_table(
        domain_data_block(domain),
        whois_div
      )
    );

    Badger.getContacts(function() {
      Badger.getDomain(domain, function(response) {
        var domain_obj = response.data;
        
        render({ target: whois_div }, whois_view(domain_obj));

        render({ target: button_div },
          div({ style: "float: right; margin-top: -44px" },
            (domain_obj.badger_registration && $.inArray("renew", (domain_obj.permissions_for_person || [])) >= 0) ? [
              // a({ 'class': "myButton small", href: '#domains/' + domain + '/registration/extend' }, "Extend Registration (Renew)")
            ] : [
              a({ 'class': "myButton small", href: curry(Transfer.redirect_to_transfer_for_domain, domain) }, "Transfer to Badger")
            ]
          )
        );

      });
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
                span({ id: 'expiration-date', 'class': 'big-text' }, new Date(response.data.expires_at).toString("MMMM dd, yyyy"))
              ),
        
              fieldset({ 'class': 'no-label' },
                submit({ name: 'Submit', value: 'Renew Domain' })
              )
            )
          )
        );
        
        $('select').change(function() {
          var new_expiration_date = new Date(response.data.expires_at).add(parseInt(this.value)).years();
          $("#expiration-date").html(new_expiration_date.toString("MMMM dd, yyyy"));
        });
      }
    });
    
  });
  
  define('renew_domain', function(domain_obj, form_data) {
    if (new Date(domain_obj.expires_at).add(parseInt(form_data.years)).years() > new Date(domain_obj.expires_at).add(10).years()) {
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
		
    // BadgerCache.getAccountInfo(function(results) {
    //   var needed_credits = form_data.years
    //   var current_credits = results.data.domain_credits;
    //   
    //   if (current_credits >= needed_credits) {
    //        start_modal_spin('Renewing domain...');
    //        Badger.renewDomain(form_data.domain, form_data.years, function(response) {
    //          if (response.meta.status == "ok") {
    //            hide_modal();
    //            set_route("#domains/" + form_data.domain + "/registration");
    //            update_credits(true);
    //          } else {
    //            stop_modal_spin();
    //            $("#errors").append(div({ 'class': "error-message" }, response.data.message));
    //          }
    //        });
    //   } else {
    //     // Billing.purchase_modal(curry(renew_domain, form_data), needed_credits - current_credits);
    //     Billing.purchase_modal(curry(renew_domain_modal, form_data.domain, $.extend(form_data, { credits_added: true })), needed_credits - current_credits); // after successfully buying credits, go back to the initial renewal modal --- CAB
    //   }
    // });
	});
	
	
  
  define('logo_url_for_registrar', function(name) {
    var src;
    
    if (name && name.match(/badger/i)) src = "images/apps/badger.png";
    else if (name.match(/godaddy/i)) src = "images/apps/godaddy.png";
    else if (name.match(/enom/i)) src = "images/apps/enom.png";
    else if (name.match(/1and1/)) src = "images/apps/1and1.png";
    else src = "images/apps/badger.png"
    
    return src;
  });
  
  define('logo_for_registrar', function(name) {
    return img({ 'class': "app_store_icon", style: "margin-bottom: 0px", src: logo_url_for_registrar(name) })
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

  define('domain_data_block', function(domain) {
    var elem = div();

    Badger.getDomain(domain, function(response) {
      var domain_obj = response.data;
      render({ target: elem },
        
        table({ style: "width: 100%; border-collapse: collapse" }, tbody(
          tr(
            td({ style: 'width: 50%; vertical-align: top; padding-right: 5px' },

              div({ 'class': 'info-message', style: "width: 381px" },
        			  div({ style: "float: left; padding-right: 10px" }, logo_for_registrar(domain_obj.current_registrar) ),

        			  h3({ style: 'margin: 0 0 12px' }, 'Current Registration'),
        			  div(domain_obj.current_registrar, " until ", new Date(Date.parse(domain_obj.expires_at)).toDateString().split(' ').slice(1).join(' ')),

      			    // if this is a badger registration and the person can renew the domain, show the extend registration button
      			    // domain_obj.current_registrar.match(/badger/i) && div({ style: 'text-align: left; margin-top: 12px' }, a({ 'class': "myButton small", href: curry(Register.renew_domain_modal, domain) }, "Extend Registration")),
      			    (domain_obj.badger_registration && $.inArray("renew", (domain_obj.permissions_for_person || [])) >= 0) && div({ style: 'text-align: left; margin-top: 12px' }, a({ 'class': "myButton small", href: '#domains/' + domain + '/registration/extend' }, "Extend Registration")),

        			  div({ style: 'clear: left' })
        			)
              
            ),
            td({ style: 'width: 50%; vertical-align: top; padding-left: 5px' },
              div({ 'class': 'info-message', style: 'border-color: #aaa; background: #eee' },
                dl({ 'class': 'fancy-dl', style: 'margin: 0' },
                  dt({ style: 'width: 80px' }, 'Created:'), dd(new Date(Date.parse(domain_obj.registered_at)).toDateString()), br(),
                  dt({ style: 'width: 80px' }, 'Through:'), dd((domain_obj.created_registrar ? domain_obj.created_registrar : '')), br(),
                  dt({ style: 'width: 80px' }, 'Previously: '), dd(domain_obj.losing_registrar), br()
                  // dt('Expires:'), dd(), br(),
                  // dt('Created: '), dd(new Date(Date.parse(domain_obj.created_at)).toDateString()), br(),
                  // dt('Updated At: '), dd(new Date(Date.parse(domain_obj.updated_at)).toDateString()), br(),
                  // dt('Updated On: '), dd(new Date(Date.parse(domain_obj.updated_on)).toDateString())
                )
              )
            )
          )
        ))
        
          //         div({ 'class': 'info-message' },
          // div({ style: "float: left; padding-right: 10px" }, img({ src: logo_for_registrar(domain_obj.current_registrar) })),
          // 
          // h3({ style: 'margin: 0 0 6px' }, 'Current Registration'),
          // div(domain_obj.current_registrar),
          // div("Expires ", new Date(Date.parse(domain_obj.expires_on)).toDateString().split(' ').slice(1).join(' ')),
          // 
          //          !domain_obj.badger_dns && div({ style: 'text-align: right' }, a({ 'class': "myButton small", href: curry(Register.renew_domain_modal, domain) }, "Extend")),
          // 
          // div({ style: 'clear: left' })
          // 
          //           //          
          //           // dl({ 'class': 'fancy-dl', style: 'padding-left: 40px' },
          //           //   dt('Registrar: '), dd(), br(),
          //           //   dt('Status: '), dd(domain_obj.status), br(),
          //           //   dt('Created: '), dd(new Date(Date.parse(domain_obj.created_at)).toDateString()), br(),
          //           //   dt('Expires:'), dd(), br()
          //           //   // dt('Registered:'), dd(new Date(Date.parse(data.registered_on)).toDateString(), (data.created_registrar ? ' via '+data.created_registrar : '')), br(),
          //           //   // dt('Previous Registrar: '), dd(data.losing_registrar), br(),
          //           //   // dt('Updated At: '), dd(new Date(Date.parse(data.updated_at)).toDateString()), br(),
          //           //   // dt('Updated On: '), dd(new Date(Date.parse(data.updated_on)).toDateString())
          //           // )
          //         )
      );
    });

    return elem;
  });
  
  



  define('update_whois', function(domain, form_data) {
    hide_and_show_ajax_loader("#save-contacts-button");
    
    // force sends a "privacy=false"... exclusion isn't enough
    form_data['privacy'] = form_data['privacy'] ? 'true' : 'false';
    Badger.updateDomain(domain.name, form_data, function(response) {
      // console.log(response); --- commented out debug output CAB
      set_route(get_route());
    });
  });
  
  define('whois_view', function(domain) {
    var hide_modify_contacts_form = (!domain.badger_registration || !domain.registrant_contact || !domain.registrant_contact.id);

    return div(
      table({ style: 'width: 100% '}, tbody(
        tr(
          td({ style: 'vertical-align: top; padding-right: 20px'},
            h2('Public Whois Listing'),
            div({ 'class': 'long-domain-name', style: 'border: 1px solid #ccc; width: ' + (hide_modify_contacts_form ? '690px' : '409px') + '; overflow: auto; white-space: pre; padding: 5px; background: #f0f0f0' }, (domain.whois ? domain.whois.raw : 'Missing.'))
          ),
          td({ style: 'vertical-align: top'},
            hide_modify_contacts_form ? [] : [
              div({ 'class': "info-message", style: "border-color: #aaa; background: #eee; margin-top: 42px;" },
                h2('Change Contacts'),

                form({ action: curry(update_whois, domain) },
                  table(tbody(
                    tr(
                      td('Registrant:'),
                      td(select({ name: 'registrant_contact_id', style: 'width: 150px' },
                        profile_options_for_select(domain.registrant_contact.id)
                      ))
                    ),
                    tr(
                      td('Administrator:'),
                      td(select({ name: 'administrator_contact_id', style: 'width: 150px' },
                        option({ value: '' }, 'Same as Registrant'),
                        profile_options_for_select(domain.administrator_contact && domain.administrator_contact.id)
                      ))
                    ),
                    tr(
                      td('Billing:'),
                      td(select({ name: 'billing_contact_id', style: 'width: 150px' },
                        option({ value: '' }, 'Same as Registrant'),
                        profile_options_for_select(domain.billing_contact && domain.billing_contact.id)
                      ))
                    ),
                    tr(
                      td('Technical:'),
                      td(select({ name: 'technical_contact_id', style: 'width: 150px' },
                        option({ value: '' }, 'Same as Registrant'),
                        profile_options_for_select(domain.technical_contact && domain.technical_contact.id)
                      ))
                    )
                  )),
                  div(
                    (domain.whois.privacy ? input({ name: 'privacy', type: 'checkbox', checked: 'checked' }) : input({ name: 'privacy', type: 'checkbox' })),
                    'Keep contact information private'
                  ),

                  div({ style: "text-align: right" },
                    input({ id: "save-contacts-button", type: 'submit', 'class': 'myButton small', value: 'Save' })
                  )
                )
              )
            ],

            transfer_out_domain_if_allowed(domain) // show the transfer out UI
          )
        )
      ))
    );
  });
  
  define('reload_domain_object', function() {
    
  });
  
  define('transfer_out_domain_if_allowed', function(domain_obj) {
    if ((domain_obj.permissions_for_person || []).indexOf('transfer_out') == -1) return div();
    
    if (domain_obj.transfer_out && domain_obj.transfer_out.approve_transfer_out == 'pending_transfer_out') {
      return div({ id: "transfer-out-pending", 'class': 'info-message', style: 'border-color: #aaa; background: #eee; margin-top: 42px' },
        h3("Transfer request received"),
        
        p("We have received a transfer request from ", span({ style: "font-weight: bold" }, domain_obj.transfer_out.receiving_registrar), "."),
        p("If you approve this transfer request, then your domain will be transferred out of Badger."),
        p("If you do not take action by ", span({ style: "font-weight: bold" }, new Date(Date.parse(domain_obj.transfer_out.auto_approval_date)).toDateString()), ", the transfer will automatically be approved."),
        
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
