with (Hasher('LinkedAccounts','Application')) {

  var domain_account_sites = ['godaddy', 'networksolutions', 'enom'],
      social_app_sites = ['facebook', 'twitter'];

  route('#linked_accounts', function() {
    if (!logged_in()) {
      return set_route('#account/create');
    }

    var target_div = div(
      spinner("Loading...")
    );

    render(
      div(
        chained_header_with_links(
          { text: 'My Account', href: '#account' },
          { text: 'Linked Accounts' }
        ),
        
        Account.account_nav_table(target_div)
      )
    );

    BadgerCache.getLinkedAccounts(function(response) {
      var my_accounts_div;
      if ((response.data || []).length > 0) {
        my_accounts_div = div({ style: 'margin-bottom: 20px;' },
          my_linked_accounts_table(response.data)
        )
      }
      
      render({ into: target_div },
        div({ 'class': 'sidebar' },
          info_message(
            h3("Link an Account"),
            p("Link one of your other registrar accounts, such as GoDaddy, to manage all of your domains at Badger.")
          )
        ),
        
        div({ 'class': 'fancy has_sidebar'},
          my_accounts_div,
          h2('Link an Account with Domains'),
          add_linked_account_icons(domain_account_sites),
          h2('Link a Facebook or Twitter Account'),
          add_linked_account_icons(social_app_sites)
        )
      );
    });
  });
  
  define('add_linked_account_icons', function() {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);
    
    // to only show certain accounts, pass their site strings in as arguments
    if (arguments.length > 0) var accounts_to_show = arguments;

    var table_row_1 = [];

    if (!accounts_to_show || accounts_to_show.includes('godaddy')) {
      table_row_1.push(
        td(
          app_store_icon({
            name: 'GoDaddy',
            image_src: 'images/apps/godaddy.png',
            href: '#linked_accounts/godaddy/link',
            size: options.size || 'normal'
          })
        )
      )
    }

    if (!accounts_to_show || accounts_to_show.includes('networksolutions')) {
      table_row_1.push(
        td(
          app_store_icon({
            name: 'Network Solutions',
            image_src: 'images/apps/ns.png',
            href: '#linked_accounts/networksolutions/link',
            size: options.size || 'normal'
          })
        )
      )
    }
    
    if (!accounts_to_show || accounts_to_show.includes('enom')) {
      table_row_1.push(
        td(
          app_store_icon({
            name: 'Enom',
            image_src: 'images/apps/enom.png',
            href: '#linked_accounts/enom/link',
            size: options.size || 'normal'
          })
        )
      )
    }

    if (!accounts_to_show || accounts_to_show.includes('facebook')) {
      table_row_1.push(
        td(
          app_store_icon({
            name: 'Facebook',
            image_src: 'images/apps/facebook.png',
            href: link_facebook_account,
            size: options.size || 'normal'
          })
        )
      )
    }
    
    if (!accounts_to_show || accounts_to_show.includes('twitter')) {
      table_row_1.push(
        td(
          app_store_icon({
            name: 'Twitter',
            image_src: 'images/apps/twitter.png',
            href: curry(link_social_account, 'twitter'),
            size: options.size || 'normal'
          })
        )
      )
    }
  
    // remove the extra size attribute
    delete options.size;
  
    return table(options, tbody(
      tr(table_row_1)
    ));
  });
  
  define('my_linked_accounts_table', function(linked_accounts) {
    if ((linked_accounts || []).length <= 0) {
      return div();
    }
    
    return div({ 'class': 'has-sidebar' },
      table({ 'class': 'fancy-table' }, tbody(
       tr({ 'class': 'table-header'},
         th({ style: 'width: 15%; vertical-align: middle' }),
         th({ style: 'width: 20%' }, "Site"),
         th({ style: 'width: 45%'}, "Username"),
         th({ style: 'width: 45%'}, "Status"),
         th({ style: 'width: 5%'}) // delete account button
       ),
       linked_accounts.map(function(linked_account) {
         return linked_account_table_row(linked_account);
       })
      ))
    )
  });
  
  define('linked_account_table_row', function(linked_account) {
    var linked_account_name, icon_src;
    
    if (linked_account.site == 'networksolutions') {
      linked_account_name = "Network Solutions";
      icon_src            = "images/apps/ns.png";
    } else if (linked_account.site == 'godaddy') {
      linked_account_name = "GoDaddy";
      icon_src            = "images/apps/godaddy.png";
    } else if (linked_account.site == 'enom') {
      linked_account_name = "Enom";
      icon_src            = "images/apps/enom.png";
    } else if (linked_account.site == 'facebook') {
      linked_account_name = "Facebook";
      icon_src            = "images/apps/facebook.png";
    } else if (linked_account.site == 'twitter') {
      linked_account_name = "Twitter";
      icon_src            = "images/apps/twitter.png";
    }
        
    return tr(
      td({ align: 'center' }, img({ 'class': 'app_store_icon', src: icon_src, style: 'width: 50px; height: 50px; margin: 5px auto auto auto' })),
      td(linked_account_name),
      td(linked_account.login),
      td(['error_auth', 'unlinked', 'error'].includes(linked_account.status) ? span({ style: 'font-style: italic; font-weight: bold; color: red' }, linked_account.status) : linked_account.status),
      td(delete_linked_account_button(linked_account))
    );
  });
  
  define('delete_linked_account_button', function(linked_account) {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);
    
    return div(options,
      a({ href: curry(Registrar.remove_link, linked_account) }, img({ src: 'images/icon-no-light.gif' }))
    );
  });

  // proprietary FB account link
  define('link_facebook_account', function() {
    FB.login(function(fb_response) {
      if (fb_response.status == 'connected') {
        FB.api('/me', function(fb_user_response) {
          Badger.createLinkedAccount({ site: 'facebook', 'login': fb_user_response.username, 'access_token': fb_response.authResponse.access_token }, function(response) {
            BadgerCache.reload('linked_accounts');
            set_route(get_route());
          });
        });
      }
    }, { scope: 'email, publish_stream' });
  });

  define('link_social_account', function(site, callback) {
    var auth_url;
    if (site == 'facebook') auth_url = Badger.api_host + "auth/facebook?state=" + Badger.getAccessToken();
    else if (site == 'twitter') auth_url = Badger.api_host + "auth/twitter?access_token=" + Badger.getAccessToken();

    var auth_window;
    
    // show prompt to automatically follow Badger account, 
    // and have us follow the user.
    var auto_follow_prompt = div();
    if (site == 'twitter') {
      render({ into: auto_follow_prompt },
        div({ style: 'text-align: center; margin-top: 10px; font-size: 16px;' },
          span(checkbox({ name: 'auto_follow', checked: 'checked' }), span({ 'class': 'big-text' }, " Follow @Badger"))
        )
      )
    }

    var content_modal = show_modal(
      h1("Link Your " + site.capitalize_first() + " Account"),
      div({ style: "margin: 15px 10px 15px 10px; text-align: center" },
        "By linking your " + site.capitalize_first() + " account with Badger, you will be able to share your domain registrations and transfers with your followers."
      ),
      div({ align: "center" },
        // IE does not support a name for the window, so leave it empty.
        a({ onclick: function(e) {
              // if the 'automatically follow @Badger' box checked, append to auth_url
              auth_url += "&auto_follow=" + ($(":checked").length > 0).toString();
              auth_window = window.open(auth_url, "" ,"width=600,height=600");

              var watchClose = setInterval(function() {
                if (auth_window && auth_window.closed) {
                  clearTimeout(watchClose);
                  hide_modal();
                  BadgerCache.reload('linked_accounts');
                  set_route("#linked_accounts");
                }
              }, 200);
            }
          },
          ((site == 'facebook') && img({ src: "images/linked_accounts/facebook.png" })) || 
          ((site == 'twitter') && img({ src: "images/linked_accounts/twitter.png" }))
        )
      ),

      auto_follow_prompt
    );
  })
  
  
  
  
  
  
  
  
  
  
  // define('add_linked_accounts_modal', function(accounts) {
  //  show_modal(
  //    h1('Add Linked Account'),
  //    table({ 'class': "fancy-table" }, tbody(
  //      show_account_link_rows(accounts)
  //    ))
  //  );
  // });
  // 
  // define('linked_accounts_table', function(accounts) {
  //  var accounts_table = table({ id: "accounts-table", 'class': "fancy-table" }, tbody(
  //    // if the user has not linked any accounts yet, we want to show all of the accounts that they can link immediately.
  //    accounts.length == 0 ? [
  //      show_account_link_rows(accounts)
  //    ] : [
  //      (accounts || []).map(function(account) {
  //        if (account.site == "twitter") {
  //          return linked_accounts_table_row("Twitter",
  //            div({ id: ("twitter-" + account.id), style: "text-align: center" },
  //              img({ src: "images/ajax-loader.gif" })
  //            )
  //          );
  //        } else if (account.site == "facebook") {
  //          return linked_accounts_table_row("Facebook",
  //            div({ id: ("facebook-" + account.id), style: "text-align: center" },
  //              img({ src: "images/ajax-loader.gif" })
  //            )
  //          );
  //        } else if (account.site == "godaddy" || account.site == "networksolutions") {
  //          var name = 'Unknown';
  //          var status = 'Unknown';
  //            var error = false;
  //            switch (account.status) {
  //              case 'synced':
  //                status = 'Linked'
  //                break;
  //              case 'error_auth':
  //                status = span({ 'class': 'error-red' }, 'Login Failure')
  //                error = true;
  //                break
  //            }
  //            switch (account.site) {
  //              case 'godaddy':
  //                name = 'GoDaddy, Inc.';
  //                break;
  //              case 'networksolutions':
  //                name = 'Network Solutions LLC';
  //                break;
  //            }
  //            
  //          return linked_accounts_table_row(name, 
  //            div({ id: (account.site + "-" + account.id) },
  //              div({ 'class': error ? "error-message" : "status-message", style: "position: relative; text-align: right; margin: 5px auto 5px auto; height: 95px; width: 370px; padding: 10px;" },
  //                   h3("Status: ", status),
  //                   div("Last Sync: " + (account.last_synced_at ? date(account.last_synced_at).toString('MMMM dd yyyy') : 'Never')),
  //                div("Login: " + account.login + " (" + account.domain_count + " Linked Domain" + (account.domain_count != 1 ? 's' : '') + ")"),
  //                a({ 'class': "myButton small grey", style: 'margin: 10px 0 0;', href: curry(Registrar.remove_link, account) }, "Unlink"),
  //                span(' '),
  //                error ? a({ 'class': "myButton small red", style: 'margin: 10px 0 0;', href: curry(Registrar.show_link, account)}, "Fix Now")
  //                  : a({ 'class': "myButton small", style: 'margin: 10px 0 0;', href: curry(Registrar.sync_now, account)}, "Sync Now")
  //              )
  //            )
  //          );
  //        } else {
  //          console.log("Unknown account (" + account.site + ")", account);
  //        }
  //      })
  //    ]
  //  ));
  //  
  //  // after the table is created, run the linked account remote info commands to add data
  //  (accounts||[]).map(function(account) {
  //    if (account.site == 'facebook' || account.site == 'twitter') update_linked_account_row_handler(account);
  //  });
  //  
  //  return accounts_table;
  // });
  // 
  // define('linked_accounts_table_row', function(site, button) {
  //  return tr(
  //    td({ width: "70%" }, div({ style: "font-weight: bold; font-size: 20px; padding-left: 15px;" }, site)),
  //    td({ width: "30%" }, button)
  //  );
  // });
  // 
  // define('update_linked_account_row_handler', function(account) {
  //   // the cache is too damn fast, compensate a little for that
  //   if ($("#accounts-table").length == 0) {
  //     setTimeout(function() {
  //        update_linked_account_row_handler(account);
  //      }, 100);
  //   }
  //   
  //     BadgerCache.getAuthorizedAccountInfo(account.id, function(response) {
  //    if (response.data.status == "linked") {
  //      $("#" + account.site + "-" + account.id).html(
  //        div({ 'class': "status-message", style: "margin: 5px auto 5px auto; height: 25px; width: 350px;" },
  //          img({ style: "margin-top: -11px", src: response.data.profile_image_url }),
  //          div({ style: "float: right; margin: 4px 25px auto auto;" }, response.data.name + " (" + response.data.username + ")")
  //        )
  //      ).css("text-align", "left");
  //    } else {
  //         if (account.site == "twitter")
  //           var link_action = curry(TwitterAccount.show_link_accounts_modal, response.data.id);
  //         else if (account.site == "facebook")
  //           var link_action = curry(FacebookAccount.show_link_accounts_modal, response.data.id);
  // 
  //      $("#" + account.site + "-" + account.id).html(
  //        div({ style: "margin: 15px 15px 15px auto; float: right" },span({ 'class': "error" }, "Account unlinked. ", a({ href: link_action }, "Link again?")))
  //      ).css("text-align", "left");
  //    }
  //  });
  // });
  // 
  // define('link_accounts_button', function(target) {
  //  return a({ 'class': "myButton", style: "float: right; margin: 5px auto 5px auto", href: target }, "Link");
  // });
  // 
  // define('authorize_account', function() {
  //  Badger.authorizeLinkedAccount("developer", function(response) {
  //    console.log(response);
  //  });
  // });
  // 
  // define('show_account_link_rows', function(accounts) {
  //  var sites = accounts.map(function(a) { return a.site });
  // 
  //     // always there
  //     var result = [
  //       linked_accounts_table_row("GoDaddy", link_accounts_button(curry(Registrar.show_link, {site: 'godaddy'}))),
  //       linked_accounts_table_row("Network Solutions", link_accounts_button(curry(Registrar.show_link, {site: 'networksolutions'})))
  //     ];
  // 
  //     // only linked once    
  //  if ($.inArray("twitter", sites) < 0) result.push(
  //    linked_accounts_table_row("Twitter", link_accounts_button(curry(TwitterAccount.show_link_accounts_modal)))
  //  );
  //  if ($.inArray("facebook", sites) < 0) result.push(
  //    linked_accounts_table_row("Facebook", link_accounts_button(curry(FacebookAccount.show_link_accounts_modal)))
  //  );
  //    
  //  return result;
  // });
  // 
  // define('close_window_and_reload_linked_accounts', function(old_account_id) {
  //   // BadgerCache.flush('linked_accounts');
  //   
  //   // if fixing broken linked account, delete the old one
  //   if (old_account_id) {
  //     Badger.deleteLinkedAccount(old_account_id, function(response) {
  //       hide_modal();
  //        set_route("#linked_accounts");
  //     });
  //   } else {
  //       hide_modal();
  //      set_route("#linked_accounts");
  //   }
  // });

}
