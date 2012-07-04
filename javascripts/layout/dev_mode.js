if (window.localStorage !== undefined) {
  // chrome/ff
  window.devLocalStorage = window.localStorage;
  Badger.getAccessToken = function() { return devLocalStorage.getItem(Badger.access_token_key); }
  Badger.setAccessToken = function(token) { token ? devLocalStorage.setItem(Badger.access_token_key, token) : devLocalStorage.removeItem(Badger.access_token_key); }
}
else {
  // on IE, just store in global var, get lost on each refresh tho
  // also cookies appear to work for ie, should update below to store cookies
  window.devLocalStorage = {
    getItem: function(key) { return this.store[key]; },
    setItem: function(key, value) { this.store[key] = value; },
    removeItem: function(key) { this.store[key] = undefined; },
    store: { badger_api: 'dev' } // force to dev for now
  }; 
}

if (devLocalStorage.getItem('badger_api') == 'dev') {
  Badger.api_host = 'http://api.badger.dev/';
  Badger.access_token_key = 'badger_access_token_dev';
} else if (devLocalStorage.getItem('badger_api') == 'qa') {
  Badger.api_host = 'https://api-qa.badger.com/';
  Badger.access_token_key = 'badger_access_token_qa';
} else if (devLocalStorage.getItem('badger_api') == 'demo') {
  Badger.demo_mode = true;
  Badger.api_host = 'https://api-qa.badger.com/';
} else if (navigator.userAgent == 'Selenium') {
  Badger.api_host = 'http://test.example/';
  Badger.access_token_key = 'badger_access_token_test';
} else {
  Badger.api_host = 'https://api.badger.com/';
  Badger.access_token_key = 'badger_access_token_prod';
}

with (Hasher()) {
  define('set_api_host', function(env) {
    devLocalStorage.setItem('badger_api', env);
    document.location.reload();
  });

  after_filter('add_dev_mode_bar', function() {
    if (!document.getElementById('dev-bar')) {
      document.body.appendChild(
        div({ id: 'dev-bar', style: "position: fixed; bottom: 0; right: 0; background: white; color: black; padding: 5px; z-index: 200" }, 
          (Badger.api_host == 'http://test.example/' ? [b('test'), ' | '] : []),
          (Badger.demo_mode ? b('demo') : a({ href: curry(set_api_host, 'demo') }, 'demo')), 
          ' | ',
          (Badger.api_host == 'http://api.badger.dev/' ? b('dev') : a({ href: curry(set_api_host, 'dev') }, 'dev')), 
          ' | ',
          ((Badger.api_host == 'https://api-qa.badger.com/' && !Badger.demo_mode) ? b('qa') : a({ href: curry(set_api_host, 'qa') }, 'qa')),
          ' | ',
          (Badger.api_host == 'https://api.badger.com/' ? b('prod') : a({ href: curry(set_api_host, 'prod') }, 'prod'))
        )
      );
    }
  });
}
