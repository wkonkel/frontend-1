with (Hasher('Application')) {

  initializer(function() {
    if (Badger.getAccessToken()) BadgerCache.load();
  
    // an API call was made that requires auth
    Badger.onRequireAuth(function() {
      Badger.setCookie('badger_url_after_auth', get_route());
      set_route('#account/create');
    });

    Badger.onLogin(function() {
      set_route('#', { reload_page: true });
    });

    Badger.onLogout(function() {
      set_route('#', { reload_page: true });
    });
  });

  route('#', function() {
    if (Badger.getAccessToken()) {
      var next_url = Badger.getCookie('badger_url_after_auth');
      if (next_url) {
        Badger.setCookie('badger_url_after_auth', null);
      } else {
        next_url = '#filter_domains/all/list';
      }
      set_route(next_url);
    } else {
      set_route('#welcome');
    }
  });
  
  /*
    Poll until response returns true.
    If times out, runs the on_timeout callback.
    If the route is changed, will stop polling.
    
    This method creates a 'poll' object on the session, with keys
    matching the routes on which the poll is taking places.
    The poll object looks like:
    {
      elapsed: 1899, // the elapsed time(ms) the poll has been running for
      timeout: 5000, // the time(ms) after which to timeout
      previous_route: '#domains/awesome.com' // the previous route, break poll if differs from current route
    }
    
    Options:
    @max_time:        Number of seconds after which to timeout.
    @interval:        The amount of time to wait between requests
    @action:          The API request to be made every step.
                        if returns true, breaks poll, otherwise it will
                        continue until until the timeout.
                        NOTE: this function must take a callback as it's
                        last paremeter (TODO allow synchronous)
    @on_timeout:      The function to be called when timeout is reached
    @on_finish:       The function to be called when the action is finished
    @on_route_change: The function to be called if the route is changed mid-poll
    
    Callbacks are invoked with this JSON object as the argument:
    {
      elapsed_time: 1123,
      max_time: 30000,
    }
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
        arguments: options.action.arguments || [],
        on_ok: options.action.on_ok || (function() {}),
        on_error: options.action.on_error || (function() {})
      },
      
      // data from the last iteration, or initilizer
      _poll_obj: options._poll_obj || {
        start_time: new Date(),
        max_time: options.max_time,
        previous_route: get_route()
      }
    };
        
    // if timed out, run break callback.
    if ((new Date().getTime() - options._poll_obj.start_time.getTime()) >= options.max_time) {
      options.on_timeout({
        start_time: options._poll_obj.start_time,
        max_time: options._poll_obj.max_time,
        timed_out: true
      });
    // if route changed, kill of the poll
    } else if (get_route() != options._poll_obj.previous_route) {
      options.on_route_change({
        start_time: options._poll_obj.start_time,
        max_time: options._poll_obj.max_time,
        route_changed: true
      });
    } else {
      // track the time at which this iteration started
      var start_time = new Date().getTime();
      
      // save the route before running the action, because the action
      // may or may not change the route.
      var current_route = get_route();

      process_action_and_set_timeout(options);
    }
  });
  
  /*
    Helper method for poll. Reads the JSON object for the action,
    and calls it.
    
    @options same as from poll function
  */
  define('process_action_and_set_timeout', function(options) {
    var action_options = options.action;
    
    // calls the Badger API method
    action_options.method(function(response) {
      if (['ok', 'created'].includes(response.meta.status)) {
        // execute callback. break from poll defaults to true
        var break_from_poll = action_options.on_ok(response, {
          start_time: options._poll_obj.start_time,
          max_time: options._poll_obj.max_time
        }) || false;
      } else {
        // error. break from poll defaults to true
        var break_from_poll = options.on_error(response, {
          start_time: options._poll_obj.start_time,
          max_time: options._poll_obj.max_time
        }) || true;
      }
      
      if (break_from_poll) {
        options.on_finish(response, {
          start_time: options._poll_obj.start_time,
          max_time: options._poll_obj.max_time
        });
      } else {
        setTimeout(curry(long_poll, options), options.interval);
      }
    })
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

/**
I am sick of using indexOf() of everywhere.
returns null if no arguments provided.
returns true if all arguments are included in the array.
returns false if any of the arguments are not in the array.
*/
Array.prototype.includes = function() {
  if (arguments.length < 1) return null; 
  for (i in arguments) { if (this.indexOf(arguments[i]) < 0) return false; }
  return true;
};
