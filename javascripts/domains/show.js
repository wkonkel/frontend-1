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
      if (!skip_retry) {
        handle_get_domain_response(content_div, domain, response, true);
      } else {
        render({ into: content_div },
          error_message("Oops, we're having a problem finding any information for: " + domain)
        );
      }
    }
  });

  define('domain_status_description', function(domain_obj) {
    var current_date = new Date();
    var expire_date = new Date(Date.parse(domain_obj.expires_at));
    var days = parseInt(expire_date - current_date)/(24*3600*1000);
    if ((domain_obj.permissions_for_person || []).indexOf('show_private_data') >= 0) {
      return [
        p('This domain is active and will auto-renew for 1 Credit on ', new Date(Date.parse(domain_obj.expires_at)).toDateString(), '.'),
        days <= 30 ? a({ 'class': 'myButton myButton-small', href: curry(Register.renew_domain_modal, domain_obj.name) }, 'Renew') : ''
      ];
    } else if ((domain_obj.permissions_for_person || []).indexOf('pending_transfer') >=0) {
      return display_transfer_status(domain_obj);
    } else if ((domain_obj.permissions_for_person || []).indexOf('linked_account') >=0) {
      return p('This domain is currently registered to your linked account on ' + domain_obj.current_registrar);
    } else {
      return p('This domain is currently registered at ', domain_obj.current_registrar,
               ' and will expire on ', new Date(Date.parse(domain_obj.expires_at)).toDateString(), '.',
               ' If this is your domain, you can ',
               a({ href: curry(Transfer.transfer_domains_form, domain_obj.name) }, 'transfer to Badger'), '.');
    }
  });

  define('display_transfer_status', function(domain_obj) {
    var count = 0;
    var step_percentage = 100/(domain_obj.steps_completed.length + domain_obj.steps_pending.length);

    var process_bar = [];
    var detail_information = [];
    for (var step_name in domain_obj.steps_completed) {
      count++;
      process_bar.push(td({ style: 'background-color: #669933; text-align: center; color: white; width: ' + step_percentage + '%;' }, step_percentage * count + '%'))
      detail_information.push(render_transfer_description(domain_obj, domain_obj.steps_completed[step_name][0], domain_obj.steps_completed[step_name][1], step_percentage))
    }

    for (var step_name in domain_obj.steps_pending) {
      count++;
      process_bar.push(td({ style: 'background-color: #ddddee; text-align: center; width: ' + step_percentage + '%;' }, step_percentage * count + '%'))
      detail_information.push(render_transfer_description(domain_obj, domain_obj.steps_pending[step_name][0], domain_obj.steps_pending[step_name][1], step_percentage))
    }

    return [
      table({ style: 'width: 100%; border-spacing: 0;' }, tbody(
        tr(
          process_bar
        ),
        tr(
          detail_information
        )
      )),
      br(),
      a({ 'class': 'myButton myButton-small', href: curry(retry_transfer, domain_obj.name, $('#auth_code') ? { auth_code: $('#auth_code').val() } : {}) }, 'Retry')
    ];
  });

  define('render_transfer_description', function(domain_obj, step_name, value, step_percentage) {
    var title = div(step_name);
    var details = div();
    if(value == 'ok') {
      details = div('Done')
    } else {
      switch (step_name) {
      case 'Initiate transfer':
        details = div('Instruction to Initiate Transfer');
        break;
      case 'Unlock domain':
        if (value == 'remote_unlocking')
          details = div('This domain is currently being unlocked at ' + domain_obj.current_registrar  + '. This should take a couple minutes.');
        else
          details = div('Instruction to Unlock Domain');
        break;
      case 'Disable privacy':
        details = div('Instruction to Disable privacy');
        break;
      case 'Enter auth code':
        details = input({ id: 'auth_code', placeholder: 'authcode' });
        break;
      case 'Approve transfer':
        if (value == 'needs_transfer_request') {
          details = div('This domain is currently pending transfer and need a transfer request.',
                        render_help_link('', domain_obj.current_registrar));
        } else if (value == 'transfer_requested') {
          details = div('This domain is currently pending transfer. You will need to approve this transfer manually at your current registrar. Or you can wait 5 days and the transfer will automatically go through.',
              render_help_link('transfer_requested', domain_obj.current_registrar));
        } else if (value == 'transfer_rejected') {
          details = div('You attempted to transfer this domain, however, the currently owning registrar, ' + domain_obj.current_registrar + ', rejected it.',
              render_help_link('transfer_rejected', domain_obj.current_registrar));
        } else {
          details = div('Instruction to Approve transfer');
        }
        break;
      }
    }
    var step_detail = div({ style: 'height: 100px; margin: 3px; padding: 2px;', 'class': 'info-message' }, title, details)
    return td({ style: 'text-align: center; width: ' + step_percentage + '%;' }, step_detail)
  });

  define('retry_transfer', function(domain_name){
    var params = { retry: true, name: domain_name };
    var auth_code = null;
    if ($('#auth_code')) {
      auth_code = $('#auth_code').val();
      params.auth_code = auth_code;
    }
    Badger.transferDomain(params, function(response) {
      set_route(get_route());
      if (auth_code && (response.data.transfer_status.steps_completed.indexOf('Enter auth code') == -1)) {
        $('#error-message').html('Invalid AuthCode');
        $('#error-message').removeClass('hidden');
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
