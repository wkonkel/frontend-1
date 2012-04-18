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

        form({ 'class': 'fancy has-sidebar', action: login },
          div({ id: 'signup-errors' }),
        
          fieldset(
            label({ 'for': 'email-input' }, 'Email address:'),
            text({ name: 'email', id: 'email-input', placeholder: 'john.doe@badger.com' })
          ),

          fieldset(
            label({ 'for': 'password-input' }, 'Password:'),
            password({ name: 'password', id: 'password-input', placeholder: 'abc123', 'class': 'right-margin' }),
            a({ href: '#account/forgot-password' }, "Forgot?")
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

  define('login', function(form) {
    $('#signup-errors').empty();
    Badger.login(form.email, form.password, function(response) {
      if (response.meta.status != 'ok') {
        $('#signup-errors').empty().append(error_message(response));
      }
    });
  });

  route('#account/forgot-password', function() {
    render(
			form({ action: process_forgot_password },
				h1("Forgot Password"),

        div({ 'class': 'sidebar' },
          info_message(
            h3("Know your password?"),
            p("If you've just remembered your password, you can go back."),
            div({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
          )
        ),

        form({ 'class': 'fancy has-sidebar', action: login },
				  div({ id: 'forgot-password-messages' }),

          fieldset(
            label({ 'for': 'email-input' }, 'Email address:'),
            text({ name: "email", id: 'email-input', placeholder: "john.doe@badger.com" })
          ),

          div({ style: 'font-size: 18px; margin-left: 220px' }, 'or'),
        
          fieldset(
            label({ 'for': 'domain-input' }, 'Domain:'),
            text({ name: "email", id: 'domain-input', placeholder: "badger.com" })
          ),

          fieldset({ 'class': 'no-label' },
					  input({ 'class': 'myButton', type: 'submit', value: 'Email Reset Code' })
          )
        )
			)
    );
  });

	define('show_reset_password_modal', function(email, code) {
    show_modal(
			form({ action: curry(reset_password, null) },
				h1("Enter your new password"),
				div({ id: 'reset-password-messages' }),
				div({ id: 'reset-password-form' },
					div({ style: 'margin: 20px 0; text-align: center' },
					  input({ name: "email", type: 'hidden', value: email }),
						input({ name: "code", type: 'hidden', value: code  }),
						input({ name: "new_password", type: 'password', placeholder: "New Password" }),
						input({ name: "confirm_password", type: 'password', placeholder: "Confirm New Password" }),
						input({ 'class': 'myButton small', type: 'submit', value: 'Update' })
					)
				)
			)
		);
	});

	define('process_forgot_password', function(callback, form_data) {
		Badger.sendPasswordResetEmail(form_data, function(response) {
			if (response.meta.status == 'ok') {
        $('#forgot-password-messages').empty().append(success_message(response));
				$('#forgot-password-form').empty();
			} else {
				$('#forgot-password-messages').empty().append(error_message(response));
			}
		});
	});

	define('reset_password', function(callback, form_data) {
		if(form_data.new_password != form_data.confirm_password)
			return $('#reset-password-messages').empty().append( error_message({ data: { message: "Passwords do not match" } }) );

		Badger.resetPasswordWithCode(form_data, function(response) {
			if (response.meta.status == 'ok')
			{
        setTimeout(function() {
          show_modal(
            h1("Reset Password"),
            success_message(response),
            a({ href: hide_modal, 'class': 'myButton', value: "submit" }, "Close")
          );
        }, 250);
			}
			else
			{
				$('#reset-password-messages').empty().append(error_message(response));
			}
		});
	});

}