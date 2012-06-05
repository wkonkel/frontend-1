with (Hasher('DomainShow','DomainApps')) {

  // put this in global scope so that it can be cleared anywhere
  var retry_transfer_timeout;

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
    var current_date = new Date();
    var expire_date = new Date(Date.parse(domain_obj.expires_at));
    var days = parseInt(expire_date - current_date)/(24*3600*1000);

    if (domain_obj.transfer_steps && domain_obj.transfer_steps.completed.length > 0 && domain_obj.transfer_steps.pending.length > 0 && domain_obj.transfer_steps.count > 0) {
      return display_transfer_status(domain_obj);
    } else if ((domain_obj.permissions_for_person || []).indexOf('show_private_data') >= 0) {
      return [
        p('This domain is active and will auto-renew for one Credit on ', new Date(Date.parse(domain_obj.expires_at)).toDateString(), '.'),
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
          ' and will expire on ', new Date(Date.parse(domain_obj.expires_at)).toDateString(), '.',
          ' If this is your domain, you can ',
          a({ href: curry(Transfer.redirect_to_transfer_for_domain, domain_obj.name) }, 'transfer it to Badger'), '.'
        )
      ];
    }
  });




  define('set_retry_transfer_timeout_if_necessary', function(domain_obj, seconds) {
    if (!domain_obj.transfer_steps || !domain_obj.transfer_steps.pending || domain_obj.transfer_steps.pending.length == 0) return;
    
    transfer_steps = (domain_obj.transfer_steps.pending.concat(domain_obj.transfer_steps.completed));
    
    var needs_retry = false;
    transfer_steps.forEach(function(step) {
      if (step.name == 'Unlock domain' && ['pending_remote_unlock', null].indexOf(step.value) >= 0)
        needs_retry = true;
      else if (step.name == 'Enter auth code' && ['fetching_auth_code', 'fetch_auth_code_success'].indexOf(step.value) >= 0)
        needs_retry = true;
      else if (step.name == 'Approve transfer' && ['pending_remote_approval', 'pending_transfer', 'remote_approval_failed'].indexOf(step.value) >= 0)
        needs_retry = true;
      else if (step.name == 'Processed' && ['pending'].indexOf(step.value) >= 0)
        needs_retry = true;
    });
    
    if (needs_retry) retry_transfer_timeout = setTimeout(curry(retry_transfer, domain_obj.name, false), seconds);
  });
  
  define('detail_information_rows', function(domain_obj) {
    var detail_information_rows_array = [];
    
    domain_obj.transfer_steps.completed.forEach(function(step_obj) {
      detail_information_rows_array.push(
        transfer_description_row(domain_obj, step_obj)
      )
    });
    
    domain_obj.transfer_steps.pending.forEach(function(step_obj) {
      detail_information_rows_array.push(
        transfer_description_row(domain_obj, step_obj)
      )
    });
    
    // set a timeout to automatically reload data if needed
    set_retry_transfer_timeout_if_necessary(domain_obj, 10000);
    
    return detail_information_rows_array;
  });

  define('display_transfer_status', function(domain_obj) {
    var step_percentage = parseInt(100 * (domain_obj.transfer_steps.completed.length / domain_obj.transfer_steps.count));

    // determine whether or not we should show the retry button
    var show_retry = false;
    domain_obj.transfer_steps.pending.forEach(function(step) {
      if (step.name == "Approve transfer" && step.value == "transfer_rejected")
        show_retry = true;
    });
    
    return div({ id: "transfer-progress-report", 'class': "info-message", style: "padding: 10px; margin-top: 20px" },
      cancel_transfer_button(domain_obj),
      
      div({ id: "progress-bar", style: "margin: -10px auto 15px auto" },
        table( tbody(
          tr(
            td({ style: "width: 25%" }, p({ style: "font: 25px AdelleBold, Titillium, Arial, sans-serif" }, "Transfer Progress")),
            td({ style: "width: 10%; text-align: center; font-weight: bold; font-size: 20px", id: "progress-bar-percentage" }, step_percentage + "%"),
            td({ style: "width: 50%" }, div({ 'class': "meter green nostripes" }, span({ style: "width: " + step_percentage + "%" })))
          ),
          tr(
            (domain_obj.transfer_steps && domain_obj.transfer_steps.automatic) ? [
              div({ 'class': "status-message", style: "padding: 10px 0px 10px 0px; text-align: center; margin-top: -20px; margin-bottom: 0px" }, "Estimated transfer time: ", span({ style: "font-weight: bold" }, "5 minutes")),
              p("Feel free to leave this page and come back later.")
            ] : [
              
            ]
          )
        ))
      ),
      
      div({ style: "margin-bottom: 40px" },
        table({ 'class': "fancy-table", id: "transfer-steps" }, tbody(
          detail_information_rows(domain_obj)
        ))
      ),
      
      div({ style: "float: right; margin-top: -30px" },
        a({ id: "retry-transfer-button", 'class': 'myButton', style: (show_retry ? null : "display: none"), href: curry(retry_transfer, domain_obj.name, true) }, 'Retry'),
        div({ id: "refresh-transfer-steps-loader", style: "display: none" }, img({ src: "images/ajax-loader.gif" }))
      )
    );
  });
  
  define('cancel_transfer_button', function(domain_obj, callback) {
    return div({ id: "cancel-transfer-button-div" },
      a({ 'class': 'close-button', style: "position: relative; float: right; margin-top: -10px; margin-right: -10px", href: callback || curry(cancel_transfer_modal, domain_obj) }, 'X')
    );
  })
  
  define('cancel_transfer_modal', function(domain_obj) {
    // determine if it is pending remote approval
    var pending_remote_approval = false;
    if (domain_obj.transfer_steps) {
      domain_obj.transfer_steps.pending.forEach(function(step) {
        if (step.value == 'pending_remote_approval') pending_remote_approval = true;
      });
    }
    
    var can_cancel_transfer = domain_obj.transfer_steps && domain_obj.transfer_steps.can_cancel ? domain_obj.transfer_steps.can_cancel : false;
    
    return show_modal(
      h1("Cancel Domain Transfer"),
      
      can_cancel_transfer ? [
        div({ style: "height: 65px" },
          p({ style: "font-weight: bold" }, "Are you sure you want to cancel this domain transfer?")
        ),
        div({ style: "float: right; margin-top: -20px" },
          a({ 'class': 'myButton', style: "margin-right: 15px", href: hide_modal }, 'Go Back'),
          a({ 'class': 'myButton red', href: curry(cancel_transfer, domain_obj.name) }, 'Cancel')
        )
      ] : [
        div({ style: "height: 110px" },
          p({ style: "font-weight: bold" }, "This domain transfer is currently pending remote approval, and cannot be cancelled right now."),
          
          pending_remote_approval ? [
            p("The transfer request will automatically be approved at ", span({ style: "font-weight: bold" }, domain_obj.current_registrar), ", and cannot be cancelled.")
          ] : [
            p("If you reject the transfer request at ", span({ style: "font-weight: bold" }, domain_obj.current_registrar), ", then you can cancel the transfer here.")
          ]
        ),
        div({ style: "float: right; margin-top: -20px" },
          a({ 'class': 'myButton', href: hide_modal }, 'Go Back')
        )
      ]
    );
  });
  
  define('cancel_transfer', function(domain_name) {
    // clear the retry_transfer timer if it is pending execution
    clearTimeout(retry_transfer_timeout);
    
    start_modal_spin("Cancelling domain transfer...");
    
    Badger.cancelDomainTransfer(domain_name, function() {
      // update domains and credits counts
      update_credits(true);
      update_my_domains_count(true);
      
      hide_modal();
      set_route("#domains");
    });
  });

  define('transfer_description_row', function(domain_obj, step_obj) {
    // the image used to show status, defaults to nothing.
    // progress_indicator = img({ src: "images/check.png" });
    // progress_indicator = img({ src: "images/ajax-loader.gif" });
    // progress_indicator = img({ src: "images/icon-no-light.gif" });
    var progress_indicator = div();
    
    if (step_obj.name == 'Initiate transfer') {
      details = div({ style: "text-decoration: line-through" }, 'The domain transfer has been initiated.');
      progress_indicator = img({ src: "images/check.png" });
    } else if (step_obj.name == 'Unlock domain') {
      if (step_obj.value == 'pending_remote_unlock') {
        details = div('This domain is currently being unlocked at ' + domain_obj.current_registrar  + '. This can take up to 5 minutes.');
        progress_indicator = img({ src: "images/ajax-loader.gif" });
      } else if (step_obj.value == 'remote_unlock_failed') {
        details = div("We were unable to unlock the domain at " + domain_obj.current_registrar + ". You will need to unlock this domain manually.",
          render_help_link('needs_unlock', domain_obj.current_registrar)
        );
        progress_indicator = img({ src: "images/icon-no-light.gif" });
      } else if (step_obj.value == 'ok' || step_obj.value == 'remote_unlock_success') {
        details = div({ style: "text-decoration: line-through" }, 'This domain has been unlocked.');
        progress_indicator = img({ src: "images/check.png" });
      } else {
        details = div('You need to unlock this domain at ' + domain_obj.current_registrar + '.',
          render_help_link('needs_unlock', domain_obj.current_registrar)
        );
        progress_indicator = img({ src: "images/icon-no-light.gif" });
      }
    } else if (step_obj.name == 'Disable privacy') {
      if (step_obj.value == 'ok' || step_obj.value == 'skip') {
        details = div({ style: "text-decoration: line-through" }, 'Privacy is disabled for this domain.');
        progress_indicator = img({ src: "images/check.png" });
      } else {
        details = div('You need to disable privacy for this domain at ' + domain_obj.current_registrar + '.',
          render_help_link('needs_unlock', domain_obj.current_registrar)
        );
        progress_indicator = img({ src: "images/icon-no-light.gif" });
      }
    } else if (step_obj.name == 'Enter auth code') {
      if (step_obj.value == 'waiting') {
        details = div("First, you need to unlock the domain and disable privacy.");
      } else if (step_obj.value == 'fetching_auth_code') {
        details = div("Reading auth code from " + domain_obj.current_registrar + ", this may take up to an hour.");
        progress_indicator = img({ src: "images/ajax-loader.gif" });
      } else if (step_obj.value == 'fetch_auth_code_success') {
        details = div("Verifying auth code from " + domain_obj.current_registrar + ", this may take about 5 minutes.");
        progress_indicator = img({ src: "images/ajax-loader.gif" });
      } else if (step_obj.value == 'ok') {
        details = div({ style: "text-decoration: line-through" }, "Auth code verified!");
        progress_indicator = img({ src: "images/check.png" });
      } else {
        details = div(
          (step_obj.value == 'fetched_auth_code_invalid' ? [
            div({ style: "padding: 5px 0px 5px 0px" }, "There was a problem reading the auth code from " + domain_obj.current_registrar + ". You will need to get it manually.",
              render_help_link('enter_auth_code', domain_obj.current_registrar),
              " Once you have the auth code, enter it here and click Submit to request the transfer."
            )
          ] : [
            div({ style: "padding: 5px 0px 5px 0px" }, "In order to proceed, you need the domain auth code from " + domain_obj.current_registrar + ".",
              render_help_link('needs_unlock', domain_obj.current_registrar),
              " Once you have the auth code, enter it here and click Submit to request the transfer."
            )
          ]),
          div({ style: "margin-bottom: 5px" },
            input({ 'class': "fancy", id: 'auth_code', placeholder: 'auth code', value: '' }),
            div({ id: "auth-code-row", style: "float: right; padding-top: 3px; margin-right: 355px" },
              a({ 'class': "myButton", href: curry(retry_transfer, domain_obj.name) }, 'Submit')
            )
          ),
          div({ id: "auth-code-row-veryifying", style: "display: none" },
            div({ style: "font-style: italic" }, "Verifying auth code...")
          )
        );
        progress_indicator = img({ src: "images/icon-no-light.gif" });
      }
    } else if (step_obj.name == 'Approve transfer') {
      if (step_obj.value == 'ok' || step_obj.value == 'transfer_approved') {
        details = div({ style: "text-decoration: line-through" }, 'Transfer completed!');
        progress_indicator = img({ src: "images/check.png" });
      } else if (step_obj.value == 'transfer_rejected') {
        details = div(
          'You attempted to transfer this domain, however, the currently owning registrar, ' + domain_obj.current_registrar + ', rejected it.',
          render_help_link('transfer_rejected', domain_obj.current_registrar)  
        );
        progress_indicator = img({ src: "images/icon-no-light.gif" });
        // bring the retry button out of hiding
        $("#retry-transfer-button").css('display','');
      } else if (step_obj.value == 'pending_remote_approval') {
        details = div("This domain transfer is currently pending approval at " + domain_obj.current_registrar + ". This can take up to an hour.");
        progress_indicator = img({ src: "images/ajax-loader.gif" });
      } else if (step_obj.value == 'remote_approval_success') {
        details = div("Transfer request was approved at " + domain_obj.current_registrar + ". Now, we are transferring the registration to Badger...");
        progress_indicator = img({ src: "images/ajax-loader.gif" });
      } else if (step_obj.value == 'remote_approval_failed') {
        details = div("We were unable to approve the transfer at " + domain_obj.current_registrar + ". You will need to approve it manually", render_help_link('transfer_requested', domain_obj.current_registrar), 
          ". You can also wait 5 days and the transfer request will automatically be approved."
        );
        progress_indicator = img({ src: "images/icon-no-light.gif" });
      } else if (step_obj.value == 'pending_transfer' || step_obj.value == 'ok' || step_obj.value == 'already_pending_transfer') {
        details = div("This domain is currently pending transfer, but you need to approve the request manually through " + domain_obj.current_registrar + ".", render_help_link('transfer_requested', domain_obj.current_registrar),
          (step_obj.value == 'already_pending_transfer' ? "" : " You can also wait 5 days and the transfer request will automatically be approved.")
        );
        progress_indicator = img({ src: "images/icon-no-light.gif" });
      } else {
        details = div("A transfer request will be sent to " + domain_obj.current_registrar + " once all other steps are completed.");
      }
    } else if (step_obj.name == 'Processed') {
      if (step_obj.value == 'pending') {
        details = div({ style: "font-style: italic" }, "Setting up domain...");
        progress_indicator = img({ src: "images/ajax-loader.gif" });
      } else if (step_obj.value == 'ok') {
        details = div({ style: "text-decoration: line-through" }, "Domain has been processed, and is ready to go!");
        progress_indicator = img({ src: "images/check.png" });
      } else {
        details = div("Once the transfer request is approved, we can finish setting up the domain on Badger.");
      }
    } else {
      details = div();
    }
    
    return tr(
      td({ style: "width: 5%" }, div({ id: (step_obj.name == 'Enter auth code' ? 'auth-code-progress-indicator' : null), style: "text-align: center" }, progress_indicator)),
      td({ style: "width: 20%; font-weight: bold" }, step_obj.name),
      td({ style: "width: 75%" }, details)
    );
  });

  define('retry_transfer', function(domain_name, force_transfer_request){
    // if no longer on the page, clear the timeout and return
    if (get_route() != "#domains/" + domain_name) {
      clearTimeout(retry_transfer_timeout);
      return;
    }
    
    force_transfer_request = force_transfer_request ? force_transfer_request : false;
    
    var params = { retry: true, name: domain_name, force_transfer_request: force_transfer_request };

    var auth_code = null;
    if ($('#auth_code').length > 0) {
      auth_code = $('#auth_code').val();
      
      if (auth_code.length > 0) {
        params.auth_code = auth_code;
        
        $("#auth-code-row").hide();
        // $("#auth-code-row-veryifying").css('display', '');
        // $("#auth-code-progress-indicator").html(img({ src: "images/ajax-loader.gif" }))
      }
    }
    
    $("#retry-transfer-button").css('display','none');
    $("#refresh-transfer-steps-loader").css('display','');
    
    Badger.transferDomain(params, function(transfer_response) {
      reload_transfer_steps_data(domain_name, params);
    });
  });
  
  define('update_progress_bar', function(new_percentage) {
    var current_meter_width = parseInt($(".meter > span").css('width'));
    $(".meter > span").css('width', new_percentage.toString() + "%");
    animate_progress_bar(current_meter_width);
    $("#progress-bar-percentage").html(parseInt(new_percentage).toString() + "%");
  });
  
  define('reload_transfer_steps_data', function(domain_name, transfer_params) {
    Badger.getDomain(domain_name, function(domain_response) {
      var domain_obj = domain_response.data;
      
      // if the transfer steps are no longer present, then the transfer succeeded!
      var new_percentage = !domain_obj.transfer_steps ? 100 : parseInt(100 * (domain_obj.transfer_steps.completed.length / domain_obj.transfer_steps.count));
      var old_percentage = parseInt($("td#progress-bar-percentage").html());
      
      if (new_percentage != old_percentage) {
        BadgerCache.flush('domains');
      }
      
      // hide the ajax loader
      $("#refresh-transfer-steps-loader").css('display','none');
      
      // update the progress bar with the current percentage
      update_progress_bar(new_percentage);
      
      // if it completed, set a timeout to reload page, after which the apps should be displayed
      if (new_percentage == 100) setTimeout(curry(on_transfer_complete, domain_name), 1500);
      
      // remove and replace with updated rows
      $("#transfer-steps tr").remove();
      // add the transfer steps, unless it was just completed
      if (domain_obj.transfer_steps) $("#transfer-steps").append(detail_information_rows(domain_obj));
      
      // update the cancel button with the latest domain info
      update_cancel_transfer_button_href(domain_obj);
    });
  });
  
  define('on_transfer_complete', function(domain_name) {
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
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_unlocking_your_domain' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'http://community.badger.com/badger/topics/network_solutions_domain_transfer_unlocking_your_domain_getting_an_auth_code' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'http://community.badger.com/badger/topics/1_1_domain_transfer_unlocking_your_domain' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/enom_domain_transfer_unlocking_your_domain' }, '(?)');
          case 'Gandi SAS':
            return a({ href: 'http://community.badger.com/badger/topics/gandi_domain_transfer_unlocking_your_domain' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center' }, '(?)');
        }
      case 'needs_privacy_disabled':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_disabling_privacy' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'http://community.badger.com/badger/topics/network_solutions_domain_transfer_disabling_privacy' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'http://community.badger.com/badger/topics/1_1_domain_transfer_disabling_privacy' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/enom_domain_transfer_disabling_privacy' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center' }, '(?)');
        }
      case 'needs_auth_code':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_getting_an_auth_code' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'http://community.badger.com/badger/topics/network_solutions_domain_transfer_unlocking_your_domain_getting_an_auth_code' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'http://community.badger.com/badger/topics/1_1_domain_transfer_getting_an_auth_code' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/enom_domain_transfer_getting_an_auth_code' }, '(?)');
          case 'Gandi SAS':
            return a({ href: 'http://community.badger.com/badger/topics/gandi_domain_transfer_getting_an_auth_code' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center' }, '(?)');
        }
      case 'transfer_requested':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'http://community.badger.com/badger/topics/godaddy_domain_transfer_manually_approving_a_transfer' }, '(?)');
          default:
            return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center' }, '(?)');
        }
      default:
        return a({ href: 'http://community.badger.com/badger/products/badger_knowledge_center' }, '(?)');
    }
  });
}
