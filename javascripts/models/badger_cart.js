// storage interface for the shopping cart.
// uses Badger.Session
var BadgerCart = {
  _cart_storage_key: '_cart_storage',

// callbacks, override these in the application
  after_add: function() {},
  after_remove: function() {},

  _execute_after_add: function() {
    if (BadgerCart.after_add) {
      BadgerCart.after_add();
      BadgerCart.after_add = function() {};
    }
  },

  _execute_after_remove: function() {
    if (BadgerCart.after_add) {
      BadgerCart.after_add();
      BadgerCart.after_add = function() {};
    }
  },

  // Return cart status in a hash.
  contents: function() {
    var domains = this.get_domains();
    var info_hash = {
      domains: this.get_domains(),
      new_domains: this.get_new_domains(),
      transfer_domains: this.get_transfer_domains()
    };

    // add calculated attrs
    info_hash.domain_count = info_hash.domains.length;

    return info_hash
  },

  // Add a domain name to the cart.
  // If a domain is added with the domain name alone,
  // it explicitly needs to be updated later.
  push_domain: function(domain_obj) {
    if (arguments.length <= 0) return this.get_domains();

    var arguments = this._flatten_arguments_to_array(arguments);
    var cart_domains = this.get_domains();

    for (var i=0; i<arguments.length; i++) {
      if (typeof(arguments[i]) == 'string' && arguments[i].length > 0 && !this.find_domain({ name: arguments[i] })) {
        cart_domains.push({ name: arguments[i] });
        BadgerCart._execute_after_add();
      } else if (!this.find_domain({ name: arguments[i].name })) {
        cart_domains.push(arguments[i]);
        BadgerCart._execute_after_add();
      }
    }

    // save domains session storage
    this.set_domains(cart_domains);
    return this.get_domains();
  },

  // Find first domain in cart that match given the given parameters.
  find_domain: function(params) {
    var domains = this.get_domains();
    for (var i=0; i<domains.length; i++) {
      for (k in params) {
        if (domains[i][k] == params[k]) return domains[i];
      }
    }
  },

  // Find all domains in cart that match given the given parameters.
  find_all_domains: function(params) {
    var domains = this.get_domains(),
        results = [];
    for (var i=0; i<domains.length; i++) {
      for (k in params) {
        if (domains[i][k] == params[k]) results.push(domains[i]);
      }
    }
    return results;
  },

  // Append helper methods to domains objects, like update_attributes
  append_helper_methods_to_object: function(obj) {
    obj.remove_from_cart = obj.remove_from_cart || function() {
      var domains = BadgerCart.get_domains();
      for (var i=0; i<domains.length; i++) {
        if (domains[i].name == obj.name) {
          var destroyed_obj = domains.splice(i,1);
          BadgerCart._execute_after_remove();

          // write to session storage
          this.set_domains(domains);
          return destroyed_obj;
        }
      }
    };

    // add default purchase options if needed
    obj.purchase_options = obj.purchase_options || {
      years: 1,
      registrant_contact_id: null,
      privacy: true,
      auto_renew: true,
      import_dns: true
    };
  },

  clear: function() {
    Badger.Session.remove(this._cart_storage_key);
  },

  // store domain objects
  set_domains: function(domains) {
    Badger.Session.set(this._cart_storage_key, domains);
  },

  // get domain objects, append helper methods to them.
  get_domains: function() {
    var domains = Badger.Session.get(this._cart_storage_key) || [];
    for (var i=0; i<domains.length; i++) this.append_helper_methods_to_object(domains[i]);
    return domains.sort();
  },

  // compute the total number of credits needed to purchase domains in the cart.
  necessary_credits: function() {
    var credits = 0,
        domains = this.get_domains();
    for (var i=0; i<domains.length; i++) credits += domains[i].purchase_options.years;
    return credits;
  },

  eligible_for_referral_bonus: function() {
    return Badger.Session.get(this._cart_eligible_for_referral_bonus_key) || false;
  },

  set_eligible_for_referral_bonus: function(eligible) {
    return Badger.Session.set(this._cart_eligible_for_referral_bonus_key, eligible);
  },

  // compute the total cost. NOTE does not factor in account balance
  // TODO: this should be an API call
  compute_price: function() {
    var price_per_year = 10;
    return this.necessary_credits() * price_per_year - (this.eligible_for_referral_bonus() ? 5 : 0);
  },

  // transfer domains are domains with a current_registrar
  get_transfer_domains: function() {
    return this.get_domains().filter(function(d) { return d.current_registrar });
  },

  get_new_domains: function() {
    return this.get_domains().filter(function(d) { return d.available });
  },

  _flatten_arguments_to_array: function() {
    var stack = Array.prototype.slice.call(arguments);
    var arguments = [];
    while (stack.length > 0) {
      var obj = stack.shift();
      if (obj) {
        if ((typeof(obj) == 'object') && obj.concat) {
          // array? just concat
          stack = obj.concat(stack);
        } else if (((typeof(obj) == 'object') && obj.callee) || (Object.prototype.toString.call(obj).indexOf('NodeList') >= 0)) {
          // explicitly passed arguments or childNodes object? to another function
          stack = Array.prototype.slice.call(obj).concat(stack);
        } else {
          arguments.push(obj);
        }
      }
    }
    return arguments;
  }
}
