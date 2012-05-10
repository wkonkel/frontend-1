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
