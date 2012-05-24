with (Hasher('Signup','Application')) {

  /*
    Load client-side Facebook API
    for this page only.
  */
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '175882215854335',
      status     : true,
      cookie     : true,
      xfbml      : true,
      oauth      : true,
    });
  };
  (function(d){
    var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    d.getElementsByTagName('head')[0].appendChild(js);
  }(document));

  route('#account/create', function() {
    render(
      h1('Create Badger Account'),

      div({ 'class': 'sidebar' },
        info_message(
          h3("Already have an account?"),
          p("If you've already done this, you're on the wrong page!"),
          div({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
        )
      ),

      form_with_loader({ 'class': 'fancy has-sidebar', action: create_person, loading_message: "Creating account..." },
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
          label({ 'for': 'password-input' }, 'Password:'),
					password({ 'class': 'short right-margin', id: 'email-input', name: 'password', placeholder: 'abc123' })
          // password({ 'class': 'short', name: 'password_confirmation', placeholder: 'abc123 (again)' }) --- No more password confirmation. Woot woot!
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
        hide_form_submit_loader();
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
  
  define('request_invite', function(form_data) {
    if (form_data.password != form_data.confirm_password) {
			$('#signup-errors').empty().append(error_message({ data: { message: "Passwords do not match" } }));
      return;
		}
		
    // console.log(form_data);
		
    if (form_data.require_invite_code && !form_data.invite_code) {
      $('#signup-errors').empty().append(error_message({ data: { message: "Missing invite code!" } }));
      return;
    }
  });

}
