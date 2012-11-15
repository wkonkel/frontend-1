Hasher.__initializers.unshift(function() { if (Badger.demo_mode) load_badger_demo(); });

function load_badger_demo() {
  with (Hasher('Demo','Application')) {
    initializer(function() {
      $('html').addClass('demo');
      document.body.appendChild(div({ style: 'height: 100px'} ));
      document.body.appendChild(
        div({ 'id': 'demo-banner' },
          div({ 'style':'width: 950px; margin: 0 auto' },
              span({'style':'font-size: 30px; font-family: AdelleBold, Titillium;  margin-bottom: 10px;'}, 'This is a Demo'),
              a({ style:'float: right; margin-top: 15px', href:'https://www.badger.com/#domains', 'class':'myButton'}, "Take me to the real thing!"), br(),
              "You're logged in with a demo account.", br(), "You can search, register, and set up your domains!"
          )
        )
      );
      
      setTimeout(replace_contact_us, 500);
    });
    
    define('replace_contact_us', function() {
      var contact_us_element = $('#footer a[href=#contact_us]');
      contact_us_element.empty().before(a({ href: 'https://www.badger.com/#contact_us', target: '_blank' }, 'Contact Us'));
    })

    /*
      Override set_route to show 'not supported' page on certain routes
    */
    var real_set_route = Hasher.instance['set_route']
    Hasher.instance['set_route'] = function(path, options) {
      var valid_route = false;
      for (var i = 0; i < (DemoData.available_routes||[]).length; i++) {
        if (path.match(DemoData.available_routes[i])) {
          valid_route = true;
          break;
        }
      }
      
      if (valid_route) {
        real_set_route(path, options);
      } else {
        render_not_supported_modal();
      }
    };

    define('render_not_supported_modal', function(reason) {
      return show_modal(
        div({ style: 'text-align: center' },
          h1({ style: 'border: 0px' }, 'Not Supported in Demo'),
          p({ style: 'font-size: 16px' }, reason || ''),
          div({ style: 'margin: 30px' }, img({ style: 'width: 30%', src: 'images/badger-logo-sad-big.png' })),
          a({ 'class': 'myButton large', style: 'margin: 10px', onclick: function() { window.location = 'https://www.badger.com/#domains' } }, "I'm ready for the real thing!")
        )
      );
    });
    
    var deduct_or_add_credits_for_demo = function(num_credits) {
      if (DemoData.account.domain_credits >= num_credits) {
        DemoData.account.domain_credits -= num_credits;
        update_credits();
        return true;
      } else {
        var add_credits_and_reload = function(form_data) {
          DemoData.account.domain_credits += 10;
          hide_modal();
          update_credits();
          set_route(get_route());
        };
        
        show_modal(
          h1("You Need More Credits!"),
          
          div({ style: 'text-align: center' },
            div({ style: 'margin: 30px' }, img({ style: 'width: 30%', src: 'images/badger-logo-sad-big.png' })),
            p("Good thing this is just a demo! Go ahead and add some more credits for free! You need credits to register, transfer, and renew domains."),
            a({ 'class': 'myButton large', href: add_credits_and_reload }, 'Add 10 More Credits!')
          )
        );
        return false;
      }
    };
    
    // Kill Badger.api, but keep a reference to it around
    var real_api = Badger.api;
    Badger.api = function() { 
      console.log(arguments);
    }
    Badger.domainSearch = function(query, use_serial, callback) {
      Badger.__search_serial_next = (Badger.__search_serial_next || 1) + 1;
      Badger.__search_serial_last = (Badger.__search_serial_last || 0);

      real_api("/domains/search", 'POST', { query: query, serial: Badger.__search_serial_next }, function(results) {
        if (!use_serial || parseInt(results.data.serial) > Badger.__search_serial_last) {
          Badger.__search_serial_last = parseInt(results.data.serial);
          callback(results);
        }      
      });
    };
    
    var mock_api_callback = function(options, callback) {
      setTimeout(function() {
        callback({
          meta: { status: options.status || 'ok' },
          data: options.data || {}
        });
      }, 100);
    };

    Badger.getAccessToken = function() { return '0.example'; };
    Badger.accountInfo = function(callback) { mock_api_callback({ data: DemoData.account }, callback); };
    Badger.getAccountInfo = Badger.accountInfo;
    // Badger.logout = function(callback) { window.location = 'https://www.badger.com' }

    // override the window.name based session storage.
    Session = {};
    
    /*
      If domain not stored in DemoData, return json for an available domain
    */
    Badger.getDomains = function(callback) { mock_api_callback({ data: DemoData.find('domain', 'all') }, callback) };
    
    Badger.getDomain = function(domain, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0];
      
      // special case for transfer page. the fetched domain
      // should just have a registrar, unless it's already
      // stored in DemoData
      if (get_route().match(/\/transfer$/)) {
        if (domain_obj) {
          mock_api_callback({ data: domain_obj }, callback);
        } else {
          mock_api_callback({ data: create_transfer_domain({ name: domain }) }, callback);
        }
      } else if (domain_obj) {
        // find dns records on each getDomain request
        domain_obj.dns = DemoData.find('record', { domain_id: domain_obj.id });
        
        mock_api_callback({ data: domain_obj }, callback);
      } else {
        mock_api_callback({ data: available_domain(domain) }, callback);
      }
    };
    
    Badger.updateDomain = function(domain, attrs, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0];
      
      // turn name servers into array
      if (attrs.name_servers && !attrs.name_servers.push) attrs.name_servers = attrs.name_servers.split(',');
      
      // if not using badger nameservers, disallow modifcation of DNS
      var permissions = domain_obj.permissions_for_person;
      var index_of_modify_dns = permissions.indexOf('modify_dns');
      
      if ((attrs.name_servers || []).equal_to(['ns1.badger.com', 'ns2.badger.com'])) {
        if (index_of_modify_dns < 0) {
          permissions.push('modify_dns');
        }
      } else {
        permissions = domain_obj.permissions_for_person;
        index_of_modify_dns = permissions.indexOf('modify_dns');
        if (index_of_modify_dns >= 0) {
          permissions.splice(index_of_modify_dns,1);
        }
      }
      attrs.permissions_for_person = permissions;
      
      // perform updates
      DemoData.update_attributes(domain_obj, attrs)
      if (attrs.privacy) {
        if (typeof(attrs.privacy) == 'string') attrs.privacy = !!(attrs.privacy == 'true');
        domain_obj.whois.privacy = attrs.privacy;
        
        // rebuild whois
        domain_obj.whois.raw = raw_whois_for_domain(domain_obj);
      }
      
      mock_api_callback({ status: 'ok', data: domain_obj }, callback);
    };
    
    /*
      Set some timeouts to complete transfer steps
    */
    Badger.transferDomain = function(data, callback) {
      var domain_obj = DemoData.find('domain', { name: data.name })[0];
      
      // update the local domain with the options on transfer initiation
      // (auto_renew, import_dns, privacy, registrant_contact_id)
      DemoData.update_attributes(domain_obj, data);
      
      // add transfer statuses
      domain_obj.transfer_in = {
        unlock_domain: 'needed',
        disable_privacy: 'needed',
        enter_auth_code: null,
        approve_transfer: 'unknown',
        can_cancel_transfer: true
      }
      
      domain_obj.permissions_for_person = ['pending_transfer'];
      mock_api_callback({ status: 'created', data: domain_obj }, callback);
      set_route('#domains/' + data.name);
      
      // add transfer statuses
      setTimeout(function() { domain_obj.transfer_in.unlock_domain = 'ok'  }, 1000);
      setTimeout(function() { domain_obj.transfer_in.disable_privacy = 'ok'; domain_obj.transfer_in.enter_auth_code = 'needed' }, 6000);
      
      show_modal(
        h1('Demo Transfer'),
        p("For the sake of demonstration, this transfer works a bit differently than normal."),
        ul(
          li("The ", b("Unlock domain"), " and ", b("Disable privacy"), " steps will complete automatically."),
          li("On the ", b("Validate auth code"), " step, enter anything and submit to continue."),
          li("The rest of the steps will complete automatically.")
        ),
        div({ style: 'text-align: center' }, a({ 'class': 'myButton large', href: hide_modal }, 'Okay, awesome!'))
      );
    };
    
    Badger.tryAuthCodeForTransfer = function(domain, auth_code, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0];
      domain_obj.transfer_in.enter_auth_code = 'ok';
      domain_obj.transfer_in.approve_transfer = 'needed';
      
      mock_api_callback({ status: 'ok', data: domain_obj }, callback);
      
      setTimeout(function() { domain_obj.transfer_in.approve_transfer = 'ok' }, 1000);
      
      var after_transfer_complete = function() {
        var old_domain_obj = DemoData.destroy(domain_obj);
        create_domain({ 
          name: domain,
          previous_registrar: old_domain_obj.current_registrar,
          registrant_contact: DemoData.find('contact', { id: 1 })[0]
        });
      };
      
      // to complete transfer, remove transfer_in from domain json
      setTimeout(after_transfer_complete, 6000);
    };
    
    /*
      Mock domain name registration. Create a fake delay to make it less scary
    */
    Badger.registerDomain = function(data, callback) {
      if (deduct_or_add_credits_for_demo(data.years)) {
        mock_api_callback({ status: 'created' }, callback);
        create_domain({
          name: data.name,
          registrant_contact: DemoData.find('contact', { id: 1 })[0]
        });
        set_route('#domains/' + data.name);
      }
    };
    
    /*
      Add the DNS record to the domain found by name
    */
    Badger.addRecord = function(name, data, callback) {
      var domain_obj = DemoData.find('domain', { name: name })[0];
      
      if (domain_obj) {
        if (data.subdomain) data.subdomain = data.subdomain + '.' + name;
        domain_obj.dns.push(create_dns_record(domain_obj, data));
        return mock_api_callback({ status: 'ok' }, callback);
      }
    };
    
    Badger.deleteRecord = function(name, id, callback) {
      var domain_obj = DemoData.find('domain', { name: name })[0],
          dns_record_obj = DemoData.find('record', { id: id })[0];
          
      if (dns_record_obj && domain_obj) {
        DemoData.destroy(dns_record_obj);
        mock_api_callback({ status: 'ok' }, callback);
      }
    };
    
    Badger.updateRecord = function(name, id, data, callback) {
      var domain_obj = DemoData.find('domain', { name: name })[0],
          dns_record_obj = DemoData.find('record', { id: id })[0];
          
      if (dns_record_obj && domain_obj) {
        DemoData.update_attributes(dns_record_obj, data);
        return mock_api_callback({ status: 'ok' }, callback);
      }
    };
    
    /*
      Linked accounts
    */
    Badger.getLinkedAccounts = function(callback) { mock_api_callback({ data: DemoData.find('linked_account', 'all') }, callback) }
    
    Badger.createLinkedAccount = function(data, callback) {
      var linked_account_obj = create_linked_account({
        login: data.login,
        site: data.site
      });
      
      return mock_api_callback({ data: linked_account_obj, status: 'ok' }, callback);
    };
    
    Badger.getLinkedAccount = function(id, callback) {
      var linked_account_obj = DemoData.find('linked_account', { id: parseInt(id) })[0];
      return mock_api_callback({ data: linked_account_obj, status: 'ok' }, callback);
    };
    
    Badger.deleteLinkedAccount = function(id, callback) {
      var linked_account_obj = DemoData.find('linked_account', { id: parseInt(id) })[0];
      
      if (linked_account_obj) {
        linked_account_obj._linked_domains.forEach(function(d) { DemoData.destroy(d) });
        DemoData.destroy(linked_account_obj);
        return mock_api_callback({ status: 'ok' }, callback);
      }
    };
    
    /*
      Invites
    */
    Badger.getInviteStatus = function(callback) { mock_api_callback({ data: DemoData.find('invite', 'all') }, callback) };
    
    Badger.sendInvite = function(data, callback) {
      // var invite_obj = create_invite(data);
      return mock_api_callback({ status: 'ok' }, callback);
    };
    
    /*
      Account update
    */
    Badger.updateAccount = function(data, callback) {
      //override name
      // data.name = (data.first_name + ' ' + data.last_name).trim();
      // var updated_account_obj = DemoData.update_attributes(DemoData.account, data);
      
      if (data.first_name) DemoData.account.first_name = data.first_name;
      if (data.last_name) DemoData.account.first_name = data.last_name;
      if (data.email) DemoData.account.email = data.email;
      // update name if changed
      if (data.first_name || data.last_name) DemoData.account.name = (data.first_name + ' ' + data.last_name).trim();
      
      return mock_api_callback({ status: 'ok' }, callback);
      
      setTimeout(function() { set_route(get_route()); }, 200);
    };
    
    /*
      Web and email forwards
    */
    Badger.getWebForwards = function(domain, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0];
      mock_api_callback({ status: 'ok', data: DemoData.find('web_forward', { domain_id: domain_obj.id }) }, callback);
    };
    Badger.createWebForward = function(domain, data, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0];
      mock_api_callback({ status: 'ok', data: create_web_forward(domain_obj, data) }, callback);
    };
    Badger.deleteWebForward = function(domain, id, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0],
          web_forward_obj = DemoData.find('web_forward', { id: id })[0];
      DemoData.destroy(web_forward_obj);
      mock_api_callback({ status: 'ok' }, callback);
    };
    
    Badger.getEmailForwards = function(domain, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0];
      mock_api_callback({ status: 'ok', data: DemoData.find('email_forward', { domain_id: domain_obj.id }) }, callback);
    };
    Badger.createEmailForward = function(domain, data, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0];
      mock_api_callback({ status: 'ok', data: create_email_forward(domain_obj, data) }, callback);
    };
    Badger.deleteEmailForward = function(domain, id, callback) {
      var domain_obj = DemoData.find('domain', { name: domain })[0],
          email_forward_obj = DemoData.find('email_forward', { id: id })[0];
      DemoData.destroy(email_forward_obj);
      mock_api_callback({ status: 'ok' }, callback);
    };
    
    Badger.getContacts = function(callback) { mock_api_callback({ data: DemoData.find('contact', 'all') }, callback); };
    Badger.getPaymentMethods = function(callback) { mock_api_callback({ data: DemoData.payment_method }, callback) };
    Badger.createContact = function(callback) { render_not_supported_modal('Creating new contacts is not supported in the demo.') };
    Badger.getCreditHistory = function(callback) { mock_api_callback({ data: [] }, callback) };

    
    /*
      Kill BadgerCache, and replace it with the mocked out Badger api
    */
    Badger.flush = function() {};
    Badger.reload = function() {};
    Badger.load = function() {};
    BadgerCache = Badger;
  }






  /*
    Temporary client-side storage of demo data
  */
  window.DemoData = {
    available_routes: [
      /^#$/,
      /^#welcome$/,
      /^#search$/,
      /^#domain/,
      /^#account(\/\w+)?$/,
      /^#invites/,
      /^#linked_accounts/,
      /^#about$/,
      /^#cart$/
    ],

    account: {
      id: 1,
      first_name: "Badger",
      last_name: "Demo",
      name: "Badger Demo",
      email: "support@badger.com",
      domain_credits: 4,
      invites_available: 1044,
      confirmed_email: true,
      hide_share_messages: false
    },

    payment_method: {
      id: 1,
      name: 'Badger Banking (4111********1111 12/21)'
    },

    tables: {
      contact: [],
      domain: [],
      record: [],
      linked_account: [],
      invite: [],
      web_forward: [],
      email_forward: []
    }
  };

  DemoData.add_row = function(key, object) {
    object.id = DemoData.tables[key].length + 1;
    object._table_name = key; // keep a reference to the table name on the object
    DemoData.tables[key].push(object);
    
    // reload the fake cache
    if (key == 'contact') {
      BadgerCache.cached_contacts = { data: DemoData.tables.contact };
    }
  };
  
  /*
    Search the cache, like a database query
  */
  DemoData.find = function(table, conditions) {
    if (conditions == 'all') return DemoData.tables[table];
    var results = [];
    for (var i = 0; i < DemoData.tables[table].length; i++) {
      var is_match = true;
      for (k in conditions) {
        if (DemoData.tables[table][i][k] != conditions[k]) {
          is_match = false;
          break;
        }
      }
      if (is_match) results.push(DemoData.tables[table][i]);
    }
    return results;
  };

  /*
    Simulate updating a db object
  */
  DemoData.update_attributes = function(obj, updates) {
    for (k in obj) {
      if (updates[k]) {
        // fix booleans
        if (updates[k] === 'true') updates[k] = true;
        if (updates[k] === 'false') updates[k] = false;
        
        // if it's a model id, load that model
        var table_match = k.match(/^(\w+|_+)_id$/) || [];
        if (table_match[1]) updates[k] = DemoData.find(obj._table_name, { id: parseInt(table_match[1]) });
        
        obj[k] = updates[k];
      }
    }
    return obj;
  };
  
  /*
    Destroy an object, removing it from its table array.
  */
  DemoData.destroy = function(obj) {
    var index_of_obj = -1;
    for (var i = 0; i < DemoData.tables[obj._table_name].length; i++) {
      if (obj.id == DemoData.tables[obj._table_name][i].id) {
        index_of_obj = i;
        break;
      }
    }
    if (index_of_obj >= 0) {
      DemoData.tables[obj._table_name].splice(index_of_obj,1);
      // DemoData.tables[obj._table_name] = DemoData.tables[obj._table_name].compact();
      return obj;
    }
    return false;
  };
  
  /*
    Builders
  */
  var create_contact = function(attrs) {
    attrs = attrs || {};

    var defaults = {
      id: DemoData.tables.contact.length + 1,
      first_name: "John",
      last_name: "Doe",
      organization: null,
      address: "720 Market St., Suite 300",
      address2: null,
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "US",
      phone: "415-787-5050",
      email: "warren@rhinonames.com",
      fax: null,
      needs_update: false
    };

    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];
    DemoData.add_row('contact', defaults);
    return defaults;
  }

  var create_domain = function(attrs) {
    attrs = attrs || {};

    var defaults = {
      id: DemoData.tables.domain.length + 1,
      name: "example.com",
      supported_tld: true,
      permissions_for_person: ["show_private_data","modify_contacts","renew","transfer_out","change_nameservers","modify_dns"],
      name_servers: ['ns1.badger.com', 'ns2.badger.com'],
      registry_statuses:"clienttransferprohibited",
      current_registrar:"Badger",
      previous_registrar: null,
      expires_at:"2013-04-10T02:48:34Z",
      created_at:"1997-01-10T02:48:34Z",
      updated_at:"2011-12-10T02:48:34Z",
      registered_at:"2012-04-10T02:48:34Z",
      locked:true,
      pending_transfer:false,
      badger_dns:true,
      badger_registration:true,
      linkable_registrar:false,
      legacy_rhinonames_domain:false,
      auto_renew:true,
      administrator_contact:null,
      technical_contact:null,
      billing_contact:null
      // transfer_in: {}
    };

    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];
    defaults.whois = { privacy: true, raw: raw_whois_for_domain(defaults) };
    // if explicitly set to null, don't want a default to be set
    if (attrs['registrant_contact'] != null) {
      defaults.registrant_contact = attrs['registrant_contact'] || DemoData.tables.contact[0] || create_contact();
    }
    defaults.dns = attrs['dns'] || default_dns_for_domain(defaults);
    
    // if not using badger nameservers, disallow modification of DNS
    if (!(defaults.name_servers || []).equal_to(['ns1.badger.com', 'ns2.badger.com'])) {
      var permissions = defaults.permissions_for_person;
      var index_of_modify_dns = permissions.indexOf('modify_dns');
      if (index_of_modify_dns >= 0) {
        permissions.splice(index_of_modify_dns,1);
      }
    }

    DemoData.add_row('domain', defaults);
    return defaults;
  };
  
  var available_domain = function(name) {
    return {
      available: true,
      can_register: true,
      name: name,
      permissions_for_person: [],
      supported_tld: !!(name.split('.')||[]).slice(-1)[0].match(/com|net|org|info|me/)
    }
  };
  
  var create_linked_account = function(attrs) {
    attrs = attrs || {};
    
    var defaults = {
      id: DemoData.find('linked_account', 'all').length + 1,
      person_id: 1,
      domain_count: 0,
      site: 'godaddy',
      login: 'mylogin',
      status: 'synced',
      last_synced_at: null,
      next_sync_at: null,
      started_syncing_at: null
    }
    
    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];
    
    // add some linked domains
    if (!attrs.linked_domains) {
      var linked_permissions = ['']
      var linked_domains = [
        create_linked_domain(defaults, { name: 'a-new-hope-' + defaults.id + '.com' }),
        create_linked_domain(defaults, { name: 'empire-strikes-back-' + defaults.id + '.com' }),
        create_linked_domain(defaults, { name: 'revenge-of-the-sith-' + defaults.id + '.com' })
      ];
      defaults._linked_domains = linked_domains;
      defaults.domain_count = linked_domains.length;
    }
    
    DemoData.add_row('linked_account', defaults);
    return defaults;
  };

  var create_web_forward = function(domain_obj, attrs) {
    attrs = attrs || {};
    
    var defaults = {
      id: DemoData.find('web_forward', 'all').length + 1,
      domain_id: domain_obj.id,
      path: "www",
      destination: "http://www.test.com"
    }
    
    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];

    DemoData.add_row('web_forward', defaults);
    return defaults;
  };

  var create_email_forward = function(domain_obj, attrs) {
    attrs = attrs || {};
    
    var defaults = {
      id: DemoData.find('email_forward', 'all').length + 1,
      domain_id: domain_obj.id,
      username: "admin",
      destination: "johndoe@generic.com"
    }
    
    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];
  
    DemoData.add_row('email_forward', defaults);
    return defaults;
  };

  // create a domain ready for transfer (at another registrar with proper permissions)
  var create_transfer_domain = function(attrs) {
    return create_linked_domain({ site: 'GoDaddy' }, {
      name: attrs.name || 'transfer-domain=' + (DemoData.tables.domain.length + 1) + '.net',
      permissions_for_person: [],
      current_registrar: 'GoDaddy'
    })
  };
  
  var create_linked_domain = function(linked_account, attrs) {
    var registrar_name;
    if (linked_account.site.match(/godaddy/i)) registrar_name = 'GoDaddy';
    else if (linked_account.site.match(/networksolutions/i)) registrar_name = 'Network Solutions';
    else if (linked_account.site.match(/enom/i)) registrar_name = 'Enom';
    
    attrs.current_registrar = registrar_name || 'Another Registrar';
    attrs.permissions_for_person = ['linked_account', 'change_nameservers'];
    attrs.name_servers = ['ns1.notbadger.com', 'ns2.notbadger.com'];
    attrs.registrant_contact = null;
    
    var domain_obj = create_domain(attrs);
    domain_obj.dns = [
      create_dns_record(domain_obj, {
        record_type: 'a',
        content: '42.42.42.42',
        ttl: 1800
      }),
      create_dns_record(domain_obj, {
        record_type: 'cname',
        subdomain: 'www.',
        content: 'realultimatepower.net',
        ttl: 1800
      })
    ];
    return domain_obj;
  };
  
  var raw_whois_for_domain = function(domain_json) {
    var contact_string     = "",
        contact            = DemoData.find('contact', { id: 1 })[0];
    if (domain_json.whois && !domain_json.whois.privacy) {
      contact_string = (
        (contact.first_name + ' ' + contact.last_name).trim() + "\n\t" +
        (contact.organization ? contact.organization + "\n\t" : "") +
        contact.address + "\n\t" +
        (contact.address2 ? contact.address2 + "\n\t" : "") + 
        contact.city + ", " + contact.state + ", " + contact.zip + ", " + contact.country + "\n\t" +
        "Email: " + contact.email + "\n\t" +
        "Phone: " + contact.phone + "\n\t" +
        (contact.fax ? contact.fax + "\n\t" : "")
      );
    } else {
      contact_string = (
        'Private Domain Accounts LLC' + "\n\t" + 
        'Attn: ' + domain_json.name + "\n\t" + 
        '720 Market St., Suite 300' + "\n\t" + 
        'San Francisco, CA, 94102, US' + "\n\t" + 
        'Email: ' + domain_json.name + '+r@privatedomainaccounts.com' + "\n\t" + 
        'Phone: +1-415-787-5050' + "\n\t" + 
        'Fax: +1-415-358-4086' + "\n"
      );
    }
    
    return 'The data contained in this whois database is provided "as is" with' + "\n" + 
    'no guarantee or warranties regarding its accuracy.' + "\n" + 
    "\n" + 
    'Please note: the registrant of the domain name is specified' + "\n" + 
    'in the "registrant" field.  In most cases, Badger is not' + "\n" + 
    'the registrant of domain names listed in this database.' + "\n" + 
    "\n" + 
    'Domain Name: ' + (domain_json.name||'').toUpperCase() + "\n\t" + 
       'Created on: 2011-06-21' + "\n\t" + 
       'Updated on: 2012-06-29' + "\n\t" + 
       'Expires on: 2013-06-21' + "\n" + 
    "\n" + 
    'Registrant:' + "\n\t" + contact_string + "\n" + 
    'Administrative:' + "\n\t" + contact_string + "\n" + 
    'Technical:' + "\n\t" + contact_string + "\n" + 
    'Billing:' + "\n\t" + contact_string + "\n" + 
    'Name Servers:' + "\n\t" +
       'ns1.badger.com' + "\n\t" + 
       'ns2.badger.com' + "\n" +
    "\n";
  }

  var create_dns_record = function(domain_obj, attrs) {
    attrs = attrs || {};

    var defaults = {
      id: DemoData.tables.record.length + 1,
      domain_id: domain_obj.id,
      record_type: null,
      content: null,
      ttl: 1800,
      priority: null,
      subdomain: domain_obj.name
    };

    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];

    DemoData.add_row('record', defaults);
    return defaults;
  };

  var default_dns_for_domain = function(domain_obj) {
    return [
      create_dns_record(domain_obj, {
        record_type: 'soa',
        content: 'ns1.badger.com support@badger.com 1341359095',
        ttl: 1800
      }),
      create_dns_record(domain_obj, {
        record_type: 'ns',
        content: 'ns1.badger.com',
        ttl: 1800
      }),
      create_dns_record(domain_obj, {
        record_type: 'ns',
        content: 'ns2.badger.com',
        ttl: 1800
      })
    ];
  };
  
  var add_default_web_forwarding_dns = function(domain_obj) {
    domain_obj.dns.push(
      create_dns_record(domain_obj, {
        record_type: 'a',
        content: '165.225.134.233',
        ttl: 1800
      })
    );
    domain_obj.dns.push(
      create_dns_record(domain_obj, {
        record_type: 'a',
        content: '165.225.134.233',
        ttl: 1800,
        subdomain: '*.' + domain_obj.name
      })
    );
  };

  /*
    initialize DemoData with defaults
  */
  create_contact();

  var d = create_domain({
    name: 'example.com',
    expires_at: new Date(Date.parse('01-01-2014')).toString('MMMM dd yyyy'),
    registrant_contact: DemoData.find('contact', { id: 1 })[0]
  });
  add_default_web_forwarding_dns(d);
  
  var myblog = create_domain({
    name: 'myblog.net',
    expires_at: new Date().add(3).days().toString('MMMM dd yyyy'),
    registrant_contact: DemoData.find('contact', { id: 1 })[0]
  });
  // install Tumblr app
  myblog.dns.push(create_dns_record(myblog, {
    content: 'domains.tumblr.com',
    record_type: 'cname',
    subdomain: 'blog.' + myblog.name
  }));

  var last_domain = create_domain({
    name: 'johnsmith.com',
    registrant_contact: DemoData.find('contact', { id: 1 })[0]
  });
  add_default_web_forwarding_dns(last_domain);
  
}
