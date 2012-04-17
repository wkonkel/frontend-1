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
  

  route('#account/profiles/new', function() {
    render_create_or_edit_whois_page({});
  });

  route('#account/profiles/edit/:id', function() {
    render_create_or_edit_whois_page({});
  });

  define('render_create_or_edit_whois_page', function(data) {
    render(
      div(
        h1('Create Contact'),

        div({ style: 'float: left; width: 200px'},
          Account.account_nav_table()
        ),
        
        form({ 'class': 'fancy', style: 'margin-left: 220px', action: create_or_update_whois },
          // info_message(
          //   h3("Will this data be private?"),
          //   p("All Badger.com domains come with WHOIS privacy.  If you disable this feature on a domain, then your contact information will become public.")
          // )
          //form({ action: curry(create_or_update_whois, data.id, callback) },
          div({ id: 'signup-errors' }),
      
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
            input({ 'class': 'myButton', type: 'submit', value: 'Create Contact' })
          )
        )        
      )
    );
  });







  define('create_or_update_whois', function(contact_id, callback, form_data) {
    start_modal_spin();

    $('#errors').empty();
    
    var tmp_callback = function(response) {
      if (response.meta.status == 'ok') {
        BadgerCache.flush('contacts');
        BadgerCache.getContacts(function() {
          hide_modal();
          if (callback) callback();
        });
      } else {
        $('#errors').empty().append(error_message(response));
        stop_modal_spin();
      }
    }

    if (contact_id) {
      Badger.updateContact(contact_id, form_data, tmp_callback);
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
