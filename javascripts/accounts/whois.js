with (Hasher('Whois','Application')) {

  route('#account/profiles', function() {
    var target_div = div('Loading...');
    
    render(
      h1('My Account » Profiles'),
      div({ style: 'float: right; margin-top: -44px' }, 
        a({ 'class': 'myButton small', href: '#account/profiles/new' }, 'Create New Profile')
      ),
      Account.account_nav_table(target_div)
    );

    BadgerCache.getContacts(function(results) {
      render({ target: target_div }, 
        ((results.data||[]).length == 0) ? 'No whois profiles found.' : table({ 'class': 'fancy-table' },
          tbody(
            results.data.map(function(contact) {
              return tr(
                td(
                  div(contact.first_name, ' ', contact.last_name),
                  div(contact.organization)
                ),
                td(
                  div(contact.email),
                  div(contact.phone),
                  div(contact.fax)
                ),
                td(
                  div(contact.address),
                  div(contact.address2),
                  div(contact.city, ', ', contact.state, ', ', contact.zip),
                  div(contact.country)
                ),
                td({ style: "text-align: right" },
                  a({ 'class': 'myButton small', href: curry(Whois.edit_whois_modal, contact, curry(set_route, '#account/profiles')) }, 'Edit')
                )
              );
            })
          )
        )
      );
      
    });
  });
  
  // used during signup flow
  route('#account/create/contact', function() {
    render(
      div(
        h1('Contact Information'),

        div({ 'class': 'sidebar' },
          info_message(
            h3("Will this data be private?"),
            p("All Badger.com domains come with free WHOIS privacy.  If you disable this feature on a domain, then this contact information will become public.")
          )
        ),
        
        div({ 'class': 'has-sidebar' },
          create_or_edit_whois_form({ data: {}, button_text: 'Continue »', redirect_to: '#' })
        )
      )
    );
    
    $('input[name="first_name"]').focus();
  });

  route('#account/profiles/new', function() {
    render(
      div(
        h1('Create Contact'),

        div({ style: 'float: left; width: 200px'},
          Account.account_nav_table()
        ),
        
        div({ style: 'margin-left: 220px' },
          create_or_edit_whois_form({})
        )
      )
    );
  });

  route('#account/profiles/edit/:id', function() {
    render(
      div(
        h1('Edit Contact'),

        div({ style: 'float: left; width: 200px'},
          Account.account_nav_table()
        ),
        
        div({ style: 'margin-left: 220px' },
          create_or_edit_whois_form({})
        )
      )
    );
  });


  define('create_or_edit_whois_form', function(options) {
    var data = options.data || {};
    return form({ 'class': 'fancy', action: curry(create_or_update_whois, options) },
      div({ id: 'signup-errors' }),
  
      (data.id ? hidden({ name: 'id', value: data.id }) : []),
  
      fieldset(
        label({ 'for': 'first_name-input' }, 'First and last name:'),
        text({ 'class': 'short right-margin', id: 'first_name-input', name: 'first_name', placeholder: 'John', value: data.first_name || '' }),
        text({ 'class': 'short', name: 'last_name', placeholder: 'Doe', value: data.last_name || '' })
      ),

      fieldset(
        label({ 'for': 'organization-input' }, 'Organization:'),
        text({ id: 'organization-input', name: 'organization', placeholder: 'Badger Inc (optional)', value: data.organization || '' })
      ),

      fieldset(
        label({ 'for': 'email-input' }, 'Email address:'),
        text({ id: 'email-input', name: 'email', placeholder: 'john.doe@badger.com' })
      ),

      fieldset(
        label({ 'for': 'phone-input' }, 'Phone and fax:'),
        text({ 'class': 'shortish right-margin', id: 'phone-input', name: 'phone', placeholder: '555-555-5555', value: data.phone || '' }),
        text({ 'class': 'shortish', name: 'fax', placeholder: '555-555-5555 (optional)', value: data.fax || '' })
      ),

      fieldset(
        label({ 'for': 'address-input' }, 'Address:'),
        text({ id: 'address-input', name: 'address', placeholder: '123 Main St.', value: data.address || '' })
      ),
        
      fieldset({ 'class': 'no-label' },
        text({ name: 'address2', placeholder: 'Suite 100 (Optional)', value: data.address2 || '' })
      ),

      fieldset(
        label({ 'for': 'city-input' }, 'City, state and zip:'),
        text({ 'class': 'short right-margin', id: 'city-input', name: 'city', placeholder: 'San Francisco', value: data.city || '' }),
        text({ 'class': 'supershort right-margin', name: 'state', placeholder: 'CA', value: data.state || '' }),
        text({ 'class': 'supershort', name: 'zip', placeholder: '94104', value: data.zip || '' })
      ),
  
      fieldset(
        label({ 'for': 'country-input' }, 'Country:'),
        select({ id: 'country-input', name: 'country' }, option(''), country_options(data.country))
      ),

      fieldset({ 'class': 'no-label' },
        input({ 'class': 'myButton', type: 'submit', value: options.button_text || 'Create Contact' })
      )
    );
  });


  define('create_or_update_whois', function(options, form_data) {
    $('#signup-errors').empty();
    
    var tmp_callback = function(response) {
      if (response.meta.status == 'ok') {
        BadgerCache.flush('contacts');
        BadgerCache.getContacts(function() {
          if (options.callback) options.callback();
          else if (options.redirect_to) set_route(options.redirect_to);
        });
      } else {
        $('#signup-errors').empty().append(error_message(response));
      }
    }

    if (form_data.id) {
      Badger.updateContact(form_data.id, form_data, tmp_callback);
    } else {
      Badger.createContact(form_data, tmp_callback);
    }
  });
  
  define('whois_contact', function(whois) {
    return div(
      div(whois.first_name, ' ', whois.last_name),
      (whois.organization && div(whois.organization)),
      (whois.address && div(whois.address)),
      (whois.address2 && div(whois.address2)),
      div(whois.city, ', ', whois.state, ', ', whois.zip, ', ', whois.country),
      div('Email: ', whois.email),
      div('Phone: ', whois.phone),
      (whois.phone && div('Fax: ', whois.phone))
    );
  });
  
}
