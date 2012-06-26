with (Hasher('Whois', 'Application')) {
  route('#whois', function() {
    var whois_results = div({ 'id': 'whois-results' });

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
                    div({ 'class': 'centered-button' }, a({ 'class': 'myButton small', href: '#domains/transfer' }, 'Transfer a Domain'))
                )

            ),

            form_with_loader({ action: curry(whois_lookup, whois_results), 'class': 'fancy has-sidebar', loading_message: 'Performing whois lookup...', 'style': 'margin-left: -120px' },
                div({ id: 'whois-messages', style: 'margin-left: 120px' }),

                fieldset(
                    label({ 'for': 'whois-input' }, 'Domain:'),
                    text({ id: 'whois-input', name: 'whois', placeholder: 'example.com' })
                ),

                fieldset({ 'class': 'no-label' },
                    input({ 'class': 'myButton', type: 'submit', value: 'Lookup »' })
                )
            ),
            whois_results
        )
    );

//    refocus the search box
    $('#whois-input').focus();
  });

  define('whois_lookup', function(whois_results, data) {
    var domain = data.whois.replace(/\s+/, '');
    var messages = $('#whois-messages').empty();
    hide_form_submit_loader();
    if(domain == "") {
      return messages.append( error_message({ data: { message: "Domain must be valid, e.g. badger.com" } }) );
    }
    render({ 'into': whois_results }, spinner('Looking up ' + domain + '...'));

    Badger.badgerWhois(domain, function(response) {
      var results = div();
      if (response.meta.status == 'ok') {
        results = div(h2({ 'style': 'margin: 40px 0px 0px 0px' }, 'Results for ' + response.data.name), pre(response.data.whois.raw));
      } else {
        messages.append(error_message({ data: { message: response.data.message } }) );
      }
      render({ 'into': whois_results }, results);
    });
  });
}
