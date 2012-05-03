with (Hasher('Signup','Application')) {

  route('#account/create', function() {
    render(
      h1('Create Badger Account'),

      div({ 'class': 'sidebar' },
        info_message(
          h3("Already have an account?"),
          p("If you've already have an account, you're on the wrong page!"),
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
          input({ 'class': 'myButton', type: 'submit', value: 'Continue »' })
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
        set_route('#', { reload_page: true });
      } else {
        $('#signup-errors').empty().append(error_message(response));
      }
    });
  });



  route('#confirm_email/:code', function(code) {
    if (!Badger.getAccessToken()) {
      Badger.setCookie('badger_url_after_auth', get_route());
      set_route('#account/login');
    } else {
      render(
        h1('Confirm Email'),

        div({ 'class': 'sidebar' },
          info_message(
            h3("Thanks for your help!"),
            p("This helps us separate the good folk from the bad.")
          )
        ),

        div({ 'class': 'fancy has-sidebar' },
          div({ id: 'confirm-email-box' }, p('Confirming email... please wait.'))
        )
      );

      Badger.confirmEmail(code, function(response) {
        console.log(response);
        if (response.meta.status == 'ok') {
          $('#confirm-email-box').html(success_message(response.data.message));
        } else {
          $('#confirm-email-box').html(error_message(response.data.message));
        }
      });
    }
  });







  route('#register/:code', function(code) {
    if (Badger.getAccessToken()) {
      set_route('#');
    } else {
      Badger.register_code = code;
      set_route('#account/create');
    }
  });

}
