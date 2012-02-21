with (Hasher('TwitterAccount','Application')) {
	
	define('show_link_accounts_modal', function(old_account_id) {
	  start_modal_spin("Loading...");
	  
    Badger.getLinkedAccountAuthorizationUrl("twitter", function(response) {
      var auth_window,
          auth_url = response.data;
          
  		show_modal(
  			h1("Link Your Twitter Account"),
  			div({ style: "margin: 15px 10px 15px 10px; text-align: center" },
  				"By linking your Twitter account with Badger.com, you will be able to share your domain registrations and transfers with your followers."
  			),
  			div({ align: "center" },
          a({ onclick: function() { auth_window = window.open(auth_url, "twitter-authorization", "width=600,height=600") } },
            img({ src: "images/linked_accounts/twitter.png" })
          )
  			)
  		);

      var watchClose = setInterval(function() {
        if (auth_window && auth_window.closed) {
          clearTimeout(watchClose);
          LinkedAccounts.close_window_and_reload_linked_accounts(old_account_id);
        }
      }, 200);
    });
	  
	});
	
};