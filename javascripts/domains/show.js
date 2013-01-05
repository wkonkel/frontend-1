with (Hasher('DomainShow','DomainApps')) {

  // show the apps on this domain
  route('#domains/:domain', function(domain) {
    var target_div = div(spinner('Loading...'));
    
    // initial render since with_domain_nav is async
    render(
      chained_header_with_links(
        { text: 'Domains', href: '#domains' },
        { text: domain }
      ),
      
      target_div
    );

    with_domain_nav(domain, function(nav_table, domain_obj) {
      /*
        Three States:
        1. Domain.current_registrar =~ /unknown/i
          We are adding this domain to our DB for the first time,
          and it has not yet been synced.
        2. Domain is available!
          The domain has not yet been registered. Show the registration
          form.
        3. Domain registered!
          Either with us, or another registrar. Show the registration
          data.
      */
      if (!domain_obj) {
        return render({ into: target_div },
          error_message(domain + ' is not a valid domain name.')
        );
      } else if ((domain_obj.current_registrar||'').match(/^unknown$/i)) {
        setTimeout(function() {
          var domain_route = '#domains/' + domain;
          if (get_route() == domain_route) {
            BadgerCache.flush('domains');
            set_route(domain_route);
          }
        }, 3000);
        
        return;
      } else if (domain_obj.available) {
        if (domain_obj.can_register && domain_obj.supported_tld) {
          render({ into: target_div },
            success_message({ style: 'text-align: center' },
              h3("This domain is available!"),
              p({ style: 'margin: 0px;' }, "Quickly, register it before somebody else does!"),
              a({ 'class': 'myButton large', style: 'margin-top: 30px;', href: curry(Cart.add_domain, domain) },
                'Add ' + Domains.truncate_domain_name(domain) + ' to Cart')
            )
          );
          
          // // update the expiration date and button as years selector changed
          // if (domain_obj.available && domain_obj.can_register) {
          //   // if the number of years was already set, pick it off from session variables
          //   if (years = Badger.Session.remove('years')) {
          //     $("select[name=years] option[value=" + years + "]").attr('selected', true);
          //   }
          //   // update the register domains button
          //   $("select[name=years]").change(function(e) {
          //     // $('#register-button').val('Register ' + domain + ' for $' + (this.value * 10));
          //     $('#expiration-date').html(
          //       (parseInt(this.value)).years().fromNow().toString("MMMM dd yyyy")
          //     );
          //   });
          // 
          //   $("select[name=years]").trigger('change');
          // }
          
          return;
        } else {
          return render({ into: target_div },
            error_message("This domain is not currently registered! Unfortunately, we do not support this top level domain quite yet. Check back later!")
          );
        }
      }

      // if this domain is not a badger registration, bluntly advertise that it can be transferred!
      // show different message for linked domains
      var add_to_cart_message = div(),
          permissions = (domain_obj.permissions_for_person||[]);

      // If it's not already being transferred to us
      var message;
      if (!permissions.includes('pending_transfer')) {
        if (permissions.includes('linked_account')) {
          message = ['Ready to make the switch? Add your domain to the cart to transfer it from ', domain_obj.current_registrar, '!'];
        } else if (domain_obj.supported_tld && !permissions.includes('modify_dns') && !permissions.includes('change_nameservers')) {
          message = ['Do you own this domain, and want to transfer it to us? If so, add it to your cart!'];
        }
      }

      if (message)
        render({ into: add_to_cart_message },
          info_message({ style: 'text-align: center' },
            p({ style: 'margin: 0px;' }, message),
            a({ 'class': 'myButton', style: 'margin-top: 10px;', href: function() { Cart.add_domain(domain_obj); set_route('#cart'); } },
              'Add ' + Domains.truncate_domain_name(domain) + ' to Cart')
          )
        );

      render({ into: target_div },
        nav_table(
          (domain_obj.permissions_for_person||[]).includes('pending_transfer') && display_transfer_status(domain_obj),

          add_to_cart_message,

          Badger.getAccessToken() && render_all_application_icons({
            domain_obj: domain_obj,
            apps_per_row: 6,
            filter: function(app_id) {
              if ((domain_obj.permissions_for_person||[]).includes('modify_dns')) return true;
              if ((domain_obj.permissions_for_person||[]).includes('change_nameservers')) return true;
              return ['dns'].includes(app_id);
            }
          })
        )
      )
    });
  });

    var ONE_YEAR = 1000*60*60*24*365;

    route('#domains/:domain/whois', function(domain) {
    var target_div = div(spinner('Loading...'));
    
    render(
      chained_header_with_links(
        { text: 'Domains', href: '#domains' },
        { text: domain },
        { text: 'Registration' }
      ),

      target_div
    );
    
    with_domain_nav(domain, function(nav_table, domain_obj) {
      var show_whois_privacy_message = (domain_obj.permissions_for_person||[]).includes('modify_contacts') &&
                                       !(domain_obj.whois && domain_obj.whois.privacy);

      render({ into: target_div },
        nav_table(
          div({ 'class': 'has-sidebar' },
            form({ 'class': 'fancy', style: 'margin-bottom: 20px' },
              domain_obj.expires_at && fieldset(
                label('Expires:'),
                span({ 'class': 'big-text' }, date(domain_obj.expires_at).toString('MMMM dd yyyy'))
              ),

              domain_obj.registered_at && fieldset(
                label('Registered:'),
                span({ 'class': 'big-text' }, date(domain_obj.registered_at).toString('MMMM dd yyyy'))
              ),

              domain_obj.created_at && fieldset(
                label('Created:'),
                span({ 'class': 'big-text' }, date(domain_obj.created_at).toString('MMMM dd yyyy'))
              ),

              domain_obj.current_registrar && fieldset(
                label('Current Registrar:'),
                Registrar.small_icon(domain_obj.current_registrar)
              ),

              domain_obj.created_registrar && fieldset(
                label('Created By:'),
                Registrar.small_icon(domain_obj.created_registrar)
              ),

              domain_obj.previous_registrar && fieldset(
                label('Previous Registrar:'),
                Registrar.small_icon(domain_obj.previous_registrar)
              )
            ),
            
            h1({ style: 'margin-top: 35px; border 0px' }, 'Public WHOIS'),
            
            show_whois_privacy_message && info_message("Don't want your contact information available to the public? ", a({ href: '#domains/' + domain + '/settings' }, 'Enable Whois privacy.'), " It's free!"),

            domain_obj.whois && domain_obj.whois.raw && info_message({ style: 'overflow: scroll; width: 700px; border-color: #aaa; background: #eee; white-space: pre; padding: 10px; border-radius: 0px' }, domain_obj.whois.raw)
          )
        )
      );
    });
  });

  route('#domains/:domain/renew', function(domain) {
    var target_div = div(spinner('Loading...'));
    var years = Badger.Session.remove('years') || 1;
    render(
      chained_header_with_links(
        { text: 'Domains', href: '#domains' },
        { text: domain },
        { text: 'Renew' }
      ),

      target_div
    );

    with_domain_nav(domain, function(nav_table, domain_obj) {
      if (!(domain_obj.permissions_for_person||[]).includes('modify_contacts')) {
        set_route('#domains/' + domain_obj.name);
      }

      // determine the max amount of years that the domain can be renewed for.
      var max_renewal_years = Math.floor((date().add(10).years().getTime() - date(domain_obj.expires_at).getTime()) / ONE_YEAR);

      render({ into: target_div },
        nav_table(
          div({ 'class': 'has-sidebar' },
            form({ id: 'registration-renewal-form', 'class': 'fancy', action: curry(renew_domain, domain_obj), loading_message: 'Extending registration...' },
              div({ id: 'errors' }),

              max_renewal_years <= 0 ? [
                info_message("The registration cannot be extended any further. Max registration time is 10 years.")
              ] : [
                input({ type: "hidden", value: domain, name: "domain" }),
                fieldset(
                  label({ 'for': 'years' }, 'Years:'),
                  select({ name: 'years' },
                    (function() {
                      var options = [];
                      for (var i=1; i <= max_renewal_years; i++) {
                        var o = option({ value: i }, ''+i);
                        if (i == years) o.selected = 'selected';
                        options.push(o);
                      }
                      return options;
                    })()
                  )
                ),
                fieldset(
                  label('New Expiration Date:'),
                  span({ id: 'expiration-date', 'class': 'big-text' }, date(domain_obj.expires_at).toString("MMMM dd yyyy"))
                ),
                fieldset({ 'class': 'no-label' },
                  submit({ id: 'renew-registration-submit', name: 'Submit', value: 'Renew Domain' })
                )
              ]
            )
          )
        )
      );

      // update expiration date and purchase button on extend registration form
      $('select[name=years]').change(function() {
        var years = parseInt(this.value);
        var new_expiration_date = date(domain_obj.expires_at).add(years).years();
        $("#expiration-date").html(new_expiration_date.toString("MMMM dd yyyy"));
        $('#renew-registration-submit').val('Renew Domain for $' + (years * 10));
      }).change();
    });
  });


  define('renew_domain', function(domain_obj, form_data) {
    var years = form_data.years,
        domain = form_data.domain;
    show_spinner_modal('Renewing ' + domain + ' for ' + years + ' year' + (years == 1 ? '' : 's') + '...');

    Badger.renewDomain(domain, years, function(response) {
      hide_modal();

      if (response.meta.status == "ok") {
        BadgerCache.flush('domains');
        set_route("#domains/" + domain + "/whois");
        update_credits(true);
      } else {
        if (response.data && response.data.extra) {
          Badger.Session.write({
            years: years,
            necessary_credits: response.data.extra.necessary_credits,
            redirect_url: get_route()
          });
          set_route("#account/billing/credits");
        }

        $("#errors").html(error_message(response));
      }
    });
  });
  
  define('display_transfer_status', function(domain_obj) {
    var step_percentage = Domains.compute_transfer_progress_percentage(domain_obj);

    return info_message({ id: 'transfer-status', style: 'margin-bottom: 15px;' },
      div({ 'class': 'transfer-status' },
        h1('Transfer Status'),

        div({ style: 'height: 46px; padding: 10px; margin: 10px;' },
          span({ id: 'progress-bar-percentage', style: 'float: left; font-size: 50px; font-weight: bold; padding: 10px' }, step_percentage + '%'),
          div({ 'class': 'meter green nostripes', style: 'float: right; width: 75%' }, span({ style: 'width: ' + step_percentage + '%' }))
        ),

        div({ style: "margin-bottom: 40px", id: 'transfer-steps' }, detail_information_rows(domain_obj)),

        div({ id: 'cancel-transfer-button-div', style: 'text-align: right; margin-top: 15px' },
          cancel_transfer_button(domain_obj)
        )
      )
    );
  });
  
  define('cancel_transfer_button', function(domain_obj, callback) {
    return a({ href: callback || curry(cancel_transfer_modal, domain_obj) }, 'Cancel transfer.');
  });
  
  define('cancel_transfer_modal', function(domain_obj) {
    if (!domain_obj.transfer_in) return ;
    var can_cancel_transfer = domain_obj.transfer_in.can_cancel_transfer;
    
    return show_modal(
      h1("Cancel Domain Transfer"),
      
      can_cancel_transfer ? [
        div({ style: "height: 65px" },
          p({ style: "font-weight: bold" }, "Are you sure you want to cancel this domain transfer?")
        ),
        div({ style: "float: right; margin-top: -20px" },
          //a({ 'class': 'myButton', style: "margin-right: 15px", href: hide_modal }, 'Go Back'),
          a({ 'class': 'myButton red', href: curry(cancel_transfer, domain_obj.name) }, 'Cancel Transfer')
        )
      ] : [
        div({ style: "height: 110px" },
          p({ style: "font-weight: bold" }, "This domain transfer can no longer be cancelled through Badger."),
          (domain_obj.transfer_in.approve_transfer == 'needed') && p("You can cancel this transfer by rejecting the request through ", span({ style: "font-weight: bold" }, domain_obj.current_registrar), ".")
        ),
        div({ style: "float: right; margin-top: -20px" },
          a({ 'class': 'myButton', href: hide_modal }, 'Close')
        )
      ]
    );
  });
  
  define('cancel_transfer', function(domain_name) {
    start_modal_spin("Cancelling domain transfer...");
    
    Badger.cancelDomainTransfer(domain_name, function() {
      // update domains and credits counts
      update_credits(true);
      update_my_domains_count(true);
      
      hide_modal();
      set_route("#domains");
    });
  });

  define('transfer_description_row_initiated', function(domain_obj) {
    return transfer_description_row({
      name: 'Initiate transfer',
      details: div({ style: "text-decoration: line-through" }, 'The domain transfer has been initiated.'),
      icon: 'check'
    });
  });

  define('transfer_description_row_unlock', function(domain_obj) {
    return transfer_description_row({
      name: 'Unlock domain',

      details:{
        'ok':       div({ style: "text-decoration: line-through" }, 'This domain is currently unlocked.'),
        'pending':  div('This domain is currently being unlocked at ' + domain_obj.current_registrar  + '.'),
        'needed':   div(
          'You need to unlock this domain at ' + domain_obj.current_registrar + '.',
          render_help_link('needs_unlock', domain_obj.current_registrar)
        ),
        'trying':   div('This domain cannot be transferred within 60 days of registration.  Once 60 days has elapsed, this transfer will resume.'),
        'unknown':  div('We are checking on the lock status of this domain.')
        
      }[domain_obj.transfer_in.unlock_domain],

      icon:{
        'ok':       'check',
        'pending':  'spin',
        'trying':   'spin',
        'needed':   'error',
        'unknown':  'spin'
      }[domain_obj.transfer_in.unlock_domain]
    });
  });

  define('transfer_description_row_disable_privacy', function(domain_obj) {
    return transfer_description_row({
      name: 'Disable privacy',

      details:{
        'ok':       div({ style: "text-decoration: line-through" }, 'Privacy does not need to be disabled.'),
        'needed':   div(
          'You need to disable privacy for this domain at ' + domain_obj.current_registrar + '.',
            render_help_link('needs_privacy_disabled', domain_obj.current_registrar)
        ),
        'unknown':  div('We are checking on the privacy status of this domain.')
        
      }[domain_obj.transfer_in.disable_privacy],

      icon:{
        'ok':       'check',
        'needed':   'error',
        'unknown':  'spin'
      }[domain_obj.transfer_in.disable_privacy]
    });
  });

  define('transfer_description_row_accept_foa', function(domain_obj) {
    return transfer_description_row({
      name: 'Approve transfer',

      details:{
        'ok':       div({ style: "text-decoration: line-through" }, 'Transfer has been approved.'),
        'needed':   div(
          'Current registrant needs to approve transfer.', render_help_link('needs_transfer_authorization'), br(),
          '(In an email to them "Transfer authorization required - ' + domain_obj.name + '")'
        )
      }[domain_obj.transfer_in.accept_foa],

      icon:{
        'ok':       'check',
        'needed':   'error'
      }[domain_obj.transfer_in.accept_foa]
    });
  });

  define('transfer_description_row_auth_code', function(domain_obj) {
    return transfer_description_row({
      name: 'Validate auth code',

      details:{
        'ok':       div({ style: "text-decoration: line-through" }, "Auth code verified!"),

        'pending':  div("Reading auth code from " + domain_obj.current_registrar + "."),

        'needed':   div(
          div({ id: 'auth-code-row-form-wrapper' },
            div({ style: "padding: 5px 0px 5px 0px" }, "Enter the domain auth code from " + domain_obj.current_registrar + ":",
              render_help_link('needs_auth_code', domain_obj.current_registrar)
            ),
            div({ style: "margin-bottom: 5px" },
              form({ action: curry(retry_transfer, domain_obj.name)}, 
                input({ 'class': "fancy", name: 'auth_code', placeholder: 'auth code', value: '' }),
                submit({ 'class': "myButton" }, 'Submit')
              )
            )
          ),
          div({ id: "auth-code-row-veryifying", style: "display: none" },
            div("Verifying auth code with registry.")
          )
        ),
        
        'trying': div('Verifying auth code with registry.'),

        'unknown':  div('We are checking the auth code for this domain.')
        
      }[domain_obj.transfer_in.enter_auth_code],

      icon:{
        'ok':       'check',
        'pending':  'spin',
        'needed':   'error',
        'trying':   'spin',
        'unknown':  'spin'
      }[domain_obj.transfer_in.enter_auth_code],
      
      icon_id: 'auth_code_icon'
    });
  });

  define('transfer_description_row_approve_transfer', function(domain_obj) {
    return transfer_description_row({
      name: 'Approve request',

      details:{
        'pending':  div("Approving transfer request at " + domain_obj.current_registrar + "."),
        'needed':   div(
          "This will be automatically approved in 5 days.  You may be able to approve it immediately through " + domain_obj.current_registrar + ".", 
          render_help_link('transfer_requested', domain_obj.current_registrar)
        ),
        'trying':   div('Submitting transfer request to registry.'),
        'unknown':  div('The previous steps must be completed first.'),
        'ok':       div('Finalizing transfer and configuring domain.'),
        
        'rejected': div(
                      div({ id: 'approve_transfer-row-wrapper' },
                        'This transfer has been rejected at the current registrar (' + domain_obj.current_registrar + '). ',
                        form({ style: 'margin: 5px 0', action: curry(retry_rejected_transfer, domain_obj.name)}, submit({ 'class': "myButton" }, 'Retry Transfer'))
                      ),
                      div({ id: 'approve_transfer-row-retrying', style: 'display: none' }, 'Submitting transfer request to registry.')
                    )
        
      }[domain_obj.transfer_in.approve_transfer],

      icon:{
        'pending':  'spin',
        'needed':   'spin',
        'trying':   'spin',
        'unknown':  'none',
        'ok':       'spin',
        'rejected':   'error'
      }[domain_obj.transfer_in.approve_transfer],
      
      icon_id: 'approve_transfer_icon'
    });
    
    // details = div(
    //   'You attempted to transfer this domain, however, the currently owning registrar, ' + domain_obj.current_registrar + ', rejected it.',
    //   render_help_link('transfer_rejected', domain_obj.current_registrar)
    // );
  });


  define('transfer_description_row', function(options) {
    if (options.icon == 'check') options.icon = 'images/check.png';
    else if (options.icon == 'spin') options.icon = 'images/ajax-loader.gif';
    else if (options.icon == 'error') options.icon = 'images/icon-no-light.gif';
    else if (options.icon == 'none') options.icon = false;
    else options.icon = 'images/icon-no-light.gif';
    
    if (!options.details) options.details = 'Unknown error!'

    return tr(
      //td({ style: "width: 5%" }, div({ id: (step_obj.name == 'Enter auth code' ? 'auth-code-progress-indicator' : null), style: "text-align: center" }, progress_indicator)),
      td({ style: "width: 5%" }, div({ style: "text-align: center" }, (options.icon && img({ src: options.icon, id: options.icon_id })) )),
      td({ style: "width: 20%; font-weight: bold" }, options.name),
      td({ style: "width: 75%" }, options.details)
    );
  });

  define('retry_transfer', function(domain_name, form_data) {
    // if no longer on the page, clear the timeout and return
    if (get_route() != "#domains/" + domain_name) {
      return;
    }

    if (form_data.auth_code.length > 0) {
      $('#auth_code_icon')[0].src = 'images/ajax-loader.gif';
      $("#auth-code-row-form-wrapper").hide();
      $("#auth-code-row-veryifying").show();

      Badger.tryAuthCodeForTransfer(domain_name, form_data.auth_code, function(transfer_response) {
        reload_transfer_steps_data(domain_name);
      });
    }
  });

  define('retry_rejected_transfer', function(domain_name) {
    $('#approve_transfer_icon')[0].src = 'images/ajax-loader.gif';
    $("#approve_transfer-row-wrapper").hide();
    $("#approve_transfer-row-retrying").show();

    Badger.retryRejectedTransfer(domain_name, function(transfer_response) {
      reload_transfer_steps_data(domain_name);
    });
  });
  
  define('update_progress_bar', function(new_percentage, id) {
    var current_meter_width = parseInt($(id).css('width'));
    $(id).css('width', new_percentage.toString() + "%");
    animate_progress_bars(current_meter_width);
    $("#progress-bar-percentage").html(parseInt(new_percentage).toString() + "%");
  });
  
  define('reload_transfer_steps_data', function(domain_name) {
    Badger.getDomain(domain_name, function(domain_response) {
      if (get_route() != "#domains/" + domain_name) return;

      var domain_obj = domain_response.data;

      // if it completed, set a timeout to reload page, after which the apps should be displayed
      if (!domain_obj.transfer_in) {
        BadgerCache.flush('domains');
        set_route('#domains/' + domain_name);
      }
      
      // if the transfer steps are no longer present, then the transfer succeeded!
      var new_percentage = Domains.compute_transfer_progress_percentage(domain_obj);
      var old_percentage = parseInt($("#progress-bar-percentage").html());
      
      if (new_percentage != old_percentage) {
        BadgerCache.flush('domains');
        update_progress_bar(new_percentage, ".meter > span");
      }
      
      // remove and replace with updated rows
      $("#transfer-steps tr").remove();

      // add the transfer steps, unless it was just completed
      render({ into: 'transfer-steps' }, detail_information_rows(domain_obj));
      
      // update the cancel button with the latest domain info
      update_cancel_transfer_button_href(domain_obj);
    });
  });
  
  define('update_cancel_transfer_button_href', function(domain_obj) {
    $("#cancel-transfer-button-div").empty().html(cancel_transfer_button(domain_obj));
  });

  define('render_help_link', function(topic, registrar) {
    topic = (topic == null ? '' : topic);
    registrar = (registrar == null ? '' : registrar);
    var slug = '';
    switch (topic) {
      case 'needs_unlock':
        switch (registrar) {
          case 'GoDaddy Inc.':
            slug = 'topics/godaddy_domain_transfer_unlocking_your_domain'; break;
          case 'Network Solutions, LLC':
            slug = 'topics/network_solutions_domain_transfer_unlocking_your_domain_getting_an_auth_code'; break;
          case '1 & 1 INTERNET AG':
            slug = 'topics/1_1_domain_transfer_unlocking_your_domain'; break;
          case 'Enom, Inc.':
            slug = 'topics/enom_domain_transfer_unlocking_your_domain'; break;
          case 'Gandi SAS':
            slug = 'topics/gandi_domain_transfer_unlocking_your_domain'; break;
          default:
            slug = 'products/badger_knowledge_center'; break;
        }
      case 'needs_privacy_disabled':
        switch (registrar) {
          case 'GoDaddy Inc.':
            slug = 'topics/godaddy_domain_transfer_disabling_privacy'; break;
          case 'Network Solutions, LLC':
            slug = 'topics/network_solutions_domain_transfer_disabling_privacy'; break;
          case '1 & 1 INTERNET AG':
            slug = 'topics/1_1_domain_transfer_disabling_privacy'; break;
          case 'Enom, Inc.':
            slug = 'topics/enom_domain_transfer_disabling_privacy'; break;
          default:
            slug = 'products/badger_knowledge_center'; break;
        }
      case 'needs_auth_code':
        switch (registrar) {
          case 'GoDaddy Inc.':
            slug = 'topics/godaddy_domain_transfer_getting_an_auth_code'; break;
          case 'Network Solutions, LLC':
            slug = 'topics/network_solutions_domain_transfer_unlocking_your_domain_getting_an_auth_code'; break;
          case '1 & 1 INTERNET AG':
            slug = 'topics/1_1_domain_transfer_getting_an_auth_code'; break;
          case 'Enom, Inc.':
            slug = 'topics/enom_domain_transfer_getting_an_auth_code'; break;
          case 'Gandi SAS':
            slug = 'topics/gandi_domain_transfer_getting_an_auth_code'; break;
          default:
            slug = 'products/badger_knowledge_center'; break;
        }
      case 'transfer_requested':
        switch (registrar) {
          case 'GoDaddy Inc.':
            slug = 'topics/godaddy_domain_transfer_manually_approving_a_transfer'; break;
          case 'Gandi SAS':
            slug = 'topics/gandi_domain_transfer_manually_approving_a_transfer'; break;
          default:
            slug = 'products/badger_knowledge_center'; break;
        }
      case 'needs_transfer_authorization':
        slug = 'topics/authorize_transfer_into_badger'; break;
      default:
        slug = 'products/badger_knowledge_center'; break;
    }
    return [' ', a({ href: 'http://community.badger.com/badger/' + slug, target: '_blank' }, '(?)')];
  });
  
  define('detail_information_rows', function(domain_obj) {
    if (!domain_obj.transfer_in) return;
    
    var auto_reload;
    if (domain_obj.transfer_in.enter_auth_code == 'needed' && domain_obj.transfer_in.unlock_domain == 'ok' && domain_obj.transfer_in.disable_privacy == 'ok') auto_reload = false; // if we're showing a form, dont reload
    else if (domain_obj.transfer_in.unlock_domain != 'ok') auto_reload = true;
    else if (domain_obj.transfer_in.disable_privacy != 'ok') auto_reload = true;
    else if (domain_obj.transfer_in.accept_foa != 'ok') auto_reload = true;
    else if (domain_obj.transfer_in.enter_auth_code != 'ok') auto_reload = true;
    else if (domain_obj.transfer_in.approve_transfer != 'unknown') auto_reload = true;
    else auto_reload = false;

    if (auto_reload) setTimeout(curry(reload_transfer_steps_data, domain_obj.name), 5000);

    return table({ 'class': "fancy-table", id: "transfer-steps" }, tbody(
      transfer_description_row_initiated(domain_obj),
      transfer_description_row_unlock(domain_obj),
      transfer_description_row_disable_privacy(domain_obj),
      transfer_description_row_accept_foa(domain_obj),
      transfer_description_row_auth_code(domain_obj),
      transfer_description_row_approve_transfer(domain_obj)
    ));
  });  
  
}
