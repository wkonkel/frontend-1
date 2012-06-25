with (Hasher('Contact','Application')) {
  define('selector_with_all_form_fields', function(options) {
    var data = (options && options.data) || {};
    
    var fields_wrapper = div({ style: 'display: none' }, all_form_fields(data));
    
    return div(
      div({ id: 'contact-select-message-div' }),
      fieldset(
        label({ 'for': 'registrant_contact_id' }, 'Registrant:'),
        contacts_select({ id: 'registrant_contact_id', name: 'registrant_contact_id', style: "max-width: 400px", new_contact_elements: fields_wrapper })
      ),
      fields_wrapper
    );
  });


  define('all_form_fields', function(data) {
    return div(
      fieldset(
        label({ 'for': 'first_name-input' }, 'First and last name:'),
        text({ 'class': 'short right-margin', id: 'first_name-input', name: 'contact[first_name]', placeholder: 'John', value: data.first_name || '' }),
        text({ 'class': 'short', name: 'contact[last_name]', placeholder: 'Doe', value: data.last_name || '' })
      ),

      fieldset(
        label({ 'for': 'organization-input' }, 'Organization:'),
        text({ id: 'organization-input', name: 'contact[organization]', placeholder: 'Badger Inc (optional)', value: data.organization || '' })
      ),

      fieldset(
        label({ 'for': 'email-input' }, 'Email address:'),
        text({ id: 'email-input', name: 'contact[email]', placeholder: 'john.doe@badger.com', value: data.email || '' })
      ),

      fieldset(
        label({ 'for': 'phone-input' }, 'Phone and fax:'),
        text({ 'class': 'shortish right-margin', id: 'phone-input', name: 'contact[phone]', placeholder: '555-555-5555', value: data.phone || '' }),
        text({ 'class': 'shortish', name: 'contact[fax]', placeholder: '555-555-5555 (optional)', value: data.fax || '' })
      ),

      fieldset(
        label({ 'for': 'address-input' }, 'Address:'),
        text({ id: 'address-input', name: 'contact[address]', placeholder: '123 Main St.', value: data.address || '' })
      ),
      
      fieldset({ 'class': 'no-label' },
        text({ name: 'contact[address2]', placeholder: 'Suite 100 (Optional)', value: data.address2 || '' })
      ),

      fieldset(
        label({ 'for': 'city-input' }, 'City, state and zip:'),
        text({ 'class': 'short right-margin', id: 'city-input', name: 'contact[city]', placeholder: 'San Francisco', value: data.city || '' }),
        text({ 'class': 'supershort right-margin', name: 'contact[state]', placeholder: 'CA', value: data.state || '' }),
        text({ 'class': 'supershort', name: 'contact[zip]', placeholder: '94104', value: data.zip || '' })
      ),

      fieldset(
        label({ 'for': 'country-input' }, 'Country:'),
        select({ id: 'country-input', name: 'contact[country]' }, option(''), country_options(data.country))
      )      
    );
  });

  define('contacts_select', function(options) {
    var selected_id = options.selected_id; delete options.selected_id;
    
    // if new_contact_elements is passed in, add an extra option for it at end and toggle the element
    var new_contact_elements = options.new_contact_elements; delete options.new_contact_elements;
    if (new_contact_elements) options.onChange = function() { (this.selectedIndex == this.options.length-1) ? $(new_contact_elements).show() : $(new_contact_elements).hide(); };

    var select_elem = select(options, option({ disabled: 'disabled' }, 'Loading...'));

    BadgerCache.getContacts(function(response) {
      var contacts = response.data || [];
      
      // remove "Loading..."
      select_elem.removeChild(select_elem.firstChild);
      
      // hide contacts that aren't complete, and need to be updated
      // manually by the user (legacy contact data imported from rhinonames) --- CAB
      contacts = contacts.filter(function(contact) {
        
        if (contact.needs_update) {
          console.log('contact (' + contact.id + ') needs update');

          // hack to show message after form loads. --- CAB
          setTimeout(function() {
            $('#contact-select-message-div').html(info_message(
              'You already have a Whois profile created, but it needs to be updated. ', a({ href: '#account/profiles/edit/' + contact.id }, 'Update profile.')
            ));
          }, 250);
        }
        
        return !contact.needs_update; // this attribute is added clientside, in the getContacts method of api.js
      });
      
      // add each of the contacts
      contacts.map(function(profile) { 
        var opts = { value: profile.id };
        if (''+profile.id == ''+selected_id) opts['selected'] = 'selected';
        var node = option(opts, profile.first_name + ' ' + profile.last_name + (profile.organization ? ", " + profile.organization : '') + " (" + profile.address + (profile.address2 ? ', ' + profile.address2 : '') + ")");
        select_elem.appendChild(node);
      });
      
      // add "New Contact"
      if (new_contact_elements) {
        select_elem.appendChild(option({ value: 'create' }, 'New Contact'));
        options.onChange.call(select_elem);
      }
    });

    return select_elem;
  });
 

  define('create_contact_if_necessary_form_data', function(options) {
    with (options) {
      if (form_data[field_name] == 'create') {
        Badger.createContact(form_data.contact, function(response) {
          if (response.meta.status == 'ok') {
            // asynch update contacts with new one
            BadgerCache.flush('contacts');
            BadgerCache.getContacts();
            
            // set contact_id and trigger callback
            form_data[field_name] = '' + response.data.contact_id;
            delete form_data.contact;
            callback(form_data);
          } else {
            hide_form_submit_loader();
            $(message_area).html(error_message(response));
          }
        });
      } else {
        delete form_data.contact;
        callback(form_data);
      }
    }
  });

 

  // define('create_or_edit_whois_form', function(options) {
  //   ;
  //   return form({ 'class': 'fancy', action: curry(create_or_update_whois, options) },
  //     div({ id: 'signup-errors' }),
  // 
  //     (data.id ? hidden({ name: 'id', value: data.id }) : []),
  // 
  // ,
  // 
  // fieldset({ 'class': 'no-label' },
  //   input({ 'class': 'myButton', type: 'submit', value: options.button_text || 'Create Contact' })
  // )
  //   );
  // });

}