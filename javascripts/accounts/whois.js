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
  
  // // used during signup flow
  // route('#account/create/contact', function() {
  //   render(
  //     div(
  //       h1('Contact Information'),
  // 
  //       div({ 'class': 'sidebar' },
  //         info_message(
  //           h3("Will this data be private?"),
  //           p("All Badger.com domains come with free WHOIS privacy.  If you disable this feature on a domain, then this contact information will become public.")
  //         )
  //       ),
  //       
  //       div({ 'class': 'has-sidebar' },
  //         create_or_edit_whois_form({ data: {}, button_text: 'Continue »', redirect_to: '#' })
  //       )
  //     )
  //   );
  //   
  //   $('input[name="first_name"]').focus();
  // });

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
