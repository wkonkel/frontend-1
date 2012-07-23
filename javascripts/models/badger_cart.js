// storage interface for the shopping cart.
// uses Badger.Session
var BadgerCart = {
  _cart_domains_storage_key: '_cart_storage',

  // callbacks, override these in the application
  after_add: function() {},
  after_remove: function() {},

  // Return cart status in a hash.
  contents: function() {
    var domains = this.get_domains();
    var info_hash = {
      domains: this.get_domains(),
      new_domains: this.get_new_domains(),
      transfer_domains: this.get_transfer_domains(),
    };
    
    // add calculated attrs
    info_hash.domain_count = info_hash.domains.length;
    
    return info_hash
  },
  
  // Add a domain name to the cart.
  // If a domain is added with the domain name alone, 
  // it explicitly needs to be updated later.
  push_domain: function(domain_name) {
    if (arguments.length <= 0) return this.get_domains();
    
    var arguments = this._flatten_arguments_to_array(arguments);
    var cart_domains = this.get_domains();
    
    var domain_obj;
    for (var i=0; i<arguments.length; i++) {
      if (typeof(arguments[i]) == 'string' && !this.find_domain({ name: arguments[i] })) {
        cart_domains.push({ name: arguments[i] });
        BadgerCart.after_add();
      } else if (!this.find_domain({ name: arguments[i].name })) {
        cart_domains.push(arguments[i]);
        BadgerCart.after_add();
      }
    }

    // save domains session storage
    Badger.Session.set(this._cart_domains_storage_key, cart_domains);
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
    // update attributes
    obj.update_attributes = function(attrs) {
      for (k in attrs) if (this[k]) this[k] = attrs[k];
    };
    
    obj.remove_from_cart = function() {
      var domains = BadgerCart.get_domains();
      for (var i=0; i<Object.keys(this).length; i++) {
        if (domains[i].name == this.name) {
          var destroyed_obj = domains.splice(i,1);
          BadgerCart.after_remove();

          // write to session storage
          Badger.Session.set(BadgerCart._cart_domains_storage_key, domains);
          return destroyed_obj;
        }
      }
    };
  },
  
  clear: function() {
    Badger.Session.remove(this._cart_domains_storage_key);
  },
  
  // get domain objects, append helper methods to them.
  get_domains: function() {
    var domains = Badger.Session.get(this._cart_domains_storage_key) || [];
    for (var i=0; i<domains.length; i++) {
      this.append_helper_methods_to_object(domains[i]);
    }
    return domains.sort();
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
