with (Hasher('Signup','Application')) {
  route('#account/login', function() {
    render(
      div(
        h1('Login to Badger'),

        div({ 'class': 'sidebar' },
          info_message(
            h3("Don't have an account?"),
            p("It only takes a minute to create a Badger account and is free!"),
            div({ 'class': 'centered-button' } , a({ href: '#account/create', 'class': 'myButton small' }, "Create Account"))
          )
        ),

        form({ 'class': 'fancy has-sidebar', action: curry(process_login,function() { set_route('#'); }) },
          div({ id: 'signup-errors' }),
      
          fieldset(
            label({ 'for': 'email-input' }, 'Email address:'),
            text({ name: 'email', id: 'email-input', placeholder: 'john.doe@badger.com' })
          ),

          fieldset(
            label({ 'for': 'password-input' }, 'Password:'),
            password({ name: 'password', id: 'password-input', placeholder: 'abc123', 'class': 'right-margin' }),
            a({ href: show_forgot_password_modal }, "Forgot?")
          ),

          fieldset({ 'class': 'no-label' },
            submit({ value: 'Login' })
          )
        )
      )
    );

    $('input[name="email"]').focus();
    //if (!/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
    //  $('input[name="email"]').focus();
    //}
  });
  
  route('#account/create', function() {
    render(
      h1('Create Badger Account'),

      div({ 'class': 'sidebar' },
        info_message(
          h3("Already have an account?"),
          p("If you already have an account, you're on the wrong page!"),
          div({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
        )
      ),

      form({ id: 'signup-box', 'class': 'fancy has-sidebar', action: curry(create_person,false) },
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
    
}