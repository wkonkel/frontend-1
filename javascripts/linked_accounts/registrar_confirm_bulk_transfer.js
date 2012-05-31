with (Hasher('ConfirmRegistrarBulkTransfer', 'Application')) {
  route('#linked_accounts/:registrar/:linked_account_id/confirm_bulk_transfer', function(registrar, linked_account_id) {
    if (registrar == "godaddy") {
      var REGISTRAR_NAME = "GoDaddy";
    } else if (registrar == "networksolutions") {
      var REGISTRAR_NAME = "Network Solutions";
    } else if (registrar == "enom") {
      var REGISTRAR_NAME = "Enom";
    } else {
      render(
        div("Oh noes!")
      );
    }
    
    var domains_div = div({ 'class': 'fancy' },
      spinner("Loading...")
    );
    
    render(
      // h1("Confirm Domain Transfer"),
      chained_header_with_links(
        { href: '#account', text: 'My Account' },
        { href: '#linked_accounts', text: 'Linked Accounts' },
        { text: REGISTRAR_NAME || 'Registrar' }
      ),
      
      
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
    
    with (Badger.Session.read('domains')) {
      var transfer_button_text;
      if (domains.length == 0) {
        transfer_button_text = "Continue";
      } else if (domains.length == 1) {
        transfer_button_text = "Transfer " + domains.length + " Domain for " + domains.length + " Credit";
      } else {
        transfer_button_text = "Transfer " + domains.length + " Domains for " + domains.length + " Credits";
      }

      var domains_table = div({ style: 'overflow: auto; min-height: 150px; max-height: 250px; border: 1px #333 solid; border-radius: 5px; padding: 5px' },
        table({ 'class': 'fancy-table has-sidebar', style: 'overflow: auto; min-height: 200px' }, tbody(
          tr({ 'class': 'table-header' },
            th('Domain')
          ),

          (domains || []).map(function(domain) {
            return tr(
              td(domain.name)
            );
          })
        ))
      );

      render({ into: domains_div },
        form_with_loader({ 'class': 'fancy', action: curry(bulk_transfer_domains, domains), loading_message: 'Initiating transfer of ' + domains.length + ' domains...' },
          domains_table,

          input({ type: 'hidden', name: 'auto_renew', value: 'true'}),
          input({ type: 'hidden', name: 'privacy', value: 'true'}),

          Contact.selector_with_all_form_fields({ name: 'registrant_contact_id' }),

          fieldset({ 'class': 'no-label' },
            submit({ id: 'register-button', value: transfer_button_text })
          )
        )
      );
    }
  });  
  
  define('bulk_transfer_domains', function(domains, form_data) {
    var domain_names = (domains || []).map(function(d) { return d.name }).join(",");
    
    // do something more elegant than hide the button
    $("#submit-button").hide();

    for (i in domains) {
      var d = domains[i];
      
      // just queue these without caring about the response.
      // if they fail, their statuses should be shown on the transfers
      // screen.
      Badger.transferDomain({
        name: d.name,
        name_servers: d.name_servers,
        registrant_contact_id: form_data.registrant_contact_id,
        privacy: form_data.privacy,
        auto_renew: form_data.auto_renew
      }, function(response) { /* console.log(response) */ });
    }
    
    set_route("#domain-transfers");
    update_credits(true);
  });
  
};