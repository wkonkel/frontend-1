with (Hasher('DomainShow','DomainApps')) {

  route('#domains/:domain', function(domain) {
    var content_div = div('Loading...');
    render(
      h1({ 'class': 'long-domain-name' }, domain),
      div({ id: 'error-message', 'class': 'error-message hidden' }),
      content_div
    );

    Badger.getDomain(domain, curry(handle_get_domain_response, content_div, domain));
  });

  define('handle_get_domain_response', function(content_div, domain, response, skip_retry) {
    var domain_obj = response.data;

    if (response.meta.status == 'ok') {
      if (!domain_obj.current_registrar) {
        if (domain_obj.can_register) {
          render({ into: content_div },
            "This domain is not currently registered!",br(),br(),
            a({ 'class': 'myButton small', href: curry(Register.show, domain_obj.name) }, 'Register ', domain_obj.name)
          );
        } else {
          render({ into: content_div },
            div("This domain is not currently registered! Unfortunately, we do not support this top level domain quite yet. Check back later!")
            // TODO add some sort of way to watch the domain here. Make these messages way prettier. --- CAB
          );
        }
      } else if (domain_obj.current_registrar == 'Unknown') {
        // if it's "unknown", it was probably just added and we're still loading info for it... try again in 1 second
        var timeout = setTimeout(function() {
          Badger.getDomain(domain_obj.name, curry(handle_get_domain_response, content_div, domain));
        }, 1000);
      } else {
        render({ into: content_div },
          domain_status_description(domain_obj),
          render_all_application_icons(domain_obj)
        );
      }
    } else {
      render({ into: content_div },
        error_message("Oops, we're having a problem finding any information for: " + domain)
      );
    }
    
    // if (response.data.transfer_steps) {
    //   // save the auth code to put it back
    //   if ($("#auth_code").length > 0 && $("#auth_code").val().length > 0) var auth_code = $("#auth_code").val();
    //   
    //   var interval = setInterval(function (e) {
    //     Badger.transferDomain({ retry: true, name: domain_obj.name, auth_code: auth_code }, function(r) {
    //       Badger.getDomain(domain_obj.name, function(response) {
    //         // something went wrong, or the transfer was approved, let's reload the page!
    //         if (!response.data.transfer_steps) {
    //           clearInterval(interval);
    //         }
    // 
    //         $("#transfer-steps tr").slice(1).remove();
    //         $("#transfer-steps").append(
    //           detail_information_rows(response.data)
    //         );
    // 
    //         if (auth_code) {
    //           // give focus back
    //           if (document.activeElement == $("#auth_code")[0]) $("#auth_code").focus();
    // 
    //           // add the value back
    //           $("#auth_code").val(auth_code);
    //         }
    //       });
    //     })
    //   }, 5000);
    // };
    
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

    if (domain_obj.transfer_steps && domain_obj.transfer_steps.count && domain_obj.transfer_steps.completed && domain_obj.transfer_steps.completed.length < domain_obj.transfer_steps.count) {
      return display_transfer_status(domain_obj);
    } else if ((domain_obj.permissions_for_person || []).indexOf('show_private_data') >= 0) {
      return [
        p('This domain is active and will auto-renew for 1 Credit on ', new Date(Date.parse(domain_obj.expires_at)).toDateString(), '.'),
        days <= 30 ? a({ 'class': 'myButton myButton-small', href: curry(Register.renew_domain_modal, domain_obj.name) }, 'Renew') : ''
      ];
    } else if ((domain_obj.permissions_for_person || []).indexOf('linked_account') >=0) {
      return p('This domain is currently registered to your linked account on ' + domain_obj.current_registrar);
    } else {
      return [
        p('This domain is currently registered at ', domain_obj.current_registrar,
          ' and will expire on ', new Date(Date.parse(domain_obj.expires_at)).toDateString(), '.',
          ' If this is your domain, you can ',
          a({ href: curry(Transfer.transfer_domains_form, domain_obj.name) }, 'transfer to Badger'), '.'
        )
      ];
    }
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
    
    return detail_information_rows_array;
  });

  define('display_transfer_status', function(domain_obj) {
    var step_percentage = parseInt(100 * (domain_obj.transfer_steps.completed.length / domain_obj.transfer_steps.count));

    return [
      div({ id: "transfer-progress-report", 'class': "info-message", style: "padding: 10px" },
        div({ id: "progress-bar", style: "margin: -10px auto 15px auto" },
          table( tbody(
            tr(
              td({ style: "width: 25%" }, h2("Transfer Progress")),
              td({ style: "width: 10%; text-align: center; font-weight: bold; font-size: 20px", id: "progress-bar-percentage" }, step_percentage + "%"),
              td({ style: "width: 50%" }, div({ 'class': "meter green nostripes" }, span({ style: "width: " + step_percentage + "%" })))
            )
          ))
        ),

        div({ style: "margin-bottom: 40px" },
          table({ 'class': "fancy-table", id: "transfer-steps" }, tbody(
            detail_information_rows(domain_obj)
          ))
        ),
        
        div({ style: "float: right; margin-top: -30px" },
          // a({ 'class': 'myButton', style: "margin-right: 10px", href: null }, 'Cancel'),
          a({ id: "refresh-transfer-steps-button", 'class': 'myButton' , href: curry(retry_transfer, domain_obj.name, $('#auth_code') ? { auth_code: $('#auth_code').val() } : {}) },
            (domain_obj.transfer_steps.pending && domain_obj.transfer_steps.pending.length > 0 && domain_obj.transfer_steps.pending[0].value == 'transfer_rejected') ? 'Retry' : 'Refresh'
          ),
          div({ id: "refresh-transfer-steps-loader", style: "display: none" }, img({ src: "images/ajax-loader.gif" }))
        )
      ),
    ];
  });

  define('transfer_description_row', function(domain_obj, step_obj) {
    switch (step_obj.name) {
    case 'Initiate transfer':
      details = div('Initiate the domain transfer on Badger.com');
      break;
    case 'Unlock domain':
      if (step_obj.value == 'pending')
        details = div('This domain is currently being unlocked at ' + domain_obj.current_registrar  + '. This should take a couple minutes.');
      else if (step_obj.value == 'ok')
        details = div('This domain has been unlocked.')
      else
        details = div('You need to unlock this domain at ' + domain_obj.current_registrar + '.',
          render_help_link('needs_unlock', domain_obj.current_registrar));
      break;
    case 'Disable privacy':
      if (step_obj.value == 'ok' || step_obj.value == 'skip')
        details = div('Privacy is disabled for this domain')
      else
        details = div('You need to disable privacy for this domain at ' + domain_obj.current_registrar + '.',
          render_help_link('needs_unlock', domain_obj.current_registrar));
      break;
    case 'Enter auth code':
      details = [
        div({ id: "auth-code-row" },
          span(input({ id: 'auth_code', placeholder: 'authcode', value: step_obj.value || '' }), a({ 'class': "myButton small", style: "padding-left: 10px", href: curry(retry_transfer, domain_obj.name) }, 'Submit'))
        ),
        div({ id: "auth-code-row-veryifying", style: "display: none" },
          div({ style: "font-style: italic" }, "Verifying auth code...")
        )
      ];
      break;
    case 'Approve transfer':
      if (step_obj.value == 'ok') {
        details = div({ style: "text-decoration: line-through" }, 'Transfer completed!');
      // } else if (step_obj.value == 'needs_transfer_request') {
      //   details = div('This domain is currently pending transfer and needs a transfer request.',
      //                 render_help_link('needs_privacy_disabled', domain_obj.current_registrar));
      } else if (step_obj.value == 'transfer_rejected') {
        details = div(
          div(
            'You attempted to transfer this domain, however, the currently owning registrar, ' + domain_obj.current_registrar + ', rejected it.',
            render_help_link('transfer_rejected', domain_obj.current_registrar)  
          )
        );
        $("#refresh-transfer-steps-button").html("Retry");
      } else if (step_obj.name == 'pending_remote_approval') {
        details = div("This domain transfer is currently pending approval at " + domain_obj.current_registrar + ". This should take a couple minutes.");
      } else if (step_obj.value == 'pending_transfer' || step_obj.value == 'ok') {
        details = div('This domain is currently pending transfer. You will need to approve this transfer manually at your current registrar. Or you can wait 5 days and the transfer will automatically go through.',
            render_help_link('transfer_requested', domain_obj.current_registrar));
      } else {
        details = div('You need to complete the steps above first.');
      }
      break;
    case 'Processed':
      details = div("Once the transfer request is approved, we can finish setting up the domain on Badger.com");
      break;
    default:
      details = div();
    }
    
    var step_completed     = (step_obj.value == 'ok' || step_obj.value == 'skip');
    var step_pending       = (step_obj.value == 'pending');
    var step_failed        = (step_obj.value == 'failed' || step_obj.value == null || step_obj.value == undefined);
    
    var progress_indicator;
    
    if (step_completed) {
      progress_indicator = img({ src: "images/check.png" });
      $(details).css('text-decoration', 'line-through');
      if (step_obj.name == 'Enter auth code') details = div({ style: "text-decoration: line-through" }, "Auth code verified")
    } else if (step_pending) {
      progress_indicator = img({ src: "images/ajax-loader.gif" });
    } else {
      progress_indicator = img({ src: "images/icon-no-light.gif" });
    }
    
    return tr(
      td({ style: "width: 5%" }, div({ id: (step_obj.name == 'Enter auth code' ? 'auth-code-progress-indicator' : null), style: "text-align: center" }, progress_indicator)),
      td({ style: "width: 20%; font-weight: bold" }, step_obj.name),
      td({ style: "width: 75%" }, details)
    );
  });

  define('retry_transfer', function(domain_name){
    var params = { retry: true, name: domain_name };
    var auth_code = null;
    if ($('#auth_code').length > 0) {
      auth_code = $('#auth_code').val();
      params.auth_code = auth_code;
      
      $("#auth-code-row").hide();
      $("#auth-code-row-veryifying").css('display', '');
      $("#auth-code-progress-indicator").html(img({ src: "images/ajax-loader.gif" }))
    }
    
    $("#refresh-transfer-steps-button").css('display','none');
    $("#refresh-transfer-steps-loader").css('display','');
    
    Badger.transferDomain(params, function(transfer_response) {
      reload_transfer_steps_data(domain_name);
    });
  });
  
  define('update_progress_bar', function(new_percentage) {
    var current_meter_width = parseInt($(".meter > span").css('width'));
    $(".meter > span").css('width', new_percentage.toString() + "%");
    animate_progress_bar(current_meter_width);
    $("#progress-bar-percentage").html(parseInt(new_percentage).toString() + "%");
  });
  
  define('reload_transfer_steps_data', function(domain_name) {
    Badger.getDomain(domain_name, function(domain_response) {
      var domain_obj = domain_response.data;
      
      // bring the transfer button back
      $("#refresh-transfer-steps-button").css('display','');
      $("#refresh-transfer-steps-loader").css('display','none');
      
      var new_percentage = parseInt(100 * (domain_obj.transfer_steps.completed.length / domain_obj.transfer_steps.count));
      
      // update the progress bar with the current percentage
      update_progress_bar(new_percentage);
      
      // if it completed, set a timeout to reload page, after which the apps should be displayed
      if (new_percentage == 100) {
        $("#refresh-transfer-steps-button").css('display','none');
        setTimeout(curry(set_route, '#domains/' + domain_name), 1500);
      }
      
      // remove and replace with new rows
      $("#transfer-steps tr").remove();
      $("#transfer-steps").append(
        detail_information_rows(domain_response.data)
      );
      
      var auth_code = $("#auth_code").val();
      if (auth_code && auth_code.length > 0) {
        // give focus back
        if (document.activeElement == $("#auth_code")[0]) $("#auth_code").focus();
        // add the value back
        $("#auth_code").val(auth_code);
      }
    });
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
        if (target.childNodes.length % 7 == 6) target.appendChild(div({ style: 'clear: left ' }));
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
            return a({ href: 'https://www.badger.com/#knowledge_center/3-Unlocking-Your-GoDaddy-Domain' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'https://www.badger.com/#knowledge_center/23-Unlocking-&-Getting-an-Auth-Code-from-Network-Solutions' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'https://www.badger.com/#knowledge_center/15-Unlocking-Your-1&1-Domain' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'https://www.badger.com/#knowledge_center/29-Unlocking-Your-Enom-Central-Domain' }, '(?)');
          case 'Gandi SAS':
            return a({ href: 'https://www.badger.com/#knowledge_center/37-Unlocking-Your-Gandi-Domain' }, '(?)');
          default:
            return a({ href: 'https://www.badger.com/#knowledge_center' }, '(?)');
        }
      case 'needs_privacy_disabled':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'https://www.badger.com/#knowledge_center/5-Disabling-Privacy-on-GoDaddy' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'https://www.badger.com/#knowledge_center/25-Disabling-Privacy-on-Network-Solutions' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'https://www.badger.com/#knowledge_center/17-Disabling-Privacy-on-1&1' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'https://www.badger.com/#knowledge_center/31-Disabling-Privacy-on-Enom-Central' }, '(?)');
          default:
            return a({ href: 'https://www.badger.com/#knowledge_center' }, '(?)');
        }
      case 'needs_auth_code':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'https://www.badger.com/#knowledge_center/7-Getting-an-Auth-Code-from-GoDaddy' }, '(?)');
          case 'Network Solutions, LLC':
            return a({ href: 'https://www.badger.com/#knowledge_center/23-Unlocking-&-Getting-an-Auth-Code-from-Network-Solutions' }, '(?)');
          case '1 & 1 INTERNET AG':
            return a({ href: 'https://www.badger.com/#knowledge_center/19-Getting-an-Auth-Code-from-1&1' }, '(?)');
          case 'Enom, Inc.':
            return a({ href: 'https://www.badger.com/#knowledge_center/33-Getting-an-Auth-Code-from-Enom-Central' }, '(?)');
          case 'Gandi SAS':
            return a({ href: 'Getting an Auth Code from Gandi' }, '(?)');
          default:
            return a({ href: 'https://www.badger.com/#knowledge_center' }, '(?)');
        }
      case 'transfer_requested':
        switch (registrar) {
          case 'GoDaddy Inc.':
            return a({ href: 'https://www.badger.com/#knowledge_center/9-Manually-Approving-a-Transfer-on-GoDaddy' }, '(?)');
          default:
            return a({ href: 'https://www.badger.com/#knowledge_center' }, '(?)');
        }
      default:
        return a({ href: 'https://www.badger.com/#knowledge_center' }, '(?)');
    }
  });
}
