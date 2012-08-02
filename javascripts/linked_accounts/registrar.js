with (Hasher('Registrar','Application')) {

  define('remove_link', function(data) {
    show_modal(
      div(
        h1('Confirm Account Unlink'),
        div({ 'class': 'hidden', id: 'link-form-error' }),
        
        p({ style: "font-weight: bold" }, "Unlinking this account will remove any associated domains from your Badger account."),
        p("If you transferred any of these domains to your Badger account, don't worry, those won't be removed."),
        
        div({ style: 'text-align: right' }, a({ 'class': 'myButton red', href: curry(Registrar.do_remove_link, data) }, 'Unlink Account')),
        div({ style: 'clear: both' })
      )
    )
  });
  
  // return a pretty representation of the registrar, with 
  // icon and humanized registrar name
  define('icon', function(name) {
    return div({ 'class': 'registrar-icon' },
      span({ 'class': 'app_store_icon', style: 'background-image: url(' + logo_url_for_registrar(name) + ')' }),
      span({ style: 'text-align: center; font-weight: bold; min-height: 36px' }, humanize_name(name))
    );
  });
  
  // show a small representation of registrar, with name and image
  define('small_icon', function(name) {
    return div({ style: 'width: 160px; height: 40px; padding: 5px' },
      table(tbody(
        tr(
          td({ style: 'width: 10%' }, img({ 'class': 'app_store_icon', src: Registrar.logo_url_for_registrar(name), style: 'width: 40px; height: 40px; border-radius: 5px' })),
          td(span({ style: 'font-weight: bold; margin-left: 10px' }, Registrar.humanize_name(name)))
        )
      ))
    )
  });
  
  // get the image src for registrar's app store icon
  define('logo_url_for_registrar', function(name) {
    if (name.match(/badger/i)) return 'images/apps/badger.png';
    else if (name.match(/godaddy/i)) return 'images/apps/godaddy.png';
    else if (name.match(/enom/i)) return 'images/apps/enom.png';
    else if (name.match(/1and1/)) return 'images/apps/1and1.png';
    return 'images/apps/badger.png';
  });
  
  // make a normalized registrar name pretty again
  define('humanize_name', function(name) {
    if (name.match(/badger/i)) return 'Badger';
    if (name.match(/godaddy/i)) return 'GoDaddy';
    if (name.match(/enom/i)) return 'Enom';
    if (name.match(/network[\s_]?solutions/i)) return 'Network Solutions';
    if (name.match(/1and1/)) return '1 & 1';
    return name;
  });
  
  // make registrar name usable in code.
  define('normalize_name', function(name) {
    if (name.match(/badger/i)) return 'badger';
    if (name.match(/godaddy/i)) return 'godaddy';
    if (name.match(/enom/i)) return 'enom';
    if (name.match(/network[\s_]?solutions/i)) return 'networksolutions';
    if (name.match(/1and1/)) return '1and1';
    return name;
  });
  
  define('do_remove_link', function(data) {
    start_modal_spin('Removing Linked Account...');
    
    Badger.deleteLinkedAccount(data.id, function (response) {

      // if facebook account, run FB.logout()
      if (data.site.match(/facebook/i)) FB.logout();

      if (response.meta.status == 'ok') {
        BadgerCache.flush('domains');
        BadgerCache.flush('linked_accounts');
        
        hide_modal();
        set_route('#linked_accounts');
      } else {
        $('#link-form-error').html(error_message(response)).show();
        stop_modal_spin();
      }
    });
  });
    
  define('show_link', function(data) {
    var login_text;
    if (!data.id) {
      data.id = '';
    }
    switch (data.site) {
    case 'godaddy':
      data.registrar_name = 'GoDaddy';
      login_text = 'Customer # or Login';
      email_warn = true;
      break;
    case 'networksolutions':
      data.registrar_name = 'Network Solutions';
      login_text = 'User ID';
      email_warn = true;
      break;
    default:
        show_modal(
          h1('Error'),
          div({ 'class': 'error-message' }, 'Unknown Site'),
          div({ style: 'text-align: right; margin-top: 10px;' }, a({ href: hide_modal, 'class': 'myButton', value: "submit" }, "Close"))
        );
        return false;
    }
    show_modal(
      div(
        h1('Link your ' + data.registrar_name + ' Account'),
        div({ 'class': 'hidden', id: 'link-form-error' }),
        p( 'When you link your ' + data.registrar_name + ' account, you\'ll be able to manage your ' + data.registrar_name + 
          ' domains from within Badger.  We won\'t make any changes to your ' + data.registrar_name + 
          ' account or domains unless you request them.'),
        email_warn ? p('When we sync your domains, you will recieve an email from ' + data.registrar_name + '. You may also receive additional emails during the transfer process, such as notifications that your account email has changed. This is part of the transfer process, and afterwards, your account information will remain unchanged.') : '',
        form({ id: 'registrar-link-form', action: curry(Registrar.start_link, data, 'Starting Linking...')},
          input({ type: 'hidden', name: 'linked_account_id', id: 'linked-account-id', value: data.id}),
          div(
            data.last_synced_at ? span('Login: ' + data.login) : input({ 'class': "fancy", type: 'text', name: 'login', placeholder: login_text, value: data.login ? data.login : '' })
          ),
          div(input({ 'class': "fancy", type: 'password', name: 'password', placeholder: 'Password' })),
          div({ style: "margin-top: 10px" }, 
            input({ type: 'checkbox', name: 'agree_to_terms', id: 'agree_to_terms', value: true }),
            label({ 'for': 'agree_to_terms' }, 'I hereby authorize Badger to act as my agent and to access my ' + data.registrar_name + 
              ' account pursuant to the ', a({ href: '#terms_of_service', onclick: hide_modal }, 'Registration Agreement'))
          ),
          div({ style: 'text-align: left; margin-top: 10px' }, input({ 'class': 'myButton', id: 'next', type: 'submit', value: 'Link ' + data.registrar_name + ' Account'  })),
          div({ style: 'clear: both' })
        )
      ),
      { close_callback: function() { set_route('#linked_accounts'); } }
    )
    return data;
  });
  
  define('start_link', function(data, message, form_data) {
    start_modal_spin(message);
    $('#modal-dialog a.close-button').hide();
    $('#errors').empty();
    data = $.extend(data, form_data);

    var callback = function (response) {
      if (response.data.linked_account_id) {
        data.id = response.data.linked_account_id
        $('#linked-account-id').val(data.id);
      }
      if (response.meta.status == 'ok') {
        // start_modal_spin('Logging in to ' + data.registrar_name + '...');
        setTimeout(curry(Registrar.poll_link, 180000, data), 1500);
      } else {
        $('#link-form-error').html(error_message(response)).show();
        $('#modal-dialog a.close-button').show();
        stop_modal_spin();
      }
      
      BadgerCache.reload('linked_accounts');
    };
    
    if (data.id) {
      // update existing account
      Badger.updateLinkedAccount(data.id, data, callback);
    }
    else {
      // create account
      Badger.createLinkedAccount(data, callback);
    }
  });
    
  define('poll_link', function(ttl, data) {
    Badger.getLinkedAccount(data.id, function (response) {
      if (response.meta.status == 'ok') {
        switch (response.data.status) {
          case 'synced':
            // success
            hide_modal();
            BadgerCache.reload('domains')
            set_route('#domains');
            break;
          
          case 'error_auth':
            // login failed
            $('#link-form-error').html(error_message('Failed to Login to ' + data.registrar_name +
              ' - Please check your login and password and try again...')).show();
            $('#modal-dialog a.close-button').show();
            stop_modal_spin();  
            break;
          default:
            switch (response.data.status) {
              case 'start_sync':
                start_modal_spin('Logging into your account at ' + data.registrar_name + '...');
                break;
              case 'syncing':
                start_modal_spin('Reading your domain list at ' + data.registrar_name + '...');
                break;
              default:
                // update title after 20 secs left
                if (ttl >= 25000 && ttl <= 30000) {
                  start_modal_spin('We\'re experiencing a delay linking at ' + data.registrar_name + '...');
                }
            }
            
            // check if time out
            if (ttl <= 0) {
              $('#link-form-error').html(error_message('Failed to link to ' + data.registrar_name +
                ' Process timed out.  Please try again later...')).show();
              $('#modal-dialog a.close-button').show();
              stop_modal_spin();
              break;
            }
            
            // delay and poll again again
            var time = 1500;
            setTimeout(curry(Registrar.poll_link, ttl - time, data), time);
            break;
        }
      } else {
        $('#link-form-error').html(error_message(response)).show();
        $('#modal-dialog a.close-button').show();
        stop_modal_spin();
      }
    });
  });
}