with (Hasher('DomainShow','DomainApps')) {

  route('#domains/:domain', function(domain) {
    var content_div = div(spinner('Loading...'));
    
    render(
      chained_header_with_links(
        { href: '#domains', text: 'My Domains' },
        { text: domain }
      ),
      
      div({ id: 'error-message', 'class': 'error-message hidden' }),
      domain_nav_table(content_div)
    );
    
    // wrap get domain in a long_poll. if this is the first contact we have 
    // had with the domain, we need to wait until it has initially been synced
    long_poll({
      max_time: -1, // TODO make this timeout, maybe
      interval: 3000,
      
      action: {
        method: curry(Badger.getDomain, domain),
        on_ok: function(response) {
          if (response.data && (response.data.available || !response.data.current_registrar.match(/^unknown$/i))) {
            handle_get_domain_response(content_div, domain, response);
            return true;
          }
        }
      }
    });

    // Badger.getDomain(domain, curry(handle_get_domain_response, content_div, domain));
  });

  define('handle_get_domain_response', function(content_div, domain, response, skip_retry) {
    var domain_obj = response.data;

    if (response.meta.status == 'ok') {
      if (!domain_obj.current_registrar) {
        if (domain_obj.can_register) {
          render({ into: content_div }, 
            div({ 'class': 'sidebar' },
              success_message(
                h3("This domain is available!"),
                p("Quick, register it before somebody else does!")
              )
            ),

            div({ 'class': 'has-sidebar' },
              Register.full_form(domain_obj.name)
            )
          );
          
          // if the number of years was already set, pick it off from session variables
          if (years = Badger.Session.get('years')) {
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
        } else {
          render({ into: content_div },
            div("This domain is not currently registered! Unfortunately, we do not support this top level domain quite yet. Check back later!")
            // TODO add some sort of way to watch the domain here. Make these messages way prettier. --- CAB
          );
        }
      } else if (domain_obj.current_registrar == 'Unknown') {
        // if it's "unknown", it was probably just added and we're still loading info for it... poll until synced
        
        // var timeout = setTimeout(function() {
        //   Badger.getDomain(domain_obj.name, curry(handle_get_domain_response, content_div, domain));
        // }, 3000);
      } else {
        render({ into: content_div },
          ((domain_obj.permissions_for_person || []).includes('linked_account') || (domain_obj.permissions_for_person || []).includes('modify_dns')) ? [
            div({ style: 'float: right; margin-top: -50px' },
              a({ href: '#linked_accounts/share/' + domain },
                img({ src: 'images/apps/facebook.png', style: 'height: 25px; width: 25px; border-radius: 3px; margin-right: 5px' })
              ),
              a({ href: '#linked_accounts/share/' + domain },
                img({ src: 'images/apps/twitter.png', style: 'height: 25px; width: 25px; border-radius: 3px' })
              )
            )
          ] : [],
          
          domain_status_description(domain_obj),
          render_all_application_icons(domain_obj)
        );
      }
    } else {
      render({ into: content_div },
        error_message("Oops, we're having a problem finding any information for: " + domain)
      );
    }
    
    // animate the progress bar on page load
    animate_progress_bar();
  });

  define('animate_progress_bar', function(original_width) {
    $(".meter > span").each(function() {
      $(this)
      .data("origWidth", $(this).width())
      .width(original_width || 0)
      .animate({
        width: $(this).data("origWidth")
        }, 600);
    });
  });

  define('domain_status_description', function(domain_obj) {
    var current_date = date();
    var expire_date = date(Date.parse(domain_obj.expires_at));
    var days = parseInt(expire_date - current_date)/(24*3600*1000);

    if (domain_obj.transfer_in) {
      return display_transfer_status(domain_obj);
    } else if ((domain_obj.permissions_for_person || []).indexOf('show_private_data') >= 0) {
      return [
        p('This domain is active and will auto-renew for one Credit on ', date(Date.parse(domain_obj.expires_at)).toDateString(), '.'),
        days <= 30 ? a({ 'class': 'myButton myButton-small', href: curry(Register.renew_domain_modal, domain_obj.name) }, 'Renew') : ''
      ];
    } else if ((domain_obj.permissions_for_person || []).indexOf('linked_account') >=0) {
      
      return div({ style: 'margin-bottom: 15px' },
        p('This domain is currently registered to your linked account on ' + domain_obj.current_registrar),
        a({ 'class': 'myButton', href: curry(Transfer.redirect_to_transfer_for_domain, domain_obj.name) }, 'Transfer to Badger')
      );
      
      return 
    } else {
      return [
        p('This domain is currently registered at ', domain_obj.current_registrar,
          ' and will expire on ', date(Date.parse(domain_obj.expires_at)).toDateString(), '.',
          ' If this is your domain, you can ',
          a({ href: curry(Transfer.redirect_to_transfer_for_domain, domain_obj.name) }, 'transfer it to Badger'), '.'
        )
      ];
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

  define('display_transfer_status', function(domain_obj) {
    var step_percentage = Domains.compute_transfer_progress_percentage(domain_obj);

    // determine whether or not we should show the retry button
    var show_retry = true;
    // domain_obj.transfer_steps.pending.forEach(function(step) {
    //   if (step.name == "Approve transfer" && step.value == "transfer_rejected")
    //     show_retry = true;
    // });
    
    return div({ id: "transfer-progress-report", 'class': "info-message", style: "padding: 10px; margin-top: 20px" },
      cancel_transfer_button(domain_obj),
      
      div({ id: "progress-bar", style: "margin: -10px auto 0 auto" },
        table( tbody(
          tr(
            td({ style: "width: 25%" }, p({ style: "font: 25px AdelleBold, Titillium, Arial, sans-serif" }, "Transfer Progress")),
            td({ style: "width: 10%; text-align: center; font-weight: bold; font-size: 20px", id: "progress-bar-percentage" }, step_percentage + "%"),
            td({ style: "width: 50%" }, div({ 'class': "meter green nostripes" }, span({ style: "width: " + step_percentage + "%" })))
          )
        ))
      ),
      
      // div({ 'class': "status-message", style: 'margin-top: -20px' }, 
      //   "Estimated transfer time: ", 
      //   span({ style: "font-weight: bold" }, "5 minutes"), '. ', 
      //   'Feel free to leave this page and come back later.'
      // ),
      
      div({ style: "margin-bottom: 40px", id: 'transfer-steps' }, detail_information_rows(domain_obj))
    );
  });
  
  define('cancel_transfer_button', function(domain_obj, callback) {
    return div({ id: "cancel-transfer-button-div" },
      a({ 'class': 'close-button', style: "position: relative; float: right; margin-top: -10px; margin-right: -10px", href: callback || curry(cancel_transfer_modal, domain_obj) }, 'X')
    );
  })
  
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
        'pending':  div('This domain is currently being unlocked at ' + domain_obj.current_registrar  + '. This can take up to 5 minutes.'),
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

        'pending':  div("Reading auth code from " + domain_obj.current_registrar + "... this could take a few days."),

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
        'pending':  div("Approving transfer request at " + domain_obj.current_registrar + "... this could take a few days."),
        'needed':   div(
          "This will be automatically approved in 5 days.  You may be able to approve it immediately through " + domain_obj.current_registrar + ".", 
          render_help_link('transfer_requested', domain_obj.current_registrar)
        ),
        'trying':   div('Submitting transfer request to registry.'),
        'unknown':  div('The previous steps must be completed first.'),
        'ok':       div('Finalizing transfer and configuring domain.')
      }[domain_obj.transfer_in.approve_transfer],

      icon:{
        'pending':  'spin',
        'needed':   'spin',
        'trying':   'spin',
        'unknown':  'none',
        'ok':       'spin'
      }[domain_obj.transfer_in.approve_transfer]
    });
    
    // details = div(
    //   'You attempted to transfer this domain, however, the currently owning registrar, ' + domain_obj.current_registrar + ', rejected it.',
    //   render_help_link('transfer_rejected', domain_obj.current_registrar)  
    // );
    // progress_indicator = img({ src: "images/icon-no-light.gif" });
    // // bring the retry button out of hiding
    // $("#retry-transfer-button").css('display','');
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
  
  define('update_progress_bar', function(new_percentage) {
    var current_meter_width = parseInt($(".meter > span").css('width'));
    $(".meter > span").css('width', new_percentage.toString() + "%");
    animate_progress_bar(current_meter_width);
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

  define('render_all_application_icons', function(domain_obj) {
    var installed_apps = div();
    var available_apps = div({ id: "available-apps" });

    for (var key in Hasher.domain_apps) {
      var app = Hasher.domain_apps[key];
      if (app.menu_item) {
        var href;
        var target;
        if (app_is_installed_on_domain(app, domain_obj)) {
          href = app.menu_item.href.replace(/:domain/, domain_obj.name);
          target = installed_apps;
        } else {
          if ((app.id == 'badger_dns') || (app.id == 'remote_dns')) {
            href = curry(DnsApp.change_name_servers_modal, domain_obj);
          } else {
            href = curry(show_modal_install_app, app, domain_obj);
          }
          target = available_apps;
        }
        target.appendChild(
          a({ 'class': 'app_store_container', href: href },
            span({ 'class': 'app_store_icon', style: 'background-image: url(' + ((app.icon && app.icon.call ? app.icon.call(null, domain_obj) : app.icon) || 'images/apps/badger.png') + ')' } ),
            span({ style: 'text-align: center; font-weight: bold' }, (app.name.call ? app.name.call(null, domain_obj) : app.name))
          )
        );
        // add a clear every six icons
        if (target.childNodes.length % 9 == 8) target.appendChild(div({ style: 'clear: left ' }));
      }
    }

    var available_apps_div = div();
    if (((domain_obj.permissions_for_person || []).indexOf('modify_dns') >= 0) || ((domain_obj.permissions_for_person || []).indexOf('change_nameservers') >= 0)) {
      render({ into: available_apps_div },
        h2({ style: 'border-bottom: 1px solid #888; padding-bottom: 6px' }, 'Available Applications'),
        available_apps
      );
    }
    
    return [
      h2({ style: 'border-bottom: 1px solid #888; padding-bottom: 6px' }, 'Installed Applications'),
      installed_apps,
      div({ style: 'clear: both '}),

      available_apps_div,

      div({ style: 'clear: both '})
    ];
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
}
