with (Hasher('Application')) {

  before_filter(function() {
    if (get_route() == '#domains/transfer') set_route('#cart');
  });

  initializer(function() {
    if (Badger.getAccessToken()) BadgerCache.load();
    
    // an API call was made that requires auth
    Badger.onRequireAuth(function() {
      var previous_route = get_route(),
          white_listed_routes = ['#rewards'];
      
      set_route('#account/login');
      
      // redirect to previous route after login if allowed
      if (white_listed_routes.indexOf(previous_route) >= 0) {
        Badger.Session.set('redirect_to', previous_route);
      }
    });

    Badger.onLogin(function() {
      // remove Facebook account info, create linked facebook account server-side
      var facebook_info = Badger.Session.remove('facebook_info');
      if (facebook_info) {
        Badger.createLinkedAccount({ site: 'facebook', login: facebook_info.username,  access_token: facebook_info.access_token }, function(response) {
          set_route('#', { reload_page: true });
        });
      } else {
        set_route('#', { reload_page: true });
      }

      // clear out referral info
      Badger.Session.remove('referral_info');
    });

    Badger.onLogout(function() {
      set_route('#', { reload_page: true });
    });
  });

  // handle query params if query string is present, then set_route to clear them from the URL
  before_filter(function() {
    if (!Hasher.request_data.query_string || Hasher.request_data.query_string.length <= 0) return;

    var params = Hasher.request_data.params,
        existing_referral_info = Badger.Session.get('referral_info') || {};

    var referral_info = {
      referral_code: params.referral_code || existing_referral_info.referral_code,
      referred_by: (params.referred_by || existing_referral_info.referred_by || "").replace(/\+/,' '),
      referrer_is_affiliate: params.is_affiliate || existing_referral_info.referrer_is_affiliate,
      domains: params.domains || existing_referral_info.domains,

      // the person being referred to badger
      first_name: params.first_name || existing_referral_info.first_name,
      last_name: params.last_name || existing_referral_info.last_name,
      email: params.email || existing_referral_info.email
    };

    Badger.Session.write({ referral_info: referral_info });

    // as per the affiliate program specs, we must keep the last used affiliate code around in a cookie for 180 days.
    if (referral_info.referral_code) {
      Badger.getReferralCode(referral_info.referral_code, function(response) {
        if (response.meta.status == 'ok' && response.data.person.is_affiliate) {
          Badger.setCookie('affiliate_code', referral_info.referral_code, { expires_at: date().add(30).days() });
        }
      });
    }

    // add domains to cart
    ((params.domains||"").split(',')).forEach(function(domain_name) { Cart.add_domain(domain_name) });
    
    set_route(Hasher.request_data.path);
  });
  
  // redirect if told to do so (tried to go to page that requires auth)
  after_filter(function() {
    if (Badger.Session.get('redirect_to')) set_route(Badger.Session.remove('redirect_to'));
  });

  route('#', function() {
    if (Badger.getAccessToken()) {
      set_route('#domains');
    } else {
      set_route('#welcome');
    }
  });

  /*
  * Insert a notification underneath the specified element
  *
  * TODO this doesn't really work. Leaving it for reference
  * */
//  define('notification_on_element', function(element, options) {
//    // do nothing if not content is provided
//    if (!options.content) return;
//
//    // if element an id, find the element
//    if (typeof(element) == 'string') {
//      if (element[0] != '#') element = '#' + element;
//    }
//    element = $(element);
//    notification_element = $(div(options.content));
//
//    // if the element cannot be found, just return
//    if (!element || element.length == 0) {
//      console.log('element not found!');
//      return;
//    };
//
//    // generate a unique id for the message, so that it can be closed later
//    var _unique_id = date().getTime();
//
//    // configure the location of the notification based off of the provided element
//    notification_element.css({
//      'position': 'relative',
//      'display': 'inline',
//      'float': 'left',
//      'margin-top': element.height() * 2,
//      'left': element.position().left - notification_element.width() + (element.width() / 2) + 50
//    });
//
//    // set timeout to close the message automatically, unless set to -1, then show forever (until closed manually)
//    options.show_duration = options.show_duration || 2000;
//    if (options.show_duration > 0) {
//      setTimeout(function() {
//        $('#' + _unique_id).remove();
//      }, options.show_duration);
//    }
//
//    // first, remove any existing notifications, then append the new one
//    return element.after(span({ 'class': 'popup-notification', 'id': _unique_id }, notification_element[0]));
//  });

  /*
    Poll until response returns true.
    
    Options:
    @max_time:        Number of seconds after which to timeout.
                        if -1, then poll forever.
    @interval:        The amount of time to wait between requests
    @action:          The API request to be made every step.
                        if returns true, breaks poll, otherwise it will
                        continue until until the timeout.
                        NOTE: this function must take a callback as it's
                        last parameter (TODO allow synchronous)
    @on_timeout:      The function to be called when timeout is reached.
                        data about the poll is passed as an argument.
    @on_finish:       The function to be called when the action is finished
                        data about the poll is passed as an argument.
    @on_route_change: The function to be called if the route is changed mid-poll
                        data about the poll is passed as an argument.
    
    For the @action object:
    @method     The curried Badger API method to use.
                  note: the method MUST accept a callback
                  as it's last (or only) argument, AND the
                  curried method must NOT have the callback.
    @on_ok      The callback for 'ok' and 'created' responses to
                  @method. The API response, as well as data about
                  the poll are passed to this as arguments.
    @on_error   The callback for 'ok' and 'created' responses to
                  @method. The API response, as well as data about
                  the poll are passed to this as arguments.
    
    The poll is broken based on the return value of the on_ok and
    on_error callbacks.
    - If true is returned, then the poll is broken,
      and the on_finish callback is executed.
    - If nothing is returned
      (undefined), then the poll is broken and the on_finish callback
      is not called. If polling forever, then don't break.
    - If false is returned, then the poll marches onward.
      if polling forever.
    
    The on_ok and on_error callbacks must return false if you
    don't want to break out of the poll. If they return true,
    or nothing at all, then when they are executed the poll will
    stop.
  */
  define('long_poll', function(options) {
    // default options
    options = {
      max_time: options.max_time || 30000,
      interval: options.interval || 5000,
      on_timeout: options.on_timeout || (function() {}),
      on_finish: options.on_finish || (function() {}),
      on_route_change: options.on_route_change || (function() {}),
      
      // used in process_action_and_set_timeout
      action: options.action || {
        method: options.action.method || (function() {}),
        on_ok: options.action.on_ok || (function() {}),
        on_error: options.action.on_error || (function() {})
      },
      
      // data from the last iteration, or initilizer
      _poll_obj: options._poll_obj || {
        iterations: 0,
        start_time: date(),
        max_time: options.max_time,
        previous_route: get_route()
      }
    };
    
    var poll_forever = options.max_time == -1;
        
    // if timed out, run break callback.
    if (!poll_forever && (date().getTime() - options._poll_obj.start_time.getTime()) >= options.max_time) {
      options.on_timeout($.extend(options._poll_obj, { timed_out: true }));
    // if route changed, kill of the poll
    } else if (get_route() != options._poll_obj.previous_route) {
      options.on_route_change($.extend(options._poll_obj, { route_changed: true }));
    } else {
      // track the time at which this iteration started
      var start_time = date().getTime();
      
      // save the route before running the action, because the action
      // may or may not change the route.
      var current_route = get_route();

      options._poll_obj.iterations++;

      process_action_and_set_timeout(options);
    }
  });
  
  /*
    Helper method for poll. Reads the JSON object for the action,
    and calls it.
    
    @options same as from poll function
  */
  define('process_action_and_set_timeout', function(options) {
    var poll_forever = options.max_time == -1;
    var action_options = options.action;
    
    // calls the Badger API method
    action_options.method(function(response) {
      if (['ok', 'created'].includes(response.meta.status)) {
        // execute callback. break from poll defaults to true
        var break_from_poll = action_options.on_ok(response, options._poll_obj);
      } else {
        // error. break from poll defaults to true
        var break_from_poll = options.on_error(response, {
          start_time: options._poll_obj.start_time,
          max_time: options._poll_obj.max_time
        });
      }
      
      if (break_from_poll == true) {
        // break out of the poll, call the on_finish_callback
        options.on_finish(response, options._poll_obj);
      } else if (break_from_poll == false) {
        setTimeout(curry(long_poll, options), options.interval);
      } else if (break_from_poll == undefined) {
        if (poll_forever) return setTimeout(curry(long_poll, options), options.interval);
      }
    });
  });
  
  /*
    Override h1 to dynamically create <title> for page
  */
  define('h1', function() {
    var h1 = element('h1', arguments);
    var title = h1.innerText || h1.textContent;
    if (!title.match(/badger/i)) title += " (Badger)";
    document.title = title;
    return h1;
  });
  
  /*
    Animate progress bars, for the sake of prettiness
  */
  define('animate_progress_bars', function(original_width) {
    $(".meter > span").each(function() {
      $(this)
      .data("origWidth", $(this).width())
      .width(original_width || 0)
      .animate({
        width: $(this).data("origWidth")
        }, 600);
    });
  });
  
  /*
    Date wrapper, to fix things up for IE.
    you use it just like 'new Date()'.
    
    example:
    var my_date1 = date('10-10-2020');
    var my_date2 = date();
    
    don't do this:
    var my_bad_date = date(Date.parse('10-10-2020'))
  */
  define('date', function(date_string) {
    if (arguments.length == 1) {
      if (!date_string) return;
      return new Date(Date.parse(date_string));
    } else {
      return new Date();
    }
  });
  
  define('unauthorized_message', function(message) {
    return div({ style: 'text-align: center' },
      error_message(
        h2('Unauthorized Access'),
        p({ style: 'margin: 10px auto; font-style: italic; font-size: 16px' }, 'Stop right there!'),
        img({ style: 'width: 15%; height: 15%', src: 'images/badger-logo-sad-big.png' }),
        
        p({ style: 'font-size: 18px;' }, message || 'You do not have permission to view this content.')
      )
    );
  });

  /*
   * Return JSON object, rejecting key/value pairs for which the comparison function is true;
   * */
  define('reject_keys', function(obj, comparison) {
    var new_obj = {};
    for (k in obj) {
      if (typeof(obj[k]) !== 'function' && !comparison(k,obj[k])) new_obj[k] = obj[k];
    }
    return new_obj;
  });

  /*
   * Return JSON object, rejecting key/value pairs for which the comparison function is false;
   * */
  define('select_keys', function(obj, comparison) {
    var new_obj = {};
    for (k in obj) {
      if (typeof(obj[k]) !== 'function' && comparison(k,obj[k])) new_obj[k] = obj[k];
    }
    return new_obj;
  });

  /*
   * Convert a JSON object to a query string
   * */
  define('to_param',function(obj) {
    if (Object.keys(obj).length <= 0) return "";
    var query_string = "";
    for(k in obj) {
      if (typeof(obj[k]) !== 'function') query_string += (k + '=' + obj[k] + '&');
    }
    return query_string.slice(0,-1);
  });
}

String.prototype.capitalize_all = function() {
  var words = [];
  this.split(' ').forEach(function(word) {
    words.push( word.charAt(0).toUpperCase() + word.slice(1) );
  });
  return words.join(" ");
}

String.prototype.capitalize_first = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.escape_for_regexp = function() {
  var copy = this.slice(0);
  return copy.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

/**
Sick of using Array#indexOf of everywhere?
returns null if no arguments provided.
returns true if all arguments are included in the array.
returns false if any of the arguments are not in the array.
*/
Array.prototype.includes = function() {
  if (arguments.length < 1) return null;
  for (var i = 0; i < arguments.length; i++) { if (this.indexOf(arguments[i]) < 0) return false; }
  return true;
};

// == doesn't work for arrays, needed a way to check equality
Array.prototype.equal_to = function(array) {
  return array && JSON.stringify(this) == JSON.stringify(array);
};

// remove null and undefined values from array
Array.prototype.compact = function() {
  return this.filter(function(e) { return e != undefined; });
};

// return only the unique values of an array
Array.prototype.unique = function() {
  var unique_array = [];
  for (var i = 0; i < this.length; i++) {
    if (!unique_array.includes(this[i])) unique_array.push(this[i]);
  }
  return unique_array;
}

// The sorting algorithm in Chrome is not stable.
// Define a sorting method to guarantee stable sorts
// in all browsers.
// NOTE: unlike the vanilla JavaScript Array#sort,
// this method does not change the underlying object.
Array.prototype.stable_sort = function(compare) {
  var array2 = this.map(function(v, i) { return { i: i, v: v } });
  array2.sort(function(a, b) {
    if (compare) {
      var r = compare(a.v, b.v);
      return r == 0 ? a.i - b.i : r;
    } else {
      if (a.v < b.v) return -1;
      if (a.v > b.v) return 1;
      if (a.v == b.v) return 0;
      
      return r == 0 ? a.i - b.i : r;
    }
  });
  return array2.map(function(v) { return v.v });
};

Date.prototype.valid = function() {
  return isFinite(this);
};
