with (Hasher('ConfirmRegistrarBulkTransfer', 'Application')) {
  
  route('#linked_accounts/:registrar/:linked_account_id/confirm_bulk_transfer', function(registrar, linked_account_id) {
    var domains_div = div(
      div({ style: "margin-top: 160px" },
        spinner("Loading...")
      )
    );
    
    render(
      h1("Confirm Domain Transfer"),
      
      div({ 'class': "sidebar" },
        info_message(
          h3("Estimated Time"),
          p("The transfer process usually finishes in under 1 hour, but in some cases, it may take between 1-5 days."),
          p("You can check the status of your pending transfers from the My Domains page at any time.")
        )
      ),
      
      div({ 'class': "fancy has-sidebar" },
        domains_div
      )
    );
    
    // read the domains from magical function
    fetch_domains(linked_account_id, registrar, function(domains) {
      if (domains.length == 0) {
        var transfer_button_text = "Continue";
      } else if (domains.length == 1) {
        var transfer_button_text = "Transfer " + domains.length + " Domains for " + domains.length + " Credit";
      } else {
        var transfer_button_text = "Transfer " + domains.length + " Domains for " + domains.length + " Credits";
      }
      
      render({ into: domains_div },
        form({ action: curry(bulk_transfer_domains, domains) },
        
          div({ id: "registrant-contact-div", style: "min-height: 265px" },
            p("put your stuff here. replace that hidden input field below."),
            
            
            // dummy data
            input({ type: "hidden", name: "registrant_contact_id", value: 1 })
          ),
          
          div({ style: "margin-top: 25px; text-align: center" },
            button({ id: "submit-button", 'class': "myButton large", value: "Submit", name: "submit" }, transfer_button_text)
          )
        )
      );
    });
  });

  // this will get domains from somewhere, for now just load them all
  define('fetch_domains', function(linked_account_id, registrar_name, callback) {
    Badger.getDomainsForLinkedAccount(linked_account_id, function(domains) {
      domains = domains.filter(function(domain) {
        // filter out domains whose current registrar does not match that of the request
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
      
      console.log(domains);
      
      callback(domains);
    });
  });
  
  
  
  define('bulk_transfer_domains', function(domains, form_data) {
    var domain_names = (domains || []).map(function(d) { return d.name }).join(",");
    
    // do something more elegant than hide the button
    $("#submit-button").hide();

    Badger.bulkTransferDomains(form_data.registrant_contact_id, domain_names, function(response) {
      console.log(response);
      
      // change this maybe?
      set_route("#domain-transfers");
      
      update_credits(true);
    });
  });
  
};