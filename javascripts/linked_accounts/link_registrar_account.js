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
    } else {
      render()
    }
    
    render(
      h1("Link " + ACCOUNT_NAME + " Account"),
      
      div({ 'class': 'sidebar' },
        info_message(
          h3("Why link your " + ACCOUNT_NAME + " account?"),
          p("It is already easy to transfer domains to Badger.com, but by linking your " + ACCOUNT_NAME + " account, the process will be fully automated.")
        )
      ),
      
      div({ id: "link-registrar-form" },
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

        form({ 'class': 'fancy has-sidebar', action: curry(link_account, registrar) },
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
      ),
      
      spinner("Verifying your login credentials...")
    );
    
    $("input[name=login]").focus();
  });

  // POST to Badger.com API, render errors if returned
  // if successful, should drop a queue message to sync the account,
  // reading domains from the registrar.
  define('link_account', function(registrar, form_data) {
    if (!form_data.agree_to_terms) {
      return $("#account-link-errors").html(
        error_message("You must allow Badger.com to act as your agent to proceed.")
      );
    }
    
    // add registrar to form data
    form_data.site = registrar;
    
    // hide the form and show spinner
    $("#link-registrar-form").hide();
    $("#linking-registrar-spinner").show();
    
    Badger.createLinkedAccount(form_data, function(response) {
      if (response.meta.status == 'ok') {
        
        // TODO where to go when successfully linked an account
        set_route("#linked_accounts/" + registrar + "/" + response.data.id + "/bulk_transfer");
        
      } else {
        // hide the spinner and show the form
        $("#link-registrar-form").show();
        $("#linking-registrar-spinner").hide();
        
        // render the error message
        $("#account-link-errors").html(
          error_message(response.data.message)
        );
      }
    });
  });
  
}
