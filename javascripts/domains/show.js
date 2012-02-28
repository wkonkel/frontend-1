with (Hasher('DomainShow','DomainApps')) {

  route('#domains/:domain', function(domain) {
    var content_div = div('Loading...');
    render(
      h1({ 'class': 'long-domain-name' }, domain),
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
      switch (domain_obj.transfer_status)
      {
        case 'needs_unlock':
          return [
            p('This domain is currently pending transfer. To continue, please unlock this domain.',
              render_help_link('needs_unlock', domain_obj.current_registrar)),
            a({ 'class': 'myButton myButton-small', href: curry(retry_transfer, domain_obj.name) }, 'Retry')
          ];
        case 'needs_privacy_disabled':
          return [
            p('This domain is currently pending transfer. To continue, please disable this domain privacy.',
              render_help_link('needs_privacy_disabled', domain_obj.current_registrar)),
            a({ 'class': 'myButton myButton-small', href: curry(retry_transfer, domain_obj.name) }, 'Retry')
          ];
        case 'needs_auth_code':
          return [
            p('This domain is currently pending transfer. To continue, please input the authcode here.',
              render_help_link('needs_auth_code', domain_obj.current_registrar)),
            form({ action: curry(retry_transfer, domain_obj.name) },
              input({ name: 'auth_code', placeholder: 'authcode' }),
              input({ 'class': 'myButton myButton-small', type: 'submit', value: 'Retry' })
            )
          ];
        case 'needs_transfer_request':
          return [
            p('This domain is currently pending transfer and need a transfer request.',
              render_help_link('', domain_obj.current_registrar)),
            a({ 'class': 'myButton myButton-small', href: curry(retry_transfer, domain_obj.name) }, 'Retry')
          ];
        case 'transfer_requested':
          return [
            p('This domain is currently pending transfer. You will need to approve this transfer manually at your current registrar. Or you can wait 5 days and the transfer will automatically go through.',
              render_help_link('transfer_requested', domain_obj.current_registrar)),
            a({ 'class': 'myButton myButton-small', href: curry(retry_transfer, domain_obj.name) }, 'Retry')
          ];
        case 'transfer_rejected':
          return [
            p('You attempted to transfer this domain, however, the currently owning registrar, ' + domain_obj.current_registrar + ', rejected it.',
              render_help_link('transfer_requested', domain_obj.current_registrar)),
            a({ 'class': 'myButton myButton-small', href: curry(retry_transfer, domain_obj.name) }, 'Resubmit Transfer Request')
          ];
      }
    } else if ((domain_obj.permissions_for_person || []).indexOf('linked_account') >=0) {
      return p('This domain is currently registered to your linked account on ' + domain_obj.current_registrar);
    } else {
      return p('This domain is currently registered at ', domain_obj.current_registrar,
               ' and will expire on ', new Date(Date.parse(domain_obj.expires_at)).toDateString(), '.',
               ' If this is your domain, you can ',
               a({ href: curry(Transfer.transfer_domains_form, domain_obj.name) }, 'transfer to Badger'), '.');
    }
  });

  define('retry_transfer', function(domain_name, form_data){
    var params = { retry: true, name: domain_name };
    if (form_data) {
      params.auth_code = form_data.auth_code;
    }
    Badger.transferDomain(params, function(response) {
      if (form_data && form_data.auth_code && (response.data.transfer_status == 'needs_auth_code')) {
        alert('Invalid AuthCode');
      }
      set_route(get_route());
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
