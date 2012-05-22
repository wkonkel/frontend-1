with (Hasher('LinkRegistrarAccount','Application')) {
  
  route("#linked_accounts/:registrar/link", function(registrar) {
    if (registrar == "godaddy") {
      var ACCOUNT_NAME         = "GoDaddy";
      var ACCOUNT_ICON_SRC     = "images/apps/godaddy.png";
    } else if (registrar == "networksolutions") {
      var ACCOUNT_NAME         = "Network Solutions";
      var ACCOUNT_ICON_SRC     = "images/apps/ns.png";
    } else if (registrar == "enom") {
      var ACCOUNT_NAME         = "Enom";
      var ACCOUNT_ICON_SRC     = "images/apps/enom.png";
    }
    
    render(
      chained_header_with_links(
        { href: '#account', text: 'My Account' },
        { href: '#linked_accounts', text: 'Linked Accounts' },
        { text: ACCOUNT_NAME || 'Registrar' }
      ),
      
      div({ 'class': 'sidebar' },
        info_message(
          h3("Why link your " + ACCOUNT_NAME + " account?"),
          p("Linking your account automates the transfer process. Let us do the work for you.")
        )
      ),
      
      form_with_loader({ 'class': 'fancy has-sidebar', action: curry(create_linked_account_and_verify_login, registrar), loading_message: 'Verifying your login credentials...' },
        // h1("Link " + ACCOUNT_NAME + " Account"),
        div({ style: "margin-left: 110px" },
          div({ style: "float: left; margin: auto 20px 20px auto" },
            img({ 'class': "app_store_icon", src: ACCOUNT_ICON_SRC })
          ),
          p("To link your " + ACCOUNT_NAME + " account with Badger.com, enter your " + ACCOUNT_NAME + " login credentials below."),
          p("Syncing your account may take up to five minutes.  When transferring domains, temporary changes may be made to your account information.")
        ),

        div({ id: 'account-link-errors' }),
        
        fieldset(
          label({ 'for': 'username-input' }, 'Login:'),
          div(input({ id: 'username-input', name: 'login', placeholder: 'johndoe' }))
        ),

        fieldset(
          label({ 'for': 'password-input' }, 'Password:'),
          div(input({ id: 'password-input', type: 'password', name: 'password', placeholder: 'abc123' }))
        ),

        fieldset(
          label({ 'for': 'agree_to_terms' }, 'Legal stuff:'),
          div({ style: 'line-height: 18px; padding: 15px 0' }, 
            input({ type: 'checkbox', name: 'agree_to_terms', id: 'agree_to_terms', value: true }),
            label({ 'class': 'normal', 'for': 'agree_to_terms' }, " I hereby authorize Badger to act as my agent and to access my " + ACCOUNT_NAME + " account pursuant to the ", a({ href: '#terms_of_service' }, "Registration Agreement"), '.')
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

  // // POST to Badger.com API, render errors if returned
  // // if successful, should drop a queue message to sync the account,
  // // reading domains from the registrar.
  // define('link_account', function(registrar, form_data) {
  //   if (!form_data.agree_to_terms) {
  //     $("#account-link-errors").html(
  //       error_message("You must allow Badger.com to act as your agent to proceed.")
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
    if (!form_data.agree_to_terms) {
      $("#account-link-errors").html(
        error_message("You must allow Badger.com to act as your agent to proceed.")
      );
      hide_form_submit_loader();
      return;
    }
    
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
        set_route('#filter_domains/all/list');
      },
      
      action: {
        method: curry(Badger.getLinkedAccount, id),
        
        on_ok: function(response, poll_data) {
          switch (response.data.status) {
            case 'error_auth':
              hide_form_submit_loader();
              $('#account-link-errors').html(error_message("Username and/or password not correct."));
              return; //no value meaning stop timer
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
