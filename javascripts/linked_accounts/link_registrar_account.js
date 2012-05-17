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
          p("It is already easy to transfer domains to Badger.com, but by linking your " + ACCOUNT_NAME + " account, the process will be fully automated.")
        )
      ),
      
      form_with_loader({ 'class': 'fancy', action: curry(create_linked_account_and_verify_login, registrar), loading_message: 'Verifying your login credentials...' },
        // h1("Link " + ACCOUNT_NAME + " Account"),
        div({ 'class': "fancy has-sidebar" },
          div({ style: "margin-left: 60px" },
            div({ style: "float: left; margin: auto 20px 20px auto" },
              img({ 'class': "app_store_icon", src: ACCOUNT_ICON_SRC })
            ),
            p("To link your " + ACCOUNT_NAME + " account with Badger.com, enter your " + ACCOUNT_NAME + " login credentials below."),
            p("Syncing your account may take about five minutes once the process is started. If you transfer domains from " + ACCOUNT_NAME + ", we may need to temporarily change some of your " + ACCOUNT_NAME + " account information, such as the email address."),
            p("Any account information that is changed as part of the automated transfer process will be changed back to normal once the transfer is completed, or if it fails for any reason."),

            div({ id: 'account-link-errors' })
          )
        ),
        
        fieldset(
          label({ 'for': 'username-input' }, 'Username:'),
          div(input({ id: 'username-input', name: 'login', placeholder: 'username' }))
        ),

        fieldset(
          label({ 'for': 'password-input' }, 'Password:'),
          div(input({ id: 'password-input', type: 'password', name: 'password', placeholder: 'password' }))
        ),

        div({ style: "margin: 20px auto 20px 112px; width: 380px" },
          input({ type: 'checkbox', name: 'agree_to_terms', id: 'agree_to_terms', value: true }),
          span(" I hereby authorize Badger to act as my agent and to access my " + ACCOUNT_NAME + " account pursuant to the ", a({ href: '#terms_of_service' }, "Registration Agreement"))
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
    
    Badger.createLinkedAccount(form_data, function(response) {
      if (response.meta.status == 'ok') {
        // if the account was created, poll until the login is validated
        poll_until_login_verified(registrar, response.data.id);
      } else {
        hide_form_submit_loader();
        $('#account-link-errors').html(error_message(response));
      }
    });
  });
  
  define('poll_until_login_verified', function(registrar, id) {
    Badger.getLinkedAccount(id, function(response) {
      // console.log(response);
      
      if (response.meta.status == 'ok') {
        if (response.data.status == 'login_invalid') {
          hide_form_submit_loader();
          
          $('#account-link-errors').html(
            error_message("Username and/or password not correct.")
          );
        } else if (['validating_login', 'pending_sync'].includes(response.data.status)) {
          if (get_route() == '#linked_accounts/' + registrar + '/link') {
            setTimeout(curry(poll_until_login_verified, registrar, id), 5000);
          }
        } else if (['validating_login', 'syncing', 'pending_sync'].includes(response.data.status)) {
          set_route("#linked_accounts/" + registrar + "/" + response.data.id + "/bulk_transfer");
        }
      } else {
        hide_form_submit_loader();
        $('#account-link-errors').html(error_message(response));
      }
    });
  });
  
  // options are:
  // timeout: number of ms to wait
  // action: the action to be called on the timeout. if returns true, stops polling
  define('poll_with_until', function(options, until) {
    with (options) {
      if (until()) setTimeout(action, interval);
    }
  });
  
}
