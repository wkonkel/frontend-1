Hasher.__initializers.unshift(function() { if (Badger.demo_mode) load_badger_demo(); });

function load_badger_demo() {
  /*
    Override set_route to show 'not supported' page on certain routes
  */
  with (Hasher('Demo','Application')) {
    initializer(function() {
      $('html').addClass('demo');
      document.body.appendChild(div({ style: 'height: 100px'} ));
      document.body.appendChild(
        div({ 'id': 'demo-banner' },
          div({ 'style':'width: 950px; margin: 0 auto' },
              span({'style':'font-size: 30px; font-family: AdelleBold, Titillium;  margin-bottom: 10px;'}, 'This is a Demo'),
              a({ style:'float: right; margin-top: 15px', href:'https://www.badger.com/#acccount/create', 'class':'myButton'}, "Take me to the Real Thing!"), br(),
              "You're logged in with a demo account.", br(), "You can search, register, and set up your domains!")
        )
      )
    });

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
          a({ 'class': 'myButton large', style: 'margin: 10px', onclick: function() { window.location = 'https://www.badger.com/#account/create' } }, "I'm Ready for the Real Thing!")
        )
      );
    });

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


    // Badger.onLogout = function(callback) { window.location = 'https://www.badger.com' }

    Badger.Session = {
      inspect: function() {},
      write: function(sessvars) {},
      set: function(key,value) {},
      get: function() {},
      remove: function() {},
      clear: function() {}
    };

    var mock_api_callback = function(options, callback) {
      callback({
        meta: { status: options.status || 'ok' },
        data: options.data || {}
      });
    };

    /*
      If domain not stored in DemoData, return json for an available domain
    */
    Badger.getDomain = function(domain, callback) {
      var domain_obj;
      for (var i = 0; i < DemoData.domains.length; i++) {
        domain_obj = DemoData.domains[i];
        if (domain_obj.name == domain) return mock_api_callback({ data: DemoData.domains[i] }, callback);
      }
      mock_api_callback({ data: available_domain(domain) }, callback);
    };

    /*
      Mock domain name registration. Create a fake delay to make it less scary
    */
    Badger.registerDomain = function(data, callback) {
      setTimeout(function() {
        mock_api_callback({ status: 'created' }, callback);
        domain({ name: data.name });
        set_route('#domains/' + data.name);
      }, 450);
    };

    /*
      Add the DNS record to the domain found by name
    */
    Badger.addRecord = function(name, data, callback) {
      var domain_obj;
      for (var i = 0; i < DemoData.domains.length; i++) {
        domain_obj = DemoData.domains[i];
        if (domain_obj.name == name) {
          if (data.subdomain) data.subdomain = data.subdomain + '.' + name;
          domain_obj.dns.push(dns_record(domain_obj, data));
          return mock_api_callback({ status: 'ok' }, callback);
        };
      }
    };

    Badger.deleteRecord = function(name, id, callback) {
      var domain_obj;
      for (var i = 0; i < DemoData.domains.length; i++) {
        domain_obj = DemoData.domains[i];
        if (domain_obj.name == name) {
          var dns_record_obj;
          for (var j = 0; j < domain_obj.dns.length; j++) {
            dns_record_obj = domain_obj.dns[j];
            if (dns_record_obj.id == id) {
              domain_obj.dns.splice(j,1); // remove the record
              return mock_api_callback({ status: 'ok' }, callback);
            }
          }
        };
      }
    };

    Badger.updateRecord = function(name, id, data, callback) {
      var domain_obj;
      for (var i = 0; i < DemoData.domains.length; i++) {
        domain_obj = DemoData.domains[i];
        if (domain_obj.name == name) {
          var dns_record_obj;
          for (var j = 0; j < domain_obj.dns.length; j++) {
            dns_record_obj = domain_obj.dns[j];
            if (dns_record_obj.id == id) {
              var old_id = dns_record_obj.id;
              for (k in data) dns_record_obj[k] = data[k];
              return mock_api_callback({ status: 'ok' }, callback);
            }
          }
        };
      }
    };
    
    Badger.createWebForward = function() { render_not_supported_modal('Web forwards are fully not supported in the demo.') };
    Badger.createEmailForward = function() { render_not_supported_modal('Email forwards are fully not supported in the demo.') };

    Badger.getAccessToken = function() { return '0.example'; };
    Badger.accountInfo = function(callback) { mock_api_callback({ data: DemoData.account }, callback); };
    Badger.getAccountInfo = Badger.accountInfo;
    Badger.getDomains = function(callback) { mock_api_callback({ data: DemoData.domains }, callback); };
    Badger.getContacts = function(callback) { mock_api_callback({ data: DemoData.contacts }, callback); };
    Badger.getPaymentMethods = function(callback) { mock_api_callback({ data: DemoData.payment_method }, callback) };

    Badger.createContact = function(callback) { render_not_supported_modal('Creating new contacts is not supported in the demo.') };
    Badger.updateDomain = function(callback) { render_not_supported_modal('Updating domains is not supported in the demo.') };

    /*
      Kill BadgerCache, and replace it with the mocked out Badger api
    */
    BadgerCache = Badger;
    BadgerCache.flush = function() {};
    BadgerCache.reload = function() {};
    BadgerCache.load = function() {};
  }






  /*
    Temporary client-side storage of demo data
  */
  window.DemoData = {
    available_routes: [
      /^#$/,
      /^#welcome$/,
      /^#search$/,
      /^#domains(\/([-a-z0-9]+\.)+[a-z]{2,}(\/)?(whois|email_forwards|web_forwards)?)?$/,
      /^#domains(\/[-a-z0-9]+\.)+[a-z]{2,}\/apps/
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
      linked_accounts: [],
      hide_share_messages: false
    },

    payment_method: {
      id: 1,
      name: 'Badger Banking (4111********1111 12/21)'
    },

    contacts: [],
    domains: [],
    records: []
  };

  DemoData.add_row = function(key, object) {
    object.id = DemoData[key].length + 1;
    DemoData[key].push(object);
  };


  /*
    Builders
  */
  var contact = function(attrs) {
    attrs = attrs || {};

    var defaults = {
      id: DemoData.contacts.length + 1,
      first_name:"John",
      last_name:"Doe",
      organization:null,
      address:"720 Market St., Suite 300",
      address2:null,
      city:"San Francisco",
      state:"CA",
      zip:"94102",
      country:"US",
      phone:"415-787-5050",
      email:"warren@rhinonames.com",
      fax:null
    };

    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];
    DemoData.add_row('contacts', defaults);
    return defaults;
  }

  var domain = function(attrs) {
    attrs = attrs || {};

    var defaults = {
      id: DemoData.domains.length + 1,
      name: "example.com",
      supported_tld: true,
      permissions_for_person: ["show_private_data","modify_contacts","renew","transfer_out","change_nameservers","modify_dns"],
      name_servers: ["ns1.badger.com","ns2.badger.com"],
      registry_statuses:"clienttransferprohibited",
      current_registrar:"Badger",
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
    };

    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];
    defaults.whois = { privacy: true, raw: raw_whois_for_domain(defaults) };
    defaults.registrant_contact = attrs['registrant_contact'] || contact();
    defaults.dns = attrs['dns'] || default_dns_for_domain(defaults);

    DemoData.add_row('domains', defaults);
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
  }

  var raw_whois_for_domain = function(domain_json) {
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
    'Registrant:' + "\n" + 
       'Private Domain Accounts LLC' + "\n\t" + 
       'Attn: ' + domain_json.name + "\n\t" + 
       '720 Market St., Suite 300' + "\n\t" + 
       'San Francisco, CA, 94102, US' + "\n\t" + 
       'Email: ' + domain_json.name + '+r@privatedomainaccounts.com' + "\n\t" + 
       'Phone: +1-415-787-5050' + "\n\t" + 
       'Fax: +1-415-358-4086' + "\n" +
    "\n" + 
    'Administrative:' + "\n" + 
       'Private Domain Accounts LLC' + "\n\t" + 
       'Attn: ' + domain_json.name + "\n\t" + 
       '720 Market St., Suite 300' + "\n\t" + 
       'San Francisco, CA, 94102, US' + "\n\t" + 
       'Email: ' + domain_json.name + '+a@privatedomainaccounts.com' + "\n\t" + 
       'Phone: +1-415-787-5050' + "\n\t" + 
       'Fax: +1-415-358-4086' + "\n" +
    "\n" + 
    'Technical:' + "\n" + 
       'Private Domain Accounts LLC' + "\n\t" + 
       'Attn: ' + domain_json.name + "\n\t" + 
       '720 Market St., Suite 300' + "\n\t" + 
       'San Francisco, CA, 94102, US' + "\n\t" + 
       'Email: ' + domain_json.name + '+t@privatedomainaccounts.com' + "\n\t" + 
       'Phone: +1-415-787-5050' + "\n\t" + 
       'Fax: +1-415-358-4086' + "\n" +
    "\n" + 
    'Billing:' + "\n" + 
       'Private Domain Accounts LLC' + "\n\t" + 
       'Attn: ' + domain_json.name + "\n\t" + 
       '720 Market St., Suite 300' + "\n\t" + 
       'San Francisco, CA, 94102, US' + "\n\t" + 
       'Email: ' + domain_json.name + '+b@privatedomainaccounts.com' + "\n\t" + 
       'Phone: +1-415-787-5050' + "\n\t" + 
       'Fax: +1-415-358-4086' + "\n" +
    "\n" + 
    'Name Servers:' + "\n\t" +
       'ns1.badger.com' + "\n\t" + 
       'ns2.badger.com' + "\n" +
    "\n";
  }

  var dns_record = function(domain_obj, attrs) {
    attrs = attrs || {};

    var defaults = {
      id: DemoData.records.length + 1,
      record_type: null,
      content: null,
      ttl: 1800,
      priority: null,
      subdomain: domain_obj.name
    };

    for (k in defaults) if (attrs[k]) defaults[k] = attrs[k];

    DemoData.add_row('records', defaults);
    return defaults;
  };

  var default_dns_for_domain = function(domain_obj) {
    return [
      dns_record(domain_obj, {
        record_type: 'soa',
        content: 'ns1.badger.com support@badger.com 1341359095',
        ttl: 1800,
      }),
      dns_record(domain_obj, {
        record_type: 'a',
        content: '50.57.26.208',
        ttl: 1800,
      }),
      dns_record(domain_obj, {
        record_type: 'a',
        content: '50.57.26.208',
        ttl: 1800,
        subdomain: '*.' + domain_obj.name
      }),
      dns_record(domain_obj, {
        record_type: 'ns',
        content: 'ns1.badger.com',
        ttl: 1800,
      }),
      dns_record(domain_obj, {
        record_type: 'ns',
        content: 'ns2.badger.com',
        ttl: 1800,
      }),
    ];
  };

  /*
    initialize DemoData with defaults
  */
  contact();

  domain({
    name: 'example.com',
    registrant_contact: DemoData.contacts[0]
  });
  
  
}
