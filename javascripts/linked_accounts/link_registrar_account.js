with (Hasher('LinkRegistrarAccount','Application')) {

  // redirect to account create if not logged in
  before_filter(function() {
    if (!Badger.getAccessToken()) set_route('#account/create');
  });

  route("#linked_accounts/:registrar/link", function(registrar) {
    if (registrar == "godaddy") {
      render_registrar_link_form(registrar, "GoDaddy", "images/apps/godaddy.png");
    } else if (registrar == "networksolutions") {
      render_registrar_link_form(registrar, "Network Solutions", "images/apps/ns.png");
    } else if (registrar == "enom") {
      render_registrar_link_form(registrar, "Enom", "images/apps/enom.png");
      // render_coming_soon_page(registrar, "Enom", "images/apps/enom.png");
    } else {
      render_coming_soon_page(registrar);
    }
  });
  
  define('render_registrar_link_form', function(registrar_id, registrar_name, registrar_logo) {
    render(
      chained_header_with_links(
        { text: 'My Account', href: '#account' },
        { text: 'Linked Accounts', href: '#linked_accounts' },
        { text: registrar_name || 'Registrar' }
      ),
      
      div({ 'class': 'sidebar' },
        info_message(
          h3("Is this permanent?"),
          p("No. You can unlink your account at any time on the Linked Accounts page.")
        )
      ),
      
      form_with_loader({ 'class': 'fancy has-sidebar', action: curry(create_linked_account_and_verify_login, registrar_id), loading_message: 'Verifying your login credentials...' },
        div({ style: "margin-left: 110px" },
          div({ style: "float: left; margin: auto 20px 20px auto" },
            img({ 'class': "app_store_icon", src: registrar_logo })
          ),
          p("Why link your " + registrar_name + " account with Badger?"),
          ul({ style: "margin-left: 100px" },
            li("Control all your " + registrar_name + " and Badger domains in one place with our fast, ad-free site."),
            li("Linked domains can be transferred into Badger", b(" automatically"), ".  We'll handle the hard parts like auth codes."),
            li("Easily configure your domain to support services like Gmail with Badger Apps.")
          ),
          p("To link your " + registrar_name + " account, enter your login credentials below.")
        ),

        div({ id: 'account-link-errors' }),
        
        fieldset(
          label({ 'for': 'username-input' }, 'Login:'),
          div(input({ id: 'username-input', name: 'login', placeholder: 'johndoe' }))
        ),

        fieldset(
          label({ 'for': 'password-input' }, 'Password:'),
          div(input({ id: 'password-input', type: 'password', name: 'password', placeholder: 'abcd1234' }))
        ),

        fieldset(
          label({ 'for': 'agree_to_terms' }, 'Legal stuff:'),
          div({ style: 'line-height: 18px; padding: 15px 0' }, 
            input({ type: 'checkbox', name: 'agree_to_terms', id: 'agree_to_terms', value: true }),
            label({ 'class': 'normal', 'for': 'agree_to_terms' }, " I hereby authorize Badger to act as my agent and to access my " + registrar_name + " account pursuant to the ", a({ href: '#terms_of_service' }, "Registration Agreement"), '.')
          )
        ),

        fieldset({ 'class': 'no-label' },
          div({ id: "button-div" },
            input({ 'class': 'myButton large', type: 'submit', value: 'Link Account' })
          )
        )
      )
    );
    
    $("input[name=login]").focus();
  });

  define('render_coming_soon_page', function(registrar_id, registrar_name, registrar_logo) {
    if (!registrar_name) registrar_name = registrar_id;
    render(
      chained_header_with_links(
        { text: 'My Account', href: '#account' },
        { text: 'Linked Accounts', href: '#linked_accounts' },
        { text: registrar_name || 'Registrar' }
      ),
      
      div({ 'class': 'sidebar' },
        info_message(
          h3("Why link your " + registrar_name + " account?"),
          p("Linking your account automates the transfer process. Let us do the work for you.")
        )
      ),
      
      div({ 'class': 'has-sidebar' },
        (registrar_logo && div({ style: "float: left; margin: auto 20px 20px auto" },
          img({ 'class': "app_store_icon", src: registrar_logo })
        )),
        div({ style: 'float: left; margin-top: 25px' }, error_message("Sorry, we don't support " + registrar_name + " yet but hope to soon!"))
      )
    );
  });

  // // POST to Badger API, render errors if returned
  // // if successful, should drop a queue message to sync the account,
  // // reading domains from the registrar.
  // define('link_account', function(registrar, form_data) {
  //   if (!form_data.agree_to_terms) {
  //     $("#account-link-errors").html(
  //       error_message("You must allow Badger to act as your agent to proceed.")
  //     );
  //     hide_form_submit_loader();
  //     return;
  //   }
  //   
  //   // add registrar to form data
  //   form_data.site = registrar;
  //   
  //   Badger.createLinkedAccount(form_data, function(response) {
  //     if (response.meta.status == 'ok') {
  //       set_route("#linked_accounts/" + registrar + "/" + response.data.id + "/bulk_transfer");
  //     } else {
  //       // render the error message
  //       $("#account-link-errors").html(
  //         error_message(response.data.message)
  //       );
  //       
  //       hide_form_submit_loader();
  //     }
  //   });
  // });
  
  
  define('create_linked_account_and_verify_login', function(registrar, form_data) {
    // add registrar to form data
    form_data.site = registrar;
    
    // finds or creates linked account based on site and login
    Badger.createLinkedAccount(form_data, function(response) {
      if (response.meta.status == 'ok') {
        // if the account was created, poll until the login is validated
        poll_until_account_synced(registrar, response.data.id);
        BadgerCache.reload('linked_accounts');
      } else {
        hide_form_submit_loader();
        $('#account-link-errors').html(error_message(response));
      }
    });
  });

  define('poll_until_account_synced', function(registrar, id) {
    long_poll({
      max_time: 60000,
      interval: 1500,
      
      on_timeout: function(poll_data) {
        hide_form_submit_loader();
        $('#account-link-errors').html(
          error_message("Oh no, The request timed out! please try again later.")
        );
      },
      
      on_finish: function(poll_data) {
        set_route('#domains');
      },
      
      action: {
        method: curry(Badger.getLinkedAccount, id),
        
        on_ok: function(response, poll_data) {
          // status is in form of "synced" or "error_auth:Some descriptive message here."
          var parts = response.data.status.split(':');
          var status = parts.shift();
          var message = parts.join(':');
          
          switch (status) {
            case 'error_auth':
              hide_form_submit_loader();
              $('#account-link-errors').html(error_message(message));
              return; //no value meaning stop timer
            case 'error':
              hide_form_submit_loader();
              $('#account-link-errors').html(error_message("An unknown error occured.  Please try again."));
              return; //no value meaning stop timer
            case 'pending_sync':
              $('#_form-loader span').html('Verifying your login credentials...');
              return false; // keep timer going
            case 'syncing':
              $('#_form-loader span').html('Reading list of domains...');
              return false; // keep timer going
            case 'synced':
              BadgerCache.reload('domains');
              return true;  // trigger on_finish
            default:
              return false; // keep timer going
          }
        },
        
        on_error: function(response) {
          hide_form_submit_loader();
          $('#account-link-errors').html(error_message(response));
          BadgerCache.reload('linked_accounts');
        }
      }
    });
  });
}
