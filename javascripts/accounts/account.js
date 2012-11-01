with (Hasher('Account','Application')) {

  route('#account', function() {
    var account_settings = div(spinner('Loading...'));

    render(
      h1('My Account » Settings'),
      account_nav_table(
        account_settings
      )
    );
    
    BadgerCache.getAccountInfo(function(response) {
      render({ into: account_settings },
        change_account_form(response.data)
      );
    });
  });

  route('#account/unsubscribed_from_emails', function() {
    render(
      h2('Unsubscribed from email newsletters.'),
      p("Got it, We won't send anymore email newsletters to you. To receive our newsletters again, login and enable the option in your account settings."),
      p("You will still receive emails regarding important account changes.")
    );
  });
  
  // helper method to check and see if the user has the permission for the given domain
  define('has_permission', function(which, permissions) {
    return (permissions || []).indexOf(which) >= 0;
  });

  define('if_referral_signup_discount', function(callback) {
    BadgerCache.getAccountInfo(function(response) {
      if (response.data.eligible_for_referral_bonus) {
        callback(response.data);
        BadgerCache.flush('account_info');
      }
    });
  });

  define('account_nav_table', function() {
    var active_url = get_route();
    
    return table({ style: 'width: 100%' }, tbody(
      tr(
        td({ style: 'width: 200px; vertical-align: top' },
          ul({ id: 'domains-left-nav' },
            // li(a({ href: '#tickets', 'class': (active_url.match(/^#tickets.*$/) ? 'active' : '') }, 'Support Tickets')),
            li(a({ href: '#account', 'class': (active_url.match(/^#account$/) ? 'active' : '') }, 'Settings')),
            li(a({ href: '#account/profiles', 'class': (active_url.match(/^#account\/profiles.*$/) ? 'active' : '') }, 'Whois Profiles')),
            li(a({ href: '#account/billing', 'class': (active_url.match(/^#account\/billing$/) ? 'active' : '') }, 'Billing & Credits')),
            li(a({ href: '#linked_accounts', 'class': (active_url.match(/^#linked_accounts$/) ? 'active' : '') }, 'Linked Accounts')),
            li(a({ href: '#invites', 'class': (active_url.match(/^#invites/) ? 'active' : '') }, 'Invites')),
            li(a({ href: '#rewards/history', 'class': (active_url.match(/^#rewards\/history/) ? 'active' : '') }, 'Rewards History'))
          )
        ),
        
        td({ style: 'vertical-align: top'},
          arguments
        )
      )
    ));
  });
  
  define('change_account_form', function(account_info) {
    if (account_info.name) {
      var first_name = account_info.name.split(' ')[0];
      var last_name = account_info.name.split(' ')[1];
    }
    
    return form_with_loader({ 'class': 'fancy', action: submit_account_change_form, loading_message: 'Submitting changes...' },
      h3('Change Account Details'),
      
      div({ id: 'messages' }),

      fieldset(
        label({ 'for': 'first_name' }, 'First and last name'),
        text({ 'class': 'short right-margin', name: 'first_name', placeholder: first_name || 'John' }),
        text({ 'class': 'short', name: 'last_name', placeholder: last_name || 'Smith' })
      ),
      
      fieldset(
        label({ 'for': 'password' }, 'Change password'),
        password({ 'class': 'short right-margin', name: 'password', placeholder: 'abcd1234' }),
        span({ 'class': 'small-text' }, 'at least 8 characters with numbers & letters')
      ),
      
      fieldset(
        label({ 'for': 'email' }, 'New email'),
        text({ name: 'email', placeholder: account_info.email || 'john@badger.com' })
        // text({ 'class': 'short', name: 'confirm_email', placeholder: 'john@badger.com' })
      ),

      fieldset({ 'class': 'no-label' },
        span(
          (account_info.receive_emails ? checkbox({ name: 'receive_emails', checked: 'checked' }) : checkbox({ name: 'receive_emails' })),
          span({ style: 'margin-left: 10px' }, "Receive email updates from Badger")
        )
      ),
      
      fieldset({ 'class': 'no-label' },
        submit({ id: 'submit-changes-button', value: 'Save' })
      )
    )
  });
  
  define('submit_account_change_form', function(form_data) {
    form_data.receive_emails = ($(':checked[name=receive_emails]').length > 0).toString();

    Badger.updateAccount(form_data, function(response) {
      if (response.meta.status == 'ok') {
        $('#messages').html(success_message('Your account has been updated.'));
        update_account_info();
        
        // clear all fields from the form
        $("form input:password, input:text").val('');
      } else {
        $('#messages').html(error_message(response));
      }
      
      hide_form_submit_loader()
    });
  });
  
  // Update the account info shown in the top right nav
  define('update_account_info', function() {
    BadgerCache.reload('account_info');
    BadgerCache.getAccountInfo(function(response) {
      if (response.meta.status == 'ok') {
        // update the form if still on that page
        var first, last;
        first = response.data.name.split(' ')[0];
        last = response.data.name.split(' ')[1];
        $('input[name=first_name]').each(function() { this.placeholder = first });
        $('input[name=last_name]').each(function() { this.placeholder = last });
        
        // update the nav
        $('span#user_nav_name a').html(response.data.name);
      }
    })
  });

}
