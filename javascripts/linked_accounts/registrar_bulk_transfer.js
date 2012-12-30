with (Hasher('RegistrarBulkTransfer','Application')) {
  
  route("#linked_accounts/:registrar/:linked_account_id/bulk_transfer", function(registrar, linked_account_id) {
    if (registrar == "godaddy") {
      var registrar_name = "GoDaddy";
    } else if (registrar == "networksolutions") {
      var registrar_name = "Network Solutions";
    } else if (registrar == "enom") {
      var registrar_name = "Enom";
    } else {
      render(
        div("Oh noes!")
      );
    }
      
    var domains_div = div(
      spinner("Loading your " + registrar_name + " domains...")
    );
    
    render(
      chained_header_with_links(
        { text: 'My Account', href: '#account' },
        { text: 'Linked Accounts', href: '#linked_accounts' },
        { text: registrar_name || 'Registrar' }
      ),
      
      div({ 'class': "sidebar" },
        info_message(
          h3("Registration Extension"),
          p("When you transfer a domain to Badger, the registration will be extended by 1 year.")
        ),
        
        info_message(
          h3("Pricing"),
          p("Transferring a domain to Badger requires 1 domain Credit.")
        )
      ),
      
      div({ 'class': "fancy has-sidebar" },
        div({ id: "bulk-transfer-error", style: "display: none" },
          error_message("There was a problem syncing your account, please try again."),
          p("We were unable to read any domains from your account at " + registrar_name + ". Do you have any domains registered there?")
          // p("If you have domains registered at " + registrar_name + " that did not show up, you should ", a({ href: null }, "sync"), " your account and try again later.")
        ),
        
        domains_div
      )
    );
    
    // check the linked account status. if it is synced, show all of the domains. if it is not, continue waiting.
    check_linked_account_status_and_set_timeout_if_needed(domains_div, registrar_name, linked_account_id);
  });
  
  define('check_linked_account_status_and_set_timeout_if_needed', function(target_div, registrar_name, linked_account_id) {
    Badger.getLinkedAccount(linked_account_id, function(response) {
      if (response.meta.status == 'ok') {
        if (response.data.status == 'synced') {
          render_domains_for_linked_account(target_div, registrar_name, parseInt(linked_account_id))
        } else if (response.data.status == 'error' || response.data.status == 'error_auth') {
          $("#bulk-transfer-error").show();
          $("#spinner-div").empty();
          $(target_div).empty();
        } else {
          $("#spinner-div").html(
            spinner(message_for_linked_account_status(response.data.status))
          );
          
          setTimeout(curry(check_linked_account_status_and_set_timeout_if_needed, target_div, registrar_name, linked_account_id), 10000);
        }
      } else {
        $("#bulk-transfer-error").show();
        $(target_div).empty();
      }
    });
  });
  
  define('message_for_linked_account_status', function(status) {
    if (status == "pending_sync")
      return "Account is pending sync...";
    else if (status == "syncing")
      return "Syncing account...";
    else
      return "Processing, please wait...";
  });
  
  define('render_domains_for_linked_account', function(target_div, registrar_name, linked_account_id) {
    Badger.getDomainsForLinkedAccount(parseInt(linked_account_id), function(domains) {
      // filter out domains whose current registrar does not match that of the request
      domains = domains.filter(function(domain) {
        if ((domain.current_registrar || "").match(/godaddy/i)) {
          return (!!registrar_name.match(/godaddy/i));
        } else if ((domain.current_registrar || "").match(/network\s*solutions/i)) {
          return (!!registrar_name.match(/network\s*solutions/i));
        } else if ((domain.current_registrar || "").match(/enom/i)) {
          return (!!registrar_name.match(/enom/i));
        } else {
          return false;
        }
      });
      
      if (domains && domains.length > 0) {
        render({ into: target_div },
          domains_table(domains),
          
          div({ style: "margin-top: 25px; text-align: center" },
            a({ id: "continue-button", 'class': "myButton large", href: curry(proceed_to_confirmation_page, registrar_name, linked_account_id, domains) }, "Continue")
          )
        );

        // select-all functionality
        $("input[name=select_all]").change(function(e) {
          if (this.checked) {
            $("input[name^=select_domain_]").each(function() {
              $(this).attr("checked","checked");
            });
          } else {
            $("input[name^=select_domain_]").each(function() {
              $(this).attr("checked",null);
            });
          }
        });
        
        // update the button
        $("input[type=checkbox]").change(function(e) {
          var num_domains_checked = $("input[name!=select_all]:checked").length
          var num_domains_unchecked = (domains.length - $("tr[class=success-row]").length);
          
          if (num_domains_unchecked <= 0) {
            $("input[name=select_all]").attr("checked", null);
          } else {
            $("input[name=select_all]").attr("checked", (num_domains_unchecked == num_domains_checked) ? "checked" : null);
          }
          
          if (num_domains_checked == 0) {
            $("#continue-button").html("Continue");
          } else if (num_domains_checked == 1 ) {
            $("#continue-button").html("Continue Transfer of " + num_domains_checked + " domain");
          } else if (num_domains_checked > 1 ) {
            $("#continue-button").html("Continue Transfer of " + num_domains_checked + " domains");
          }
        });
      } else {
        render({ into: target_div },
          p("We were unable to read any domains from your account at " + registrar_name + ". Do you have any domains registered there?")
        );
      }
    });
  });
  
  define('domains_table', function(domains) {
    return div({ 'class': "fancy has-sidebar", style: "width: 670px; min-height: 265px" },
      table({ 'class': "fancy-table" }, tbody(
        tr({ 'class': "table-header" },
          th({ style: "width: 5%" },
            input({ name: "select_all", type: "checkbox" })
          ),
          th({ style: "width: 25%" }, "Name"),
          th({ style: "width: 20%; text-align: center" }, "Current Expiration Date"),
          th({ style: "width: 20%; text-align: center" }, "New Expiration Date"),
          th({ style: "width: 35%; text-align: center" }, "DNS")
        ),
        
        (domains || []).map(function(domain) {
          var old_expires_at = date(domain.expires_at);
          var new_expires_at = date(old_expires_at.getFullYear() + 1, old_expires_at.getMonth(), old_expires_at.getDay());
          
          // if the domain is registered with us already, render it as successful row. otherwise, make it selectable
          if ((domain.current_registrar || "").match(/badger/i)) {
            return tr({ 'class': "success-row" },
              td(img({ src: "images/check.png" })),
              td(domain.name),
              // td({ style: "text-align: center" },
              //   span({ style: "font-style: italic" }, "Already registered with Badger")
              // ),
              td(),
              td(),
              td()
            );
          } else {
            return tr(
              td(
                input({ name: ("select_domain_" + domain.name), value: "", type: "checkbox" })
              ),
              td(domain.name),
              td({ style: "text-align: center" }, old_expires_at.toString("MMMM dd yyyy")),
              td({ style: "text-align: center" }, new_expires_at.toString("MMMM dd yyyy")),
              td({ style: "text-align: center" }, get_name_servers_text_and_set_new_nameservs(domain))
            );
          }
        })
      ))
    );
  });
  
  define('proceed_to_confirmation_page', function(registrar_name, linked_account_id, domains) {
    // get all of the domains that were checked
    var checked_domain_names = $("input[name^=select_domain_]:checked").map(function() {
      return this.name.split("_").slice(-1);
    });
    
    // filter out domains that were not checked
    domains = domains.filter(function(domain) {
      return ($.inArray(domain.name, checked_domain_names) >= 0);
    });
    
    // // save the domains so that they can be loaded on the next page
    Badger.Session.write({ domains: domains });
    
    set_route("#linked_accounts/" + registrar_name.toLowerCase() + "/" + linked_account_id + "/confirm_bulk_transfer");
  });
  
  // TODO: add to this as registrars are supported/recognized
  var PREVIOUS_REGISTRAR_NAME_SERVER_REGEXES = [
    /^ns\d+\.badger\.com$/i,
    /^ns\d+\.domaincontrol\.com$/i,
    /^ns\d+\.worldnic\.com$/i,
    /^ns\d+\.1and1\.com$/i,
    /^dns\d+\.name-services\.com$/i,
    /^[a-z]+\.dns\.gandi\.com$/i,
    /^ns\d+\.moniker\.com$/i,
    /^ns\d+\.register\.com$/i,
    /^ns\d+\.tucows\.com$/i,
    /^ns\d+\.melbourneit\.com\.au$/i,
    /^cns\d+\.secureserver\.net$/i
  ];
  
  // return an array of the new name servers based on the old ones.
  // for instance, if no name servers, or using previous registrars name servers,
  // return the Badger name servers.
  define('get_name_servers_text_and_set_new_nameservs', function(domain) {
    var using_previous_registrar_name_servers = false;
    
    PREVIOUS_REGISTRAR_NAME_SERVER_REGEXES.forEach(function(regex) {
      if (domain.name_servers && domain.name_servers[0].match(regex)) using_previous_registrar_name_servers = true;
    });
    
    if (!domain.name_servers || domain.name_servers.length < 1 || using_previous_registrar_name_servers) {
      // overwrite name servers, since they need to be Badger anyway if this is true
      domain.name_servers = ['ns1.badger.com', 'ns2.badger.com'];
      return "Migrate to Badger";
    } else {
      return domain.name_servers[0].split(".").slice(-2).join(".");
    }
  });
    
};
