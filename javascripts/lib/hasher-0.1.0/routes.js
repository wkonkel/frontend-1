Hasher.routes = [];

with (Hasher()) {
  // check for new routes on the browser bar every 100ms
  initializer(function() {
    Hasher.request_data = request_data();
    
    var callback = function() {
      setTimeout(callback, 100);
      var hash = get_route();
      if (hash != Hasher.current_route) set_route(hash, { skip_updating_browser_bar: true });
    }
    callback();
  });
 
  // define a route
  //   route('#', function() {})  or  route({ '#': function(){}, '#a': function(){} })
  define('route', function(path, callback) {
    if (typeof(path) == 'string') {
      Hasher.routes.push({
        regex: (new RegExp("^" + path.replace(/:[a-z_]+/g, '([^/]+)') + '$')),
        callback: callback,
        context: this
      });
    } else {
      for (var key in path) {
        this.route(key, path[key]);
      }
    }
  });
  
  define('get_query_string', function() {
    tmp_arr = window.location.hash.split('?');
    return (tmp_arr.length > 1) ? tmp_arr.slice(-1)[0] : '';
  });
  
  define('query_params', function(url) {
    var params = {},
        key_val_pairs = get_query_string().split('&');
    for (var i=0; i<key_val_pairs.length; i++) {
      key_val_pair = key_val_pairs[i].split('=');
      if (key_val_pair.length == 2) params[key_val_pair[0]] = decodeURIComponent(key_val_pair[1]);
    }
    return params;
  });

  // get the path, query string, and query params in a hash
  define('request_data', function() {
    var data = {
      path: (window.location.hash.length > 0 ? window.location.hash : '#').split('?')[0],
      query_string: (get_query_string().length > 0 ? ('?' + get_query_string()) : ''),
      params: query_params()
    };



    return data;
  });

  // return the current route as a string from browser bar
  define('get_route', function() {
    var path_bits = window.location.href.split('#');
    var r = '#' + (path_bits[1] || '');
    return r;
  });

  define('set_route', function(path, options) {
    // super hax to fix layout bug
    if (document.getElementById('_content')) { 
      document.getElementById('_content').setAttribute('id','content');
    }
    
    if (!options) options = {};
    
    if (!options.skip_updating_browser_bar) {
      if (options.replace) {
        window.location.replace(window.location.href.split('#')[0] + path);
      } else {
        window.location.href = window.location.href.split('#')[0] + path;
      }
    }
    Hasher.current_route = path;

    if (options.reload_page) {
      window.location.reload();
      return;
    }
    
    if (typeof(_gaq) != 'undefined') _gaq.push(['_trackPageview', path]);
    
    // rebuild request data
    Hasher.request_data = request_data();
    
    for (var i=0; i < Hasher.routes.length; i++) {
      var route = Hasher.routes[i];
      var matches = Hasher.request_data.path.match(route.regex);
      if (matches) {
        // scroll to the top of newly loaded page --- CAB
        window.scrollTo(0, 0);
        
        if (!route.context.run_filters('before')) return;
        route.callback.apply(null, matches.slice(1));
        if (!route.context.run_filters('after')) return;
        return;
      }
    }

    alert('404 not found: ' + path);
  });
  
  define('reload_page_with_route', function(path) {
    Hasher.current_route = path;
    window.location.href = window.location.href.split('#')[0] + path;
    window.location.reload();
  });
}