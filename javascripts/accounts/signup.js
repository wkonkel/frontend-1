with (Hasher('Signup','Application')) {

  route('#account/create', function() {
    render(
      div(
        h1('Create Badger Account'),

        div({ 'class': 'sidebar' },
          info_message(
            h3("Already have an account?"),
            p("If you've already done this, you're on the wrong page!"),
            div({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
          )
        ),

        form({ 'class': 'fancy has-sidebar', action: create_person },
          div({ id: 'signup-errors' }),
      
          fieldset(
            label({ 'for': 'first_name-input' }, 'First and last name:'),
            text({ 'class': 'short right-margin', id: 'first_name-input', name: 'first_name', placeholder: 'John' }),
            text({ 'class': 'short', name: 'last_name', placeholder: 'Doe' })
          ),

          fieldset(
            label({ 'for': 'email-input' }, 'Email address:'),
            div(input({ id: 'email-input', name: 'email', style: 'width: 275px', placeholder: 'john.doe@badger.com' }))
          ),
      
          fieldset(
            label({ 'for': 'email-input' }, 'Password:'),
  					password({ 'class': 'short right-margin', id: 'email-input', name: 'password', placeholder: 'abc123' }),
  					password({ 'class': 'short', name: 'password_confirmation', placeholder: 'abc123 (again)' })
          ),

          fieldset(
            label('Legal stuff:'),

            input({ type: 'checkbox', name: 'agree_to_terms', id: 'agree_to_terms', value: true }),
            label({ 'class': 'normal', 'for': 'agree_to_terms' }, ' I agree to the Badger.com '),
            a({ href: window.location.href.split('#')[0] + '#terms_of_service', target: '_blank' }, 'Terms of Service')
          ),
      
          fieldset({ 'class': 'no-label' },
            input({ 'class': 'myButton', type: 'submit', value: 'Create Account' })
          )
        )        
      )
    );
    $('input[name="first_name"]').focus();
  });

  define('create_person', function(data) {
    $('#signup-errors').empty();
    
    if (Badger.register_code) data.invite_code = Badger.register_code;

    Badger.createAccount(data, function(response) {
      if (response.meta.status == 'ok') {
        set_route('#account/profiles/new', { reload_page: true });
      } else {
        $('#signup-errors').empty().append(error_message(response));
      }
    });
  });





  // input({ type: 'hidden', name: 'invite_code' }),
  // 
  // table({ style: 'width: 100%' }, tbody(
  //   tr(
  //     td({ style: 'width: 50%; vertical-align: top' },
  //       h3({ style: 'margin: 0' }, 'Contact Information'),
  //       div(
  //       ),
  //       div(input({ style: 'width: 275px', name: 'organization', placeholder: 'Organization (optional)' })),
  //       div(
  //         input({ style: 'width: 130px', name: 'phone', placeholder: 'Phone' }),
  //         input({ style: 'width: 130px', name: 'fax', placeholder: 'Fax (optional)' })
  //       )
  //     ),
  //     td({ style: 'width: 50%; vertical-align: top' },
  //       h3({ style: 'margin: 0' }, 'Mailing Address'),
  //       div(
  //         input({ style: 'width: 260px', name: 'address', placeholder: 'Address Line 1' })
  //       ),
  //       div(
  //         input({ style: 'width: 260px', name: 'address2', placeholder: 'Address Line 2 (Optional)' })
  //       ),
  //       div(
  //         input({ style: 'width: 118px', name: 'city', placeholder: 'City' }),
  //         input({ style: 'width: 40px', name: 'state', placeholder: 'State' }),
  //         input({ style: 'width: 70px', name: 'zip', placeholder: 'Zip' })
  //       ),
  //       div(
  //         select({ style: 'width: 150px', name: 'country' }, option({ disabled: 'disabled' }, 'Country:'), country_options())
  //       )
  //     )
  //   )
  // ))




 
  route('#register/:code', function(code) {
    if (Badger.getAccessToken()) {
      set_route('#');
    } else {
      Badger.register_code = code;
      set_route('#account/create');
    }
  });

  route('#reset_password/:email/:code', function(email, code) {
    set_route('#');
    show_reset_password_modal(email, code);
  });

  route('#confirm_email/:code', function(code) {
    set_route('#');
    if (Badger.getAccessToken()) {
      Badger.confirmEmail(code, function(response) {
        show_confirm_email_notification_modal(response.data, response.meta.status);
      });
    } else {
      show_login_modal(function(){
        Badger.confirmEmail(code, function(response) {
        show_confirm_email_notification_modal(response.data, response.meta.status);
      });
    });
    }
  });

  define('require_user_modal', function(callback) {
    var args = Array.prototype.slice.call(arguments, 1);
    var that = this;
    var callback_with_args = function() { callback.apply(that, args); }
    Badger.getAccessToken() ? callback_with_args() : show_register_modal(callback_with_args);
  });


  //define('show_register_modal', function(callback) {
    

  define('show_confirm_email_notification_modal', function(data, status) {
    show_modal(
      h1("Confirm Email Message"),
      status == 'ok' ? p(data.message + ". You can close this window now.") : p({ 'class':  'error-message'}, data.message),
      a({ href: hide_modal, 'class': 'myButton', value: "submit" }, "Close")
    );
	});

}
