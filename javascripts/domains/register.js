// - show full reg details below
// - add expiry (+ X year)

with (Hasher('Register','Application')) {
  define('full_form', function(domain) {
    var target_div = div();
    
    render({ into: target_div },
      form_with_loader({ 'class': 'fancy', action: process_full_form, loading_message: "Registering " + domain + "..." },
        div({ id: 'errors' }),

        input({ type: 'hidden', name: 'name', value: domain }),
        input({ type: 'hidden', name: 'name_servers', value: 'ns1.badger.com,ns2.badger.com'}),

        fieldset(
          label({ 'for': 'years' }, 'Duration:'),
          select({ name: 'years', id: 'years' },
            option({ value: 1 }, '1 year'),
            option({ value: 2 }, '2 years'),
            option({ value: 3 }, '3 years'),
            option({ value: 4 }, '4 years'),
            option({ value: 5 }, '5 years'),
            option({ value: 10 }, '10 years')
          )
          // span({ 'class': 'big-text' }, ' @ $10 per year')
        ),

        fieldset(
          label({ 'for': 'years' }, 'Expiration:'),
          div({ 'class': 'big-text', id: 'expiration-date' })
        ),
        
        // fieldset(
        //   label({ 'for': 'first_name-input' }, 'Also Register:'),
        //   div(similar_domain_list(domain))
        // ),

        Contact.selector_with_all_form_fields({ name: 'registrant_contact_id' }),
        
        // fieldset(
        //   label({ 'for': 'privacy' }, "Privacy:"),
        //   checkbox({ name: 'privacy', checked: 'checked' }),
        //   span({ style: 'margin-left: 15px' }, "Enable whois privacy.")
        // ),
        // 
        // fieldset(
        //   label({ 'for': 'auto_renew' }, "Auto Renew:"),
        //   checkbox({ name: 'auto_renew', checked: 'checked' }),
        //   span({ style: 'margin-left: 15px' }, "Automatically renew registration.")
        // ),        
        
        fieldset({ style: 'line-height: 25px' },
          label('Free options:'),
          div({ 'class': 'big-text' },
            checkbox({ name: 'privacy', value: 'yes', checked: 'checked' }), 'Enable whois privacy'
          ),
          div({ 'class': 'big-text' },
            checkbox({ name: 'auto_renew', value: 'yes', checked: 'checked' }), 'Auto-renew on expiration date'
          )
        ),

        fieldset({ 'class': 'no-label' },
          submit({ id: 'register-button', value: 'Register ' + Domains.truncate_domain_name(domain) })
        )
      )
    );
    
    return target_div;
    
    // // show a message after person buys credits
    // if (form_data && form_data.credits_added) {
    //   BadgerCache.getAccountInfo(function(response) {
    //     $("div#errors").html(
    //       div({ 'class': "info-message" }, "Success! You now have " + response.data.domain_credits + " domain " + (response.data.domain_credits > 1 ? "Credits" : "Credit") + ".")
    //     );
    //   });
    // }
    // 
    // $('select[name=years]').change(function(e) {
    //   var years = parseInt($('#years').val());
    //   var num_domains = 1 + $('.extensions:checked').length;
    //   var credits = num_domains * years;
    //   
    //   $('#register-button').val('Register ' + (num_domains > 1 ? (num_domains + ' domains') : domain) + ' for ' + credits + (credits == 1 ? ' Credit' : ' Credits'))
    // })
    // 
    // if (form_data) {
    //   $("select[name=years] option[value=" + form_data.years + "]").attr('selected','selected');
    //   $("select[name=registrant_contact_id] option[value=" + form_data.registrant_contact_id + "]").attr('selected','selected');
    //   
    //   $("select[name=years]").trigger('change');
    // }

  });
  
  define('similar_domain_list', function(domain) {
    var similar_domain_div = div({ id: 'similar_domain_span' },  spinner('Loading...'));

    Badger.domainSearch(domain.split('.')[0], true, function(response) {
      var similar_domains = [];//'something.com', 'something2.com'];
      for (var i=0; i < response.data.domains.length; i++) {
        if (response.data.domains[i][1] && (response.data.domains[i][0] != domain)) {
          similar_domains.push(response.data.domains[i][0]);
        }
      }

      render({ into: similar_domain_div}, 
        similar_domains.map(function(domain) {
          var sanitized_id = "similar_" + domain.replace(/[^a-z0-9]/,'_');
          return div({ style: 'line-height: 22px;' },
            checkbox({ name: "additional_domains[]", value: domain, id: sanitized_id }),
            label({ 'class': 'normal right-margin', 'for': sanitized_id }, domain)
          );
        })
      );
    });

    return similar_domain_div;
  });

  define('show', function(domain, available_extensions) {
    if (!available_extensions) available_extensions = [];
    if (!Badger.getAccessToken()) {
      Signup.require_user_modal(curry(Register.show, domain, available_extensions));
      return;
    }

    BadgerCache.getContacts(function(results) {
      // ensure they have at least one whois contact
      if (results.data.length == 0) {
        Whois.edit_whois_modal(null, curry(Register.show, domain, available_extensions));
      } else {
        // buy_domain_modal(domain, available_extensions);
        set_route('#domains/' + domain);
      }
    });
  });

  define('process_full_form', function(form_data, callback) {
    $('#errors').empty();
    
    form_data.privacy = $(':checked[name=privacy]').length > 0 ? true : false;
    form_data.auto_renew = $(':checked[name=auto_renew]').length > 0 ? true : false;
    
    Contact.create_contact_if_necessary_form_data({
      field_name: 'registrant_contact_id',
      form_data: form_data,
      message_area: $('#errors').first(),
      
      callback: curry(Badger.registerDomain, form_data, function(response) {
        if (response.meta.status == 'created') {
          update_credits(true);
          BadgerCache.flush('domains');
          BadgerCache.getDomains(update_my_domains_count);
          
          // reload the user nav, show rewards if necessary
          reload_account_navs();
          
          // cleanup session variables
          Badger.Session.remove('credits_added', 'years');
          
          set_route('#domains/' + form_data.name);
          
          // Share.show_share_registration_modal(form_data.name);
        } else {
          // TODO: wire in credit screen if not enough
          $('#errors').html(error_message(response));
          
          if (response.data && response.data.extra) {
            
            Badger.Session.write({
              years: form_data.years,
              necessary_credits: response.data.extra.necessary_credits,
              redirect_url: get_route()
            });
            
            set_route("#account/billing/credits");
          }
        }
        
        hide_form_submit_loader();
        
        // if (response.meta.status == 'created') {
        //   console.log("")
        //   start_modal_spin('Configuring ' + domain + '...');
        //   update_credits(true);
        //       
        //   load_domain(response.data.name, function(domain_object) {
        //     // this now happens server side
        //     // DomainApps.install_app_on_domain(Hasher.domain_apps["badger_web_forward"], domain_object);
        //     BadgerCache.flush('domains');
        //     BadgerCache.getDomains(function() { 
        //       update_my_domains_count(); 
        //       
        //       set_route('#domains/' + domain);
        //       // hide_modal();
        //        // Share.show_share_registration_modal(domain);
        //     });
        //   });
        // } else {
        //   // if the registration failed, we actually need to re-render the registration modal because if the user
        //   // had to buy credits in the previous step, the underlying modal is the purcahse modal and not the
        //   // registration modal.
        //   buy_domain_modal(domain, available_extensions);
        //   $('#errors').empty().append(error_message(response));
        // }
      })
    });
    
    
    // var checked_extensions = $.grep(available_extensions, function(ext) {
    //   return form_data["extension_" + ext[0].split('.')[1]] != null;
    // })
    // checked_extensions = [domain].concat(checked_extensions.map(function(ext) { return ext[0]; }));
    // 
    // $('#errors').empty();
    // start_modal_spin('Checking available Credits...');
    // 
    // BadgerCache.getAccountInfo(function(results) {
    //   var needed_credits = checked_extensions.length * form_data.years;
    //   var current_credits = results.data.domain_credits;
    //   
    //   if (current_credits >= needed_credits) {
    //     if (checked_extensions.length > 1) {
    //       form_data.new_domains = checked_extensions;
    //       Cart.register_or_transfer_all_domains(form_data);
    //     } else {
    //       register_domain(domain, available_extensions, form_data);
    //     }
    //   } else {
    //     // Billing.purchase_modal(curry(buy_domain, domain, available_extensions, form_data), needed_credits - current_credits);
    //     Billing.purchase_modal(curry(buy_domain_modal, domain, available_extensions, $.extend(form_data, { credits_added: true })), needed_credits - current_credits); // after successfully buying credits, go back to the initial register modal --- CAB
    //   }
    // });
  });

  
  // NOTE: this function has a few race conditions...
  //  - "install_app_on_domain" isn't chained so the getDomains() could finish first
  //    and redirect you to the domain page before the dns entries are installed.
  // define('register_domain', function(domain, available_extensions, form_data) {
  //   start_modal_spin('Registering ' + domain + '...');
  //   Badger.registerDomain(form_data, function(response) {
  //     if (response.meta.status == 'created') {
  //       start_modal_spin('Configuring ' + domain + '...');
  //       update_credits(true);
  // 
  //       load_domain(response.data.name, function(domain_object) {
  //         // this now happens server side
  //         // DomainApps.install_app_on_domain(Hasher.domain_apps["badger_web_forward"], domain_object);
  //         BadgerCache.flush('domains');
  //         BadgerCache.getDomains(function() { 
  //           update_my_domains_count(); 
  //           
  //           set_route('#domains/' + domain);
  //           // hide_modal();
  //            // Share.show_share_registration_modal(domain);
  //         });
  //       });
  //     } else {
  //       // if the registration failed, we actually need to re-render the registration modal because if the user
  //       // had to buy credits in the previous step, the underlying modal is the purcahse modal and not the
  //       // registration modal.
  //       buy_domain_modal(domain, available_extensions);
  //       $('#errors').empty().append(error_message(response));
  //     }
  //   })
  // });


  // define('open_link', function(url) {
  //   hide_modal();
  //   set_route(url);
  // });
  // define('successful_register_confirmation', function(domain) {
  //   return [
  //     h1("Congratulations!"),
  //     p("You've just registered ", strong(domain), ". Here are some things you can do:"),
  //     ul(
  //       li(a({ href: curry(Register.open_link, "#domains/" + domain) }, "View domain details")),
  //       li(a({ href: curry(Register.open_link, "#domains/" + domain + "/dns") }, "Modify DNS Settings")),
  //       li(a({ href: curry(Register.open_link, "#domains/" + domain + "/whois") }, "Modify WHOIS Settings")),
  //       li(a({ href: curry(Register.open_link, "#") }, "View all Domains"))
  //     )
  //   ];
  // });
}
