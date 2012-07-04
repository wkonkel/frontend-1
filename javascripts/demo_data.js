/*
  Temporary client-side storage of demo data
*/
var DemoData = {
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
  name: 'badger.com',
  registrant_contact: DemoData.contacts[0]
});
