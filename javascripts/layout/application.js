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
