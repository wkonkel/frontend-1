var BadgerCache = {
  flush: function(key) {
    if (!key || (key == 'domains')) { BadgerCache.cached_domains = null; BadgerCache.cached_domain = {}; };
    if (!key || (key == 'payment_methods')) BadgerCache.cached_payment_methods = null;
    if (!key || (key == 'contacts')) BadgerCache.cached_contacts = null;
    if (!key || (key == 'account_info')) BadgerCache.cached_account_info = null;
    if (!key || (key == 'invite_status')) BadgerCache.cached_invite_status = null;
    if (!key || (key == 'linked_accounts')) BadgerCache.cached_linked_accounts = null;
    if (!key || (key == 'linked_accounts_remote_info')) BadgerCache.cached_linked_accounts_remote_info = {};
  },

  reload: function(key) {
    BadgerCache.flush(key);
    BadgerCache.load(key);
  },
  
  load: function(key) {
    if (Badger.getAccessToken()) {
      if (!key || (key == 'domains')) BadgerCache.getDomains();
      if (!key || (key == 'payment_methods')) BadgerCache.getPaymentMethods();
      if (!key || (key == 'contacts')) BadgerCache.getContacts();
      if (!key || (key == 'account_info')) BadgerCache.getAccountInfo();
      if (!key || (key == 'linked_accounts')) BadgerCache.getLinkedAccounts();
    }
  },
  
  getAccountInfo: function(callback) {
    callback = callback || function(){};
    if (BadgerCache.cached_account_info) {
      callback(BadgerCache.cached_account_info);
    } else {
      Badger.accountInfo(function(results) { 
        BadgerCache.cached_account_info = results;
        callback(BadgerCache.cached_account_info);
      });
    }
  },
  
  getLinkedAccounts: function(callback) {
    callback = callback || function(){};
    if (BadgerCache.cached_linked_accounts) {
      callback(BadgerCache.cached_linked_accounts);
    } else {
      Badger.getLinkedAccounts(function(results) { 
        BadgerCache.cached_linked_accounts = results;
        callback(BadgerCache.cached_linked_accounts);
      });
    }
  },
  
  getAuthorizedAccountInfo: function(linked_account_id, callback) {
    callback = callback || function(){};
    BadgerCache.cached_linked_accounts_remote_info = BadgerCache.cached_linked_accounts_remote_info || {};
    var key = linked_account_id.toString();
    if (BadgerCache.cached_linked_accounts_remote_info[key]) {
      callback(BadgerCache.cached_linked_accounts_remote_info[key]);
    } else {
      Badger.getAuthorizedAccountInfo(linked_account_id, function(results) { 
        BadgerCache.cached_linked_accounts_remote_info[key] = results;
        callback(BadgerCache.cached_linked_accounts_remote_info[key]);
      });
    }
  },

  getDomain: function(domain_name, callback) {
    callback = callback || function(){};
    BadgerCache.cached_domain = BadgerCache.cached_domain || {};
    if (BadgerCache.cached_domain[domain_name]) {
      callback(BadgerCache.cached_domain[domain_name]);
    } else {
      Badger.getDomain(domain_name, function(response) {
        BadgerCache.cached_domain[domain_name] = response;
        callback(BadgerCache.cached_domain[domain_name]);
      });
    }
  },

  getDomains: function(callback) {
    callback = callback || function(){};
    if (BadgerCache.cached_domains) {
      callback(BadgerCache.cached_domains);
    } else {
      Badger.getDomains(function(response) { 
        BadgerCache.cached_domains = response;
        callback(BadgerCache.cached_domains);
      });
    }
  },

  getPaymentMethods: function(callback) {
    callback = callback || function(){};
    if (BadgerCache.cached_payment_methods) {
      callback(BadgerCache.cached_payment_methods);
    } else {
      Badger.getPaymentMethods(function(results) { 
        BadgerCache.cached_payment_methods = results;
        // console.log("SETTING PAYMENT METHOD");
        // console.log(results);
        callback(BadgerCache.cached_payment_methods);
      });
    }
  },
  
  getContacts: function(callback) {
    callback = callback || function(){};
    if (BadgerCache.cached_contacts) {
      callback.call(null,BadgerCache.cached_contacts);
    } else {
      Badger.getContacts(function(results) { 
        BadgerCache.cached_contacts = results;
        callback.call(null,BadgerCache.cached_contacts);
      });
    }
  },

  getInviteStatus: function(callback) {
    callback = callback || function(){};
    if (BadgerCache.cached_invite_status) {
      callback(BadgerCache.cached_invite_status);
    } else {
      Badger.getInviteStatus(function(results) {
        BadgerCache.cached_invite_status = results;
        callback(BadgerCache.cached_invite_status);
      });
    }
  }
};