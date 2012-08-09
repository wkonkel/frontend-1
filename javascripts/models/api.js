var Badger = {
  api_host: 'https://api.badger.com/',

  // Temporarily store data in session.
  // Uses the Session object defined in session.js.
  // Stores stringified data in window.name
  Session: {
    // show everything that is currently saved to the session.
    // only really useful for debugging.
    inspect: function() {
      var sessionVars = {};
      var keys = Object.keys(Session).slice(1);      
      
      for (i in keys) {
        if (key = keys[i]) sessionVars[key] = Session[key];
      }
      
      return sessionVars;
    },
    
    // write the variable to session variables.
    write: function(sessvars) {
      for (k in sessvars) {
        Session[k] = sessvars[k];
      }
    },
    
    set: function(key,value) {
      Session[key] = value;
    },
    
    // read the key/value from session and return value
    // if multiple keys provided, returns a hash of key => value
    get: function() {
      if (arguments.length == 1) {
        var key = arguments[0];
        return Session[key];
      }
      
      var sessionVars = {};
      for (var i = 0; i < arguments.length; i++) {
        var key = arguments[i];
        sessionVars[key] = Session[key];
      }
      return sessionVars;
    },
    
    // delete the key/value from session and return value
    // if multiple keys provided, returns a hash of key => value
    remove: function() {
      if (arguments.length == 1) {
        var key = arguments[0];
        var value = Session[key];
        delete Session[key];
        return value;
      }
      
      var sessionVars = {};
      for (var i = 0; i < arguments.length; i++) {
        var key = arguments[i];
        var value = Session[key];
        delete Session[key];
        sessionVars[key] = value;
      }
      return sessionVars;
    },
    
    clear: function() {
      var keys = Object.keys(Session).slice(1);
      for (i in keys) {
        delete Session[keys[i]];
      }
    }
  },
  
  api: function() {
    // parse arguments: url, [http_method], [params], [callback]
    var args = Array.prototype.slice.call(arguments, 0);

    // TODO: hard-code this and braintreeEncrypt() and make dev/qa work differently
    var url = Badger.api_host + args.shift().replace(/^\//,'');
    var method = typeof(args[0]) == 'string' ? args.shift() : 'GET';
    var params = typeof(args[0]) == 'object' ? args.shift() : {};
    var callback = typeof(args[0]) == 'function' ? args.shift() : function(){};
    
    // callback sequence number
    Badger.callback_sequence = (Badger.callback_sequence || 0) + 1;
    var callback_name = 'callback_' + Badger.callback_sequence;

    // default params
    params.cache = (new Date().getTime());
    params.callback = 'Badger.jsonp_callbacks.' + callback_name;
    if (method != 'GET') params._method = method;
    params.access_token = Badger.getAccessToken();

    // params to url string
    for (var key in params) {
      url += (url.indexOf('?') == -1 ? '?' : '&');

      url += key + '=' + encodeURIComponent(params[key]||'');
    }
    
    
    // TODO: alert if url is too long

    var script = document.createElement("script");        
    script.async = true;
    script.type = 'text/javascript';
    script.src = url;

    Badger.jsonp_callbacks[callback_name] = function(response) {
      // var error = JSON.parse(data.responseText);
      // if (response.data && response.data.errors) {
      //   response.data.errors.forEach(function(err) {
      //    console.log("Error with " + err.resource + ". Field: '" + err.field + "' Code: '" + err.code + "'");
      //   });
      // }

      // Need to reset input placeholder for msie only
      Placeholder.reset_ie_input_placeholder();
      delete Badger.jsonp_callbacks[callback_name];
      var head = document.getElementsByTagName('head')[0];
      head.removeChild(script);

      if (response && response.meta && response.meta.status == 'unauthorized') {
        // if we passed in an access token that isn't valid, probably best to log them out all the way
        Badger.getAccessToken() ? Badger.logout() : Badger.requireAuth();
      } else {
        callback.call(null,response);
      }
    };

    var head = document.getElementsByTagName('head')[0];
    head.appendChild(script);
  },
  
  jsonp_callbacks: {},

  /*
  * Set a cookie.
  *
  * Options:
  * @expires_at:  the date at which the cookie is to expire.
  *
  * Examples:
  *   Badger.setCookie('key','value', { expires_at: date().add(5).days() });
  *   Badger.setCookie('key','value');
  * */
  setCookie: function(name,value,options) {
    options = options || {};
    var cookie = (value ? name+"="+value+"; path=/;" : name+"=; path=/;");
    if (options.expires_at) cookie += "expires="+options.expires_at.toGMTString();
    document.cookie = cookie;
  },
  
  getCookie: function(name) {
    var ca = document.cookie.split(';');
    for (var i=0; i < ca.length; i++) {
      while (ca[i].charAt(0)==' ') ca[i] = ca[i].substring(1,ca[i].length);
      if (ca[i].length > 0) {
        var kv = ca[i].split('=');
        if (kv[0] == name) return kv[1];
      }
    }
  },
  
  setInviteCode: function(invite_code) {
    Badger.setCookie('invite_code', invite_code);
    //if (typeof(_gaq) != 'undefined') _gaq.push(['_trackPageview', path + '?utm_source.....']);
  },

  getInviteCode: function() {
    return Badger.getCookie('invite_code');
  },
  
  // reads from "badger_access_token" cookie
  getAccessToken: function() {
    return Badger.getCookie('badger_access_token');
  },
  
  // writes to "badger_access_token" cookie
  setAccessToken: function(token) {
    Badger.setCookie('badger_access_token', token);
  },

  onRequireAuth: function(callback) {
    Badger.require_auth_callbacks.push(callback);
  },
  require_auth_callbacks: [],
  
  onLogin: function(callback) {
    Badger.login_callbacks.push(callback);
  },
  login_callbacks: [],
  
  onLogout: function(callback) {
    Badger.logout_callbacks.push(callback);
  },
  logout_callbacks: [],
  
  // given email+password, returns an access token
  login: function(options, callback) {
    Badger.api("/account/access_token", options, function(response) {
      if ((response.meta.status == 'ok') && response.data.access_token) {
        Badger.setAccessToken(response.data.access_token);
        for (var i=0; i < Badger.login_callbacks.length; i++) Badger.login_callbacks[i].call(null);
      }
      if (callback) callback(response);
    });
  },

  // erases local cookie
  logout: function(callback) {
    if (callback) callback();
    for (var i=0; i < Badger.logout_callbacks.length; i++) Badger.logout_callbacks[i].call(null);
    if (Badger.getAccessToken()) Badger.setAccessToken(null);
  },

  requireAuth: function() {
    for (var i=0; i < Badger.require_auth_callbacks.length; i++) Badger.require_auth_callbacks[i].call(null);
  },
  
  accountInfo: function(callback) {
    Badger.api("/account/info", callback);
  },

  requestInvite: function(email, callback) {
    Badger.api("/account/request_invite", 'POST', { email: email }, callback);
  },
  
  // new invite request redemption
  requestInviteAndCreatePerson: function(form_data, callback) {
    Badger.api("/account/request_invite_and_create_person", 'POST', form_data, callback);
  },

  requestInviteExtraInfo: function(data, callback) {
    Badger.api("/account/request_invite_extra_info", 'POST',
      { invite_request_id: data.invite_request_id, full_name: data.full_name,
        total_domains_registered: data.total_domains_registered, suggestions: data.suggestions }, callback);
  },

  createAccount: function(data, callback) {
    Badger.api("/account", 'POST', data, function(response) {
      if ((response.meta.status == 'ok') && response.data.access_token) {
        Badger.setAccessToken(response.data.access_token);
        for (var i=0; i < Badger.login_callbacks.length; i++) Badger.login_callbacks[i].call(null);
      }
      if (callback) callback(response);
    });
  },
  
  updateAccount: function(data, callback) {
    Badger.api("/account/update_authorized_account", 'PUT', data, callback);
  },
  
  domainSearch: function(query, use_serial, callback) {
    Badger.__search_serial_next = (Badger.__search_serial_next || 1) + 1;
    Badger.__search_serial_last = (Badger.__search_serial_last || 0);
    
    Badger.api("/domains/search", 'POST', { query: query, serial: Badger.__search_serial_next }, function(results) {
      // Log domain searches
      // if (results.data.domains) {
      //   results.data.domains.forEach(function(domain) {
      //     Badger.createDomainSearchHistory({ query: domain[0], available: domain[1] });
      //   });
      // }
      
      if (!use_serial || parseInt(results.data.serial) > Badger.__search_serial_last) {
        Badger.__search_serial_last = parseInt(results.data.serial);
        callback(results);
      }      
    });
  },

  getDomains: function(callback) {
    Badger.api("/domains", function(response) {
      callback(response);
    });
  },
  
  getDomainsForLinkedAccount: function(linked_account_id, callback) {
    Badger.api("/domains", { linked_account_id: linked_account_id }, function (response) {
      callback(response.data);
    });
  },

  getDomain: function(name, params, callback) {
    if (typeof(params) == 'function') {
      callback = params;
      params = {};
    }
    
    Badger.api("/domains/" + name, params, function(response) {
      callback(response);
    });
  },
  
  getRecords: function(name, callback) {
    Badger.api("/domains/" + name + "/records", function(response) { callback(response.data); });   
  },

  addRecord: function(name, data, callback) {
    Badger.api("/domains/" + name + "/records", 'POST', data, callback);   
  },

  deleteRecord: function(name, id, callback) {
    Badger.api("/domains/" + name + "/records/" + id, "DELETE", callback);
  },

  updateRecord: function(name, id, data, callback) {
    Badger.api("/domains/" + name + "/records/" + id, "PUT", data, callback);
  },

  registerDomain: function(data, callback) {
    var name = data.name;
    //delete data.name; // bad to modify the passed in object... should clone first
    Badger.api("/domains/" + name + "/register", 'POST', data, callback);
  },

  transferOutDomain: function(domain, operation, callback) {
    Badger.api("/domains/" + domain + "/transfer_out", 'POST', { operation: operation }, callback);
  },

  transferDomain: function(data, callback) {
    var name = data.name;
    //delete data.name; // bad to modify the passed in object... should clone first
    Badger.api("/domains/" + name + "/transfer", 'POST', data, callback);
  },
  

  tryAuthCodeForTransfer: function(domain_name, auth_code, callback) {
    Badger.api("/domains/" + domain_name + "/try_auth_code", 'POST', { auth_code: auth_code }, callback);
  },

  retryRejectedTransfer: function(domain_name, callback) {
    Badger.api("/domains/" + domain_name + "/retry_rejected_transfer", 'POST', callback);
  },
  
  // bulkTransferDomains: function(registrant_contact_id, domain_names, callback) {
  //   Badger.api("/domains/bulk_transfer", 'POST', { registrant_contact_id: registrant_contact_id, domain_names: domain_names }, callback);
  // },
  
  cancelDomainTransfer: function(domain_name, callback) {
    Badger.api("/domains/" + domain_name + "/cancel_transfer", 'POST', callback);
  },

  renewDomain: function(name, years, callback) {
    Badger.api("/domains/" + name + "/renew", "POST", { years: years }, callback);
  },

  updateDomain: function(domain, options, callback) {
    Badger.api("/domains/" + domain, 'PUT', options, callback); 
  },

  getContacts: function(callback) {
    Badger.api("/account/contacts", function(response) {
      if (response.data) {
        response.data = (response.data || []).map(function(contact) {
          contact.needs_update = false;
          
          for (key in contact) {
            if (contact[key] && contact[key].toString().match(/^UNKNOWN$/)) {
              contact[key] = undefined;
              contact.needs_update = true;
            }
          }
          
          return contact;
        });
      }
      
      callback(response);
    });
  },

  createContact: function(data, callback) {
    Badger.api("/account/contacts", 'POST', data, callback);
  },

  updateContact: function(contact_id, data, callback) {
    Badger.api("/account/contacts/" + contact_id, 'PUT', data, callback);
  },


  braintreeEncrypt: function(data) {
    if (!Badger.braintree) {
      if (Badger.api_host == 'https://api.badger.com/') {
        Badger.braintree = Braintree.create("MIIBCgKCAQEA7q46U13zKcfozxhNgL8RxF1LEXm2M1NMyromzybYIuwMnXRKg9/DsbQDls2V1uGv8zhqrS3lMmBIvNR6gv2vAMTSwYDKE2VJcUlJveNAP1q5EMMqwTFTlPoBr8uwhT6Q7919O2UDTVi6t/8dm8k6RZsdL+TDcjc7gpNNK4JHOJbqnKpAKPc9uTpo6IlUan2FJVBRk0GVhrRwR+S1YU9aJW8rHPrMovkUpOUUFhzfgGcrFdbbLUTNkxB4OwKxkwYME82i6UlHNxUoRPYama/Tpn+68gu+oV27nJmAF/iuMsV5iLrCyXzbSvt3YBwOctb+WFIqsc/kSd1SsYKZgh9RWQIDAQAB");
      } else {
        Badger.braintree = Braintree.create("MIIBCgKCAQEAvypnA1PqZrAN2nPiWEcPitpEqF/4spcVFvZjCp9T/34nM8sakWQMm9RfKLj24wLYJlgpTdSfQCsU7jms7XOwFyLAajEWk+bRy5E4GheaLOsQsUvZuzgMr4BncDlL4jwxpgiQ67ngSxp2mOB6qySWHlD7E5kNtkl97Q1WyH3IJlSi3Crd/QCsnafMeJhvziuRGIKIX/QBmblcqRXqfjbkmG9VcLUiwsMYuIwuksm3fWHJBYncHoPeZ29lu4eUXuAwLL78VZqtEbxoP9KqW+8yUfX7JBRUq/e6beTtEYc6bhQ9UWxAXANH8jmFOhTu9cPTyGOmI6BgJdfBEPjWncM7GQIDAQAB");
      }
    }
    if( data.cc_number && data.cc_number.length > 0) data.cc_number = Badger.braintree.encrypt(data.cc_number);
    if( data.cc_cvv && data.cc_cvv.length > 0 ) data.cc_cvv = Badger.braintree.encrypt(data.cc_cvv);
    return data;
  },

  getPaymentMethods: function(callback) {
    Badger.api("/account/payment_methods", callback);
  },

  purchaseCredits: function(data, callback) {
    if(!data.payment_method_id) data.payment_method_id = "0"
    if(!data.cc_expiration_date) data.cc_expiration_date = data.cc_expiration_date_month + "/" + data.cc_expiration_date_year
    
    Badger.api("/account/purchase_credits", 'POST', Badger.braintreeEncrypt(data), callback);
  },

  // not implemented
  // getPendingTransfers: function(callback) {
  //   Badger.api("/domains/pending_transfers", callback);
  // },

  getCreditHistory: function(callback) {
    Badger.api("/account/credit_history", callback);
  },

  sendPasswordResetEmail: function(data, callback) {
    Badger.api("/account/forgot_password", 'POST', data, callback);
  },

  resetPasswordWithCode: function(data, callback) {
    Badger.api("/account/reset_password", 'POST', data, function(response) {
      if (response.meta.status == 'ok') {
        Badger.setAccessToken(response.data.access_token);
        for (var i=0; i < Badger.login_callbacks.length; i++) Badger.login_callbacks[i].call(null);
      }
      if (callback) callback(response);
    });
  },

  changePassword: function(data, callback) {
    Badger.api("/account/change_password", 'POST', data, callback);
  },

  changeEmail: function(data, callback) {
    Badger.api("/account/change_email", 'POST', data, callback);
  },

  changeName: function(data, callback) {
    Badger.api("/account/change_name", 'POST', data, callback);
  },
  
  changeHideShareMessages: function(value, callback) {
    Badger.api("/account/change_hide_share_messages", 'POST', { hide_share_messages: value }, callback);
  }, 
  
  sendEmail: function(data, callback) {
    Badger.api("account/contact_us", "POST", data, callback);
  },

  getEmailForwards: function(domain, callback) {
    Badger.api("domains/" + domain + "/email_forwards", callback);
  },
  
  createEmailForward: function(domain, data, callback) {
    Badger.api("domains/" + domain + "/email_forwards", "POST", data, callback);
  },
  
  updateEmailForward: function(domain, id, data, callback) {
    Badger.api("domains/" + domain + "/email_forwards/" + id, "PUT", data, callback);
  },
  
  deleteEmailForward: function(domain, id, callback) {
    Badger.api("domains/" + domain + "/email_forwards/" + id, "DELETE", callback);
  },

  getWebForwards: function(domain, callback) {
    Badger.api("domains/" + domain + "/web_forwards", callback);
  },
  
  createWebForward: function(domain, data, callback) {
    Badger.api("domains/" + domain + "/web_forwards", "POST", data, callback);
  },
  
  updateWebForward: function(domain, id, data, callback) {
    Badger.api("domains/" + domain + "/web_forwards/" + id, "PUT", data, callback);
  },
  
  deleteWebForward: function(domain, id, callback) {
    Badger.api("domains/" + domain + "/web_forwards/" + id, "DELETE", callback);
  },
  

  // Comment out until used
  // getDomainSearchHistory: function(callback) {
  //   Badger.api("domains/search_history", callback);
  // },
  // 
  // createDomainSearchHistory: function(data, callback) {
  //   Badger.api("domains/search_history", "POST", data, callback);
  // },


  sendInvite: function(data, callback) {
    Badger.api("/account/send_invite", "POST", { first_name: data.first_name, last_name: data.last_name, email: data.invitation_email, credits_to_gift: data.credits_to_gift, custom_message: data.custom_message }, callback);
  },
  
  revokeInvite: function(invite_id, callback) {
    Badger.api("/account/revoke_invite", "POST", { invite_id: invite_id }, callback);
  },

  confirmEmail: function(code, callback) {
    Badger.api("/account/confirm_email", "POST", { code: code }, callback);
  },

  getInviteStatus: function(callback) {
    Badger.api("/account/all_sent_invites", callback);
  },
  
  getInvite: function(invite_code, callback) {
    Badger.api('/account/invites/' + invite_code, callback);
  },
  
  getReferralCodes: function(callback) {
    Badger.api('/account/referral_codes', callback);
  },
  
  getReferralCode: function(slug, callback) {
    Badger.api('/account/referral_codes/' + slug, callback);
  },
  
  createReferralCode: function(data, callback) {
    Badger.api('/account/referral_codes', 'POST', data, callback);
  },
  
  updateReferralCode: function(slug, updates, callback) {
    Badger.api('/account/referral_codes/' + slug, 'PUT', data, callback);
  },
  
  redeemRewardPoints: function(callback) {
    Badger.api('/account/rewards/redeem_points', 'POST', callback);
  },

  remoteWhois: function(domain, callback) {
    Badger.api("/domains/remote_whois", "POST", { domain: domain }, callback);
  },

  badgerWhois: function(domain, callback) {
    Badger.api("/domains/whois", "POST", { domain: domain }, callback);
  },

  createLinkedAccount: function(data, callback) {
    Badger.api("/linked_accounts", "POST", data, callback);
  },
  
  updateLinkedAccount: function(id, data, callback) {
    Badger.api("/linked_accounts/" + id, "PUT", data, callback);
  },
  
  getLinkedAccounts: function(callback) {
    Badger.api("/linked_accounts", callback);
  },
  
  getLinkedAccount: function(id, callback) {
    Badger.api("/linked_accounts/" + id, callback);
  },
  
  deleteLinkedAccount: function(id, callback) {
    Badger.api("/linked_accounts/" + id, "DELETE", callback);
  },
  
  getAuthorizedAccountInfo: function(linked_account_id, callback) {
    Badger.api("/linked_accounts/" + linked_account_id + "/remote_info", callback);
  },
  
  shareMessage: function(linked_account_ids, data, callback) {
    if (typeof(linked_account_ids) == 'number') { linked_account_ids = [linked_account_ids] }
    Badger.api("linked_accounts/share_message", "POST", { message: message, linked_account_ids: linked_account_ids }, callback);
  },
  
  // shareDomainRegistration: function(linked_account_id, domain_name, hide_share_messages, callback) {
  //  Badger.api("/linked_accounts/" + linked_account_id + "/share_registration", "POST", { domain_name: domain_name, hide_share_messages: hide_share_messages }, callback);
  // },
  // 
  // shareDomainBulkRegistration: function(linked_account_id, domain_name, num_domains, hide_share_messages, callback) {
  //  Badger.api("/linked_accounts/" + linked_account_id + "/share_bulk_registration", "POST", { domain_name: domain_name, num_domains: num_domains, hide_share_messages: hide_share_messages }, callback);
  // },
  // 
  // shareDomainTransfer: function(linked_account_id, num_domains, hide_share_messages, callback) {
  //  Badger.api("/linked_accounts/" + linked_account_id + "/share_transfer", "POST", { num_domains: num_domains, hide_share_messages: hide_share_messages }, callback);
  // },
  
  getBlogs: function(callback) {
    Badger.api("/blogs", callback);
  },

  getBlog: function(id, callback) {
    Badger.api("/blogs/" + id , callback);
  },

  getFaqs: function(callback) {
    Badger.api("/faqs", callback);
  },

  getKnowledgeCenterArticles: function(callback) {
    Badger.api("/knowledge_center_articles/", callback);
  },

  getKnowledgeCenterArticle: function(id, callback) {
    Badger.api("/knowledge_center_articles/" + id, callback);
  },

  getTickets: function(callback) {
    Badger.api("/tickets", callback);
  },

  getTicket: function(id, callback) {
    Badger.api("/tickets/" + id, callback);
  },

  createTicket: function(data, callback) {
    Badger.api("/tickets/", 'POST', data, callback);
  },

  addResponseTicket: function(id, data, callback) {
    Badger.api("/tickets/" + id + '/add_response', 'POST', data, callback);
  },

  closeTicket: function(id, callback) {
    Badger.api("tickets/" + id + '/close_ticket', 'POST', callback);
  },

  getTermsOfServices: function(callback) {
    Badger.api("/terms_of_services", callback);
  },

  getTermsOfService: function(id, callback) {
    Badger.api("/terms_of_services/" + id , callback);
  }



  // getRecordsByType: function(accessToken, name, type, callback) {
  //   Badger.api("/domains/" + name + "/records/" + type, { headers: { access_token: accessToken } }, function(records) {
  //     callback(records);
  //   });
  // },
  // 
  // getRecord: function(accessToken, name, id, callback) {
  //   Badger.api("/domains/" + name + "/records/" + id, { headers: { access_token: accessToken } }, function(record) {
  //     callback(record);
  //   });   
  // },
  // 
  // 
  // deleteRecordsByType: function(accessToken, name, type, callback) {
  //   Badger.api("/domains/" + name + "/records/" + type, { type: "DELETE", headers: { access_token: accessToken } }, function(resp) {
  //     callback(resp);
  //   });   
  // },
  // 
  // updateRecord: function(accessToken, name, id, data, callback) {
  //   Badger.api("/domains/" + name + "/records/" + id, { type: "PUT", headers: { access_token: accessToken }, data: data }, function(resp) {
  //     callback(resp);
  //   });
  // },  
  // 
  // showAccount: function(accessToken, callback) {
  //   Badger.api("/account", function(account) {
  //     callback(account);
  //   });
  // },
  // 
  // checkEmail: function(email, callback) {
  //   Badger.api("/account/check_email", 'POST', { email: email }, callback);
  // },
  // 
  // 
  // updateAccount: function(accessToken, data, callback) {
  //   Badger.api("/account", "POST", data, callback);
  // },
  // 
  // resetPassword: function(email, newPassword, code, callback) {
  //   Badger.api("/account/reset_password", { type: "POST", data: { email: email, new_password: newPassword, code: code} }, function(resp) {
  //     callback(resp);
  //   });
  // },
  // 
  // changePassword: function(accessToken, newPassword, callback) {
  //   Badger.api("/account/change_password", { type: "POST", headers: { access_token: accessToken }, data: { new_password: newPassword } }, function(resp) {
  //     callback(resp);
  //   });
  // },
  // 
  // unregisterDomain: function(accessToken, name, callback) {
  //   Badger.api("/domains/" + name, { type: "DELETE", headers: { access_token: accessToken } }, function(resp) {
  //     callback(resp);
  //   });
  // },
  // 
  // renewDomain: function(accessToken, data, callback) {
  //   Badger.api("/domains/" + data.name + "/renew", { type: "PUT", headers: { access_token: accessToken }, data: data }, function(resp) {
  //     callback(resp);
  //   });
  // },
  // 
  // getWhois: function(accessToken, name, callback) {
  //   Badger.api("/domains/" + name + "/whois", { headers: { access_token: accessToken } }, function(whois) {
  //     callback(whois);
  //   });
  // },
  
};
