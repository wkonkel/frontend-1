with (Hasher('Signup','Application')) {

  // /*
  //   Load client-side Facebook API
  //   for this page only.
  // */
  // window.fbAsyncInit = function() {
  //   FB.init({
  //     appId      : '175882215854335',
  //     status     : true,
  //     cookie     : true,
  //     xfbml      : true,
  //     oauth      : true,
  //   });
  // };
  // (function(d){
  //   var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
  //   js = d.createElement('script'); js.id = id; js.async = true;
  //   js.src = "//connect.facebook.net/en_US/all.js";
  //   d.getElementsByTagName('head')[0].appendChild(js);
  // }(document));

  route('#account/create/:invite_code', function(invite_code) {
    Badger.setInviteCode(invite_code);
    set_route('#account/create');
  });
  
  route('#account/create', function() {
    var invite_code = Badger.getInviteCode();
    if (invite_code) {
      var target_div = div(spinner('Loading...'));
      var inviter_message_div = div();
      render(
        h1('Create Badger Account'),
        inviter_message_div,
        target_div
      );
      
      Badger.getInvite(invite_code, function(response) {
        var message = "";
        if (response.meta.status == 'ok') {
          if (response.data.slug) {
            message = response.data.person.name + " has referred you to Badger! Your first registration or transfer is only $5!";
          } else if (response.data.inviter) {
            message = response.data.inviter.name + ' has invited you to Badger!';
            if (response.data.domain_credits > 0) {
              message += " And they've given you " + response.data.domain_credits + " free Credit" + (response.data.domain_credits != 1 ? 's' : '') + "!";
            }
          } else if (response.data.domain_credits > 0) {
            message = " This signup code has " + response.data.domain_credits + " free Credit" + (response.data.domain_credits != 1 ? 's' : '') + "!";
          }
          message = success_message(message);
        } else {
          message = error_message(response.data.message, ' However, you can still sign up using the form below.');
        }
        render({ target: inviter_message_div }, message);
        render({ target: target_div }, account_create_form(response.data.invitee, invite_code));
      });
    } else {
      render(
        h1('Create Badger Account'),
        account_create_form()
      );
    }
  });
  
  define('account_create_form', function(invitee, invite_code) {
    var sidebar = div({ 'class': 'sidebar' },
      invite_code && info_message(
        h3("Welcome to Badger!"),
        p("We're looking forward to helping you manage your domains here and at other registrars.")
      ),
    
      info_message(
        h3("Already have an account?"),
        p({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
      )
    );
    
    invitee = invitee || {};

    return div(
      sidebar,
      form_with_loader({ 'class': 'fancy has-sidebar', action: create_person, loading_message: "Creating account..." },
        div({ id: 'signup-errors' }),
    
        fieldset(
          label({ 'for': 'first_name-input' }, 'First and last name:'),
          text({ 'class': 'short right-margin', id: 'first_name-input', name: 'first_name', value: (invitee.first_name || Hasher.request_data.params.first_name || ''), placeholder: 'John' }),
          text({ 'class': 'short', name: 'last_name', value: (invitee.last_name || Hasher.request_data.params.last_name || ''), placeholder: 'Doe' })
        ),

        fieldset(
          label({ 'for': 'email-input' }, 'Email address:'),
          input({ id: 'email-input', name: 'email', style: 'width: 275px', value: (invitee.email || Hasher.request_data.params.email ||  ''), placeholder: 'john.doe@badger.com' })
        ),
    
        fieldset(
          label({ 'for': 'password-input' }, 'Password:'),
          password({ 'class': 'short right-margin', id: 'password-input', name: 'password', placeholder: 'abcd1234' }),
          span({ 'class': 'small-text' }, 'at least 8 characters with numbers & letters')
        ),

        fieldset(
          label('Legal stuff:'),

          input({ type: 'checkbox', name: 'agree_to_terms', id: 'agree_to_terms', value: true }),
          label({ 'class': 'normal', 'for': 'agree_to_terms' }, ' I agree to the Badger '),
          a({ href: window.location.href.split('#')[0] + '#terms_of_service', target: '_blank' }, 'Terms of Service')
        ),
    
        fieldset({ 'class': 'no-label' },
          input({ 'class': 'myButton', type: 'submit', value: 'Continue »' })
        ),
        input({ type: 'hidden', name: 'invite_code', id: 'invite_code', value: invite_code })
      )
    );
    $('input[name="first_name"]').focus();
  });

  define('create_person', function(data) {
    $('#signup-errors').empty();
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
