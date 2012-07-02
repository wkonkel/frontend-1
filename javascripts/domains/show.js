with (Hasher('DomainShow','DomainApps')) {
  
  // show the apps on this domain
  route('#domains/:domain/apps', function(domain) {
    with_domain_nav(domain, function(nav_table, domain_obj) {
      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: domain },
          { text: 'Apps' }
        ),
        
        nav_table(
          div({ 'class': 'sidebar', style: 'float: right' },
            info_message(
              h3('Make things easier!'),
              p("Domain apps make it easy to use your domain with popular services.")
            ),
            
            info_message(
              h3("Don't see the app you are looking for?"),
              p("We are always looking for new apps to add, if you have a suggestion ", a({ href: '#contact_us', target: '_blank' }, "let us know!"))
            )
          ),
          
          div({ 'class': 'has-sidebar' },
            render_all_application_icons({
              domain_obj: domain_obj,
              apps_per_row: 4,
              filter: function(app_id) {
                if ((domain_obj.permissions_for_person||[]).includes('modify_dns')) return true;
                return ['dns'].includes(app_id);
              }
            })
          )
        )
      )
    });
  });
  
  route('#domains/:domain', function(domain) {
    with_domain_nav(domain, function(nav_table, domain_obj) {
      var domain_content_div = div();
      
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
      if ((domain_obj.current_registrar||'').match(/^unknown$/i)) {
        render({ into: domain_content_div },
          spinner('Loading domain...')
        );
        setTimeout(function() {
          var domain_route = '#domains/' + domain;
          if (get_route() == domain_route) {
            BadgerCache.flush('domains');
            set_route(domain_route);
          }
        }, 3000);
      } else if (domain_obj.available) {
        if (domain_obj.can_register) {
          render({ into: domain_content_div },
            div({ 'class': 'sidebar' },
              success_message(
                h3("This domain is available!"),
                p("Quickly, register it before somebody else does!")
              )
            ),

            div({ style: 'margin-left: -100px;' },
              Register.full_form(domain)
            )
          );
        } else {
          render({ into: domain_content_div },
            p("This domain is not currently registered! Unfortunately, we do not support this top level domain quite yet. Check back later!")
          );
        }
      } else {
        render({ into: domain_content_div },
          div({ 'class': 'sidebar'},
            (function() {
              if ((domain_obj.permissions_for_person||[]).includes('renew')) {
                return info_message(
                  h3("Don't lose your domain!"),
                  p("1 year can pass quickly, and your domain is important. Take action now:"),
                  ul(
                    li(a({ href: '#domains/' + domain + '/registration/extend' }, 'Extend the registration')),
                    li(a({ href: '#domains/' + domain + '/settings' }, 'Enable auto renewal'))
                  )
                );
              }
            })()
          ),

          div({ 'class': 'has-sidebar' },
            form({ 'class': 'fancy' },
              fieldset(
                label('Expires:'),
                span({ 'class': 'big-text' }, date(domain_obj.expires_on).toString('MMMM dd yyyy'))
              ),

              (function() {
                if (domain_obj.registered_at) {
                  return fieldset(
                    label('Registered:'),
                    span({ 'class': 'big-text' }, date(domain_obj.registered_at).toString('MMMM dd yyyy'))
                  );
                }
              })(),

              fieldset(
                label('Created:'),
                span({ 'class': 'big-text' }, date(domain_obj.created_at).toString('MMMM dd yyyy'))
              ),

              fieldset(
                label('Current Registrar:'),
                Registrar.small_icon(domain_obj.current_registrar)
              ),

              (function() {
                if (domain_obj.created_registrar) {
                  return fieldset(
                    label('Created By:'),
                    Registrar.small_icon(domain_obj.created_registrar)
                  );
                }
              })(),
              
              (function() {
                if (domain_obj.previous_registrar) {
                  return fieldset(
                    label('Previous Registrar:'),
                    Registrar.small_icon(domain_obj.previous_registrar)
                  );
                }
              })()
            )
          )
        );
      }
      
      render(
        chained_header_with_links(
          { text: 'Domains', href: '#domains' },
          { text: domain },
          { text: 'Registration' }
        ),
        
        nav_table(
          (function() {
            if ((domain_obj.permissions_for_person || []).includes('pending_transfer')) return display_transfer_status(domain_obj);
          })(),
          
          domain_content_div
        )
      );
      
      // update the expiration date and button as years selector changed
      if (domain_obj.available && domain_obj.can_register) {
        // if the number of years was already set, pick it off from session variables
        if (years = Badger.Session.remove('years')) {
          $("select[name=years] option[value=" + years + "]").attr('selected', true);
        }
        // update the register domains button
        $("select[name=years]").change(function(e) {
          $('#register-button').val('Register ' + domain + ' for ' + this.value + (this.value == 1 ? ' Credit' : ' Credits'));
          $('#expiration-date').html(
            (parseInt(this.value)).years().fromNow().toString("MMMM dd yyyy")
          );
        });
        
        $("select[name=years]").trigger('change');
      }
    });
  });
  
  
  
  
  
  
  define('display_transfer_status', function(domain_obj) {
    var step_percentage = Domains.compute_transfer_progress_percentage(domain_obj);

    return div(
      info_message(
        div({ id: "progress-bar", style: "margin: -10px auto 0 auto" },
          table( tbody(
            tr(
              td({ style: "width: 25%" }, p({ style: "font: 20px AdelleBold, Titillium, Arial, sans-serif" }, "Transfer Progress")),
              td({ style: "width: 10%; text-align: center; font-weight: bold; font-size: 20px", id: "progress-bar-percentage" }, step_percentage + "%"),
              td({ style: "width: 50%" }, div({ 'class': "meter green nostripes" }, span({ style: "width: " + step_percentage + "%" })))
            )
          ))
        ),

        // ($.map(domain_obj.transfer_in, function(k,v) { return k; }).indexOf('needed') == -1) ? [
        //   div({ 'class': "status-message" }, 
        //     "Estimated transfer time is ", span({ style: "font-weight: bold" }, "5 minutes"), '.  Feel free to leave this page and check back later.'
        //   )
        // ] : [],

        div({ style: "margin-bottom: 40px", id: 'transfer-steps' }, detail_information_rows(domain_obj))
      ),
      
      div({ id: "cancel-transfer-button-div", style: 'float: right' },
        cancel_transfer_button(domain_obj)
      )
    );
  });
  
  define('cancel_transfer_button', function(domain_obj, callback) {
    return a({ href: callback || curry(cancel_transfer_modal, domain_obj) }, 'Cancel this transfer.');
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
        'unknown':  div('We are checking on the lock status of this domain.')
        
      }[domain_obj.transfer_in.unlock_domain],

      icon:{
        'ok':       'check',
        'pending':  'spin',
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

  define('transfer_description_row_auth_code', function(domain_obj) {
    return transfer_description_row({
      name: 'Validate auth code',

      details:{
        'ok':       div({ style: "text-decoration: line-through" }, "Auth code verified!"),

        'pending':  div("Reading auth code from " + domain_obj.current_registrar + "."),

        'needed':   div(
          div({ id: 'auth-code-row-form-wrapper' },
            div({ style: "padding: 5px 0px 5px 0px" }, "In order to proceed, you need the domain auth code from " + domain_obj.current_registrar + ".",
              render_help_link('needs_auth_code', domain_obj.current_registrar)
            ),
            div({ style: "margin-bottom: 5px" },
              form({ action: curry(retry_transfer, domain_obj.name)}, 
                input({ 'class': "fancy", name: 'auth_code', placeholder: 'auth code', value: '' }),
                div({ id: "auth-code-row", style: "float: right; padding-top: 3px; margin-right: 355px" },
                  submit({ 'class': "myButton" }, 'Submit')
                )
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
  
  define('update_progress_bar', function(new_percentage) {
    var current_meter_width = parseInt($(".meter > span").css('width'));
    $(".meter > span").css('width', new_percentage.toString() + "%");
    animate_progress_bars(current_meter_width);
    $("#progress-bar-percentage").html(parseInt(new_percentage).toString() + "%");
  });
  
  define('reload_transfer_steps_data', function(domain_name) {
    Badger.getDomain(domain_name, function(domain_response) {
      if (get_route() != "#domains/" + domain_name) return;

      var domain_obj = domain_response.data;

      // if it completed, set a timeout to reload page, after which the apps should be displayed
      if (!domain_obj.transfer_in) return on_transfer_complete(domain_name);
      
      // if the transfer steps are no longer present, then the transfer succeeded!
      var new_percentage = Domains.compute_transfer_progress_percentage(domain_obj);
      var old_percentage = parseInt($("td#progress-bar-percentage").html());
      
      if (new_percentage != old_percentage) {
        BadgerCache.flush('domains');
        update_progress_bar(new_percentage);
      }
      
      // remove and replace with updated rows
      $("#transfer-steps tr").remove();

      // add the transfer steps, unless it was just completed
      render({ into: 'transfer-steps' }, detail_information_rows(domain_obj));
      
      // update the cancel button with the latest domain info
      update_cancel_transfer_button_href(domain_obj);
    });
  });
  
  define('on_transfer_complete', function(domain_name) {
    BadgerCache.flush('domains');
    set_route('#domains/' + domain_name);
    
    // show a share transfer modal.
    // the argument 1 is provided to make it a single domain share.
    // this will all be reworked at some point, leaving it as is for now --- CAB
    // Share.show_share_transfer_modal(1);
  });
  
  define('update_cancel_transfer_button_href', function(domain_obj) {
    $("#cancel-transfer-button-div").empty().html(cancel_transfer_button(domain_obj));
  });

  define('render_help_link', function(topic, registrar) {
    topic = (topic == null ? '' : topic);
    registrar = (registrar == null ? '' : registrar);
    switch (topic) {
      case 'needs_unlock':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_unlocking_your_domain', target: '_blank' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'http://community.badger.com/badger/topics/network_solutions_domain_transfer_unlocking_your_domain_getting_an_auth_code', target: '_blank' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'http://community.badger.com/badger/topics/1_1_domain_transfer_unlocking_your_domain', target: '_blank' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/enom_domain_transfer_unlocking_your_domain', target: '_blank' }, '(?)');
          case 'Gandi SAS':
            return a({ href: 'http://community.badger.com/badger/topics/gandi_domain_transfer_unlocking_your_domain', target: '_blank' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center', target: '_blank' }, '(?)');
        }
      case 'needs_privacy_disabled':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_disabling_privacy', target: '_blank' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'http://community.badger.com/badger/topics/network_solutions_domain_transfer_disabling_privacy', target: '_blank' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'http://community.badger.com/badger/topics/1_1_domain_transfer_disabling_privacy', target: '_blank' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/enom_domain_transfer_disabling_privacy', target: '_blank' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center', target: '_blank' }, '(?)');
        }
      case 'needs_auth_code':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_getting_an_auth_code', target: '_blank' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'http://community.badger.com/badger/topics/network_solutions_domain_transfer_unlocking_your_domain_getting_an_auth_code', target: '_blank' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'http://community.badger.com/badger/topics/1_1_domain_transfer_getting_an_auth_code', target: '_blank' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/enom_domain_transfer_getting_an_auth_code', target: '_blank' }, '(?)');
          case 'Gandi SAS':
            return a({ href: 'http://community.badger.com/badger/topics/gandi_domain_transfer_getting_an_auth_code', target: '_blank' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center', target: '_blank' }, '(?)');
        }
      case 'transfer_requested':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_manually_approving_a_transfer', target: '_blank' }, '(?)');
          case 'Gandi SAS':
            return a({ href: 'http://community.badger.com/badger/topics/gandi_domain_transfer_manually_approving_a_transfer', target: '_blank' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center', target: '_blank' }, '(?)');
        }
      default:
        return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center', target: '_blank' }, '(?)');
    }
  });
  
  define('detail_information_rows', function(domain_obj) {
    if (!domain_obj.transfer_in) return;
    
    var auto_reload;
    if (domain_obj.transfer_in.enter_auth_code == 'needed') auto_reload = false; //if we're showing a form, dont reload
    else if (domain_obj.transfer_in.unlock_domain != 'ok') auto_reload = true;
    else if (domain_obj.transfer_in.disable_privacy != 'ok') auto_reload = true;
    else if (domain_obj.transfer_in.enter_auth_code != 'ok') auto_reload = true;
    else if (domain_obj.transfer_in.approve_transfer != 'unknown') auto_reload = true;
    else auto_reload = false;

    if (auto_reload) setTimeout(curry(reload_transfer_steps_data, domain_obj.name), 5000);

    return table({ 'class': "fancy-table", id: "transfer-steps" }, tbody(
      transfer_description_row_initiated(domain_obj),
      transfer_description_row_unlock(domain_obj),
      transfer_description_row_disable_privacy(domain_obj),
      transfer_description_row_auth_code(domain_obj),
      transfer_description_row_approve_transfer(domain_obj)
    ));
  });  
  
}
