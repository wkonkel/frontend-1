with (Hasher('Whois', 'Application')) {
  route('#whois', function() {
    render(
        div(
            h1('Whois Lookup'),
            div({ 'class': 'sidebar' },
                info_message(
                    h3("Badger Domains"),
                    p('This service is for Badger domains only.')
                ),
                info_message(
                    h3("Already own a domain?"),
                    p('We can automatically transfer your domains to Badger.'),
                    div({ 'class': 'centered-button' }, a({ 'class': 'myButton small', href: '#cart' }, 'Transfer a Domain'))
                )

            ),

            form_with_loader({ action: whois_lookup, 'class': 'fancy has-sidebar', loading_message: 'Performing whois lookup...', 'style': 'margin-left: -120px' },
                div({ id: 'whois-messages', style: 'margin-left: 120px' }),

                fieldset(
                    label({ 'for': 'whois-input' }, 'Domain:'),
                    text({ id: 'whois-input', name: 'whois', placeholder: 'example.com' })
                ),

                fieldset({ 'class': 'no-label' },
                    input({ 'class': 'myButton', type: 'submit', value: 'Lookup »' })
                )
            )
        )
    );

//    refocus the search box
    $('#whois-input').focus();
  });

  define('whois_lookup', function(data) {
    var domain = data.whois.replace(/\s+/, '');
    var messages = $('#whois-messages').empty();
    hide_form_submit_loader();
    if(domain == "") {
      return messages.append( error_message({ data: { message: "Domain must be valid, e.g. badger.com" } }) );
    }
    set_route('#domains/' + domain + '/whois');
  });

}
