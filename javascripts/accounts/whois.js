with (Hasher('Whois','Application')) {

  route('#account/profiles', function() {
    var target_div = div(spinner('Loading...'));
    
    render(
      div(
        chained_header_with_links(
          { text: 'My Account', href: '#account' },
          { text: 'Profiles' }
        ),
        div({ style: 'float: right; margin-top: -44px' },
          a({ 'class': 'myButton small', href: '#account/profiles/new' }, 'Create New Profile')
        ),
        Account.account_nav_table(target_div)
      )
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
                  a({ 'class': 'myButton small', href: ('#account/profiles/edit/'+contact.id) }, 'Edit')
                )
              );
            })
          )
        )
      );
      
    });
  });
  
  route('#account/profiles/new', function() {
    render(
      div(
        chained_header_with_links(
          { text: 'My Account', href: '#account' },
          { text: 'Profiles',   href: '#account/profiles' },
          { text: 'Create' }
        ),

        div({ style: 'float: left; width: 200px'},
          Account.account_nav_table()
        ),
        
        div({ style: 'margin-left: 220px' },
          create_or_edit_whois_form({})
        )
      )
    );
  });

  route('#account/profiles/edit/:id', function(contact_id) {
    var loader_div = div('Loading...');

    render(
      div(
        chained_header_with_links(
          { text: 'My Account', href: '#account' },
          { text: 'Profiles',   href: '#account/profiles' },
          { text: 'Edit' }
        ),

        div({ style: 'float: left; width: 200px'},
          Account.account_nav_table()
        ),
        
        div({ style: 'margin-left: 220px' },
          loader_div
        )
      )
    );
    
    BadgerCache.getContacts(function(response) {
      var contacts = response.data;
      for (var i=0; i < contacts.length; i++) {
        if (parseInt(contacts[i].id) == parseInt(contact_id)) {
          render({ into: loader_div }, create_or_edit_whois_form(contacts[i]));
          return;
        }
      }
    });
  });

  define('create_or_edit_whois_form', function(data) {
    var already_exists = (Object.keys(data).length > 0);
    
    return form_with_loader({ 'class': 'fancy', action: process_whois_form, loading_message: already_exists ? "Updating contact..." : "Creating contact..." },
      div({ id: 'errors' }),
      
      hidden({ name: 'contact_id', value: data.id }),
      
      Contact.all_form_fields(data),

      fieldset({ 'class': 'no-label' },
        submit({ id: 'register-button', value: already_exists ? 'Save' : 'Create' })
      )
    )
  });


  define('process_whois_form', function(form_data) {
    $('#errors').empty();

    var callback = function(response) {
      if (response.meta.status == 'ok') {
        BadgerCache.flush('contacts');
        BadgerCache.getContacts(function() {
          set_route('#account/profiles');
        });
      } else {
        $('#errors').append(error_message(response));
        hide_form_submit_loader();
      }
    }

    if (form_data.contact_id && form_data.contact_id != 'undefined') {
      Badger.updateContact(form_data.contact_id, form_data.contact, callback);
    } else {
      Badger.createContact(form_data.contact, callback);
    }
  });


  // define('whois_contact', function(whois) {
  //   return div(
  //     div(whois.first_name, ' ', whois.last_name),
  //     (whois.organization && div(whois.organization)),
  //     (whois.address && div(whois.address)),
  //     (whois.address2 && div(whois.address2)),
  //     div(whois.city, ', ', whois.state, ', ', whois.zip, ', ', whois.country),
  //     div('Email: ', whois.email),
  //     div('Phone: ', whois.phone),
  //     (whois.phone && div('Fax: ', whois.phone))
  //   );
  // });
  
}
