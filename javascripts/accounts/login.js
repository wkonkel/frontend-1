with (Hasher('Signup','Application')) {

  // don't even let people be on this page if they are logged in.
  before_filter(function() {
    if (Badger.getAccessToken()) set_route('#');
  });

  route('#account/login', function() {
    render(
      div(
        h1('Login to Badger'),

        div({ 'class': 'sidebar' },
          info_message(
            h3("Don't have an account?"),
            p("It only takes a minute to create a Badger account, and it's free!"),
            div({ 'class': 'centered-button' } , a({ href: '#account/create', 'class': 'myButton small' }, "Create Account"))
          )

//          Note: the backend for this feature is disabled right now. it's a bit risky, security wise --- CAB
//
//          info_message(
//            h3("Login with Facebook"),
//            p("If you haven't already, login and link a Facebook account. Once you do, logging in is easy!"),
//            div({ 'class': 'centered-button'}, a({ 'class': 'myButton small', href: process_facebook_login }, 'Login with Facebook'))
//          )
        ),

        form_with_loader({ 'class': 'fancy has-sidebar', action: process_login, loading_message: "Logging in...", style: 'min-height: 275px;' },
          div({ id: 'signup-errors' }),
        
          fieldset(
            label({ 'for': 'email-input' }, 'Email address:'),
            text({ name: 'email', id: 'email-input', placeholder: 'john.doe@badger.com' })
          ),

          fieldset(
            label({ 'for': 'password-input' }, 'Password:'),
            password({ name: 'password', id: 'password-input', placeholder: 'abcd1234', 'class': 'right-margin' }),
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

  define('process_login', function(form) {
    $('#signup-errors').empty();
    Badger.login({ email: form.email, password: form.password }, function(response) {
      if (response.meta.status != 'ok') {
        $('#signup-errors').empty().append(error_message(response));
        hide_form_submit_loader();
      }
    });
  });

  define('process_facebook_login', function() {
    $('#signup-errors').empty();

    FB.login(function(fb_response) {
      fb_response.authResponse = fb_response.authResponse || {};
      Badger.login({ facebook_access_token: fb_response.authResponse.accessToken }, function(response) {
        if (response.meta.status != 'ok') {
          $('#signup-errors').html(error_message(response));
          hide_form_submit_loader();
        }
      });
    }, { scope: 'email, publish_stream' });
  });

  route('#account/forgot-password', function() {
    render(
      h1("Forgot Password"),

      div({ 'class': 'sidebar' },
        info_message(
          h3("Know your password?"),
          p("If you've just remembered your password, you can go back."),
          div({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
        )
      ),

      form_with_loader({ 'class': 'fancy has-sidebar', action: process_forgot_password, loading_message: 'Sending password reset email...' },
        div({ id: 'forgot-password-messages' }),

        div({ id: 'forgot-password-form' },
          fieldset(
            label({ 'for': 'email-input' }, 'Email address:'),
            text({ name: "email", id: 'email-input', placeholder: "john.doe@badger.com" })
          ),

          // div({ style: 'font-size: 18px; margin-left: 220px' }, 'or'),
          // fieldset(
          //   label({ 'for': 'domain-input' }, 'Domain:'),
          //   text({ name: "email", id: 'domain-input', placeholder: "badger.com" })
          // ),

          fieldset({ 'class': 'no-label' },
            input({ 'class': 'myButton', type: 'submit', value: 'Email Reset Code' })
          )
        )
      )
    );
  });
  
  define('login', function(form) {
    $('#signup-errors').empty();
    Badger.login({ email: form.email, password: form.password }, function(response) {
      if (response.meta.status == 'ok') {
        if (Badger.back_url != "") {
          set_route(Badger.back_url);
          Badger.back_url = "";
        } else {
          document.location.href = document.location.pathname;
        }
      } else {
        $('#signup-errors').empty().append(error_message(response));
      }
    });
  });

  define('process_forgot_password', function(form_data) {
    $('#forgot-password-messages').empty();
    Badger.sendPasswordResetEmail(form_data, function(response) {
      if (response.meta.status == 'ok') {
        $('#forgot-password-messages').html(success_message(response));
        $('#forgot-password-form').empty();
      } else {
        $('#forgot-password-messages').html(error_message(response));
      }
      
      hide_form_submit_loader();
    });
  });
  
  route('#reset_password/:email/:code', function(email, code) {
    render(
      h1("Forgot Password"),

      div({ 'class': 'sidebar' },
        info_message(
          h3("Know your password?"),
          p("If you've just remembered your password, you can go back."),
          div({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
        )
      ),

      form({ 'class': 'fancy has-sidebar', action: process_reset_password },
        hidden({ name: "email", value: email }),
        hidden({ name: "code", type: 'hidden', value: code  }),

        div({ id: 'reset-password-messages' }),

        fieldset(
          label({ 'for': 'email-input' }, 'Email address:'),
          div({ 'class': 'big-text' }, email)
        ),

        fieldset(
          label({ 'for': 'email-input' }, 'New password:'),
          password({ 'class': 'short right-margin', id: 'email-input', name: 'new_password', placeholder: 'abcd1234' }),
          password({ 'class': 'short', name: 'confirm_password', placeholder: 'abcd1234 (again)' })
        ),

        fieldset(
          input({ 'class': 'myButton small', type: 'submit', value: 'Update Password' })
        )
      )
    );
  });

  define('process_reset_password', function(form_data) {
    $('#reset-password-messages').empty();
    
    if (form_data.new_password != form_data.confirm_password) {
      return $('#reset-password-messages').html(error_message("Passwords do not match"));
    }

    Badger.resetPasswordWithCode(form_data, function(response) {
      if (response.meta.status != 'ok') $('#reset-password-messages').append(error_message(response));
    });
  });

}
