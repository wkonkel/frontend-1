with (Hasher('Search','Application')) {
  route('#search', function() {
    render(
      h1('Search Results'),
      div({ 'class': 'sidebar' },
        !Badger.getAccessToken() && info_message(
          h3("Domains cost ", span({ style: 'font-size: 150%' }, "$10"), " a year."),
          p("Privacy and DNS are included and the renewals cost the same.")
        ),

        info_message(
          h3("Already own a domain?"),
          p('We can automatically transfer your domains to Badger.'),
          div({ 'class': 'centered-button' }, a({ 'class': 'myButton small', href: '#cart' }, 'Transfer a Domain'))
        )
      
        // info_message(
        //   h3("Need lots of domains?"),
        //   p('Register many domains at once with our ', a({ href: function() { Badger.Session.write({ current_transfer_action: 'register' }); set_route('#cart'); } }, 'Bulk Register Tool'), '.')
        // )
      ),
    
      div({ 'class': 'has-sidebar' },
        div({ id: 'search-instructions', style: 'font-style: italic' }, "Not sure what to search for? Try typing your name!"),
        table({ id: 'search-results', 'class': 'fancy-table' }, tbody())
      ),
      
      div({ style: 'clear: both' })
    );

    // render({ into: 'before-content' },
    //   div({ style: 'text-align: center; margin: 30px 0 '}, search_box())
    // )
    
    // refocus the search box
    $('#form-search-input').focus();
  });

  define('search_box', function(domain) {
    return form({ id: "form-search", action: Search.search_box_changed },
      input({ id: 'form-search-input', type: 'text', value: '', placeholder: 'Search for a new domain', autofocus: 'true', events: {
        change: Search.search_box_changed,
        keyup: Search.search_box_changed,
        keypress: function(e) {
          if (Search.key_is_valid_for_domain_name(e)) stop_event(e);
        }
      }})
    );
  });


  define('search_box_changed', function() {
    var current_value = $('#form-search-input').val().toLowerCase().replace(/[^a-zA-Z0-9\-\.]/g,'').split('.')[0];
    
    if ((current_value == '') || (this.last_search_value == current_value)) return;
    
    if (get_route() != '#search') set_route('#search');
    
    var search_callback = function() {
      Badger.domainSearch(current_value, true, function(resp) {
        // only if we're still on #search
        if (get_route() != '#search') return;
        
        $('#search-instructions').remove();
        $('#search-results-wrapper').show();
        var most_recent_result = $('#search-results tbody tr:first td:first').text();
        if (resp.data.domains[0][0].indexOf(most_recent_result) == 0) {
          $('#search-results tbody tr:first').remove();
        }
        $('#search-results tbody').prepend(search_result_row(resp.data.domains));
      });
    };

    if (this.search_timeout) clearTimeout(this.search_timeout);
    if (this.backspace_search_timeout) clearTimeout(this.backspace_search_timeout);

    if (current_value && this.last_search_value && (this.last_search_value.indexOf(current_value) == 0)) {
      this.backspace_search_timeout = setTimeout(search_callback, 750);
    } else if (current_value && (this.last_search_value != current_value)) {
      this.search_timeout = setTimeout(search_callback, 0);
    }

    this.last_search_value = current_value;
  });
  
  // Hack to make it work on Firefox
  // In Firefox, charCode of Arrow and Delete key is 0, keyCode is 37, 38, 39, 40, 8
  define('key_is_valid_for_domain_name', function(keypress_event) {
    return !([37, 38, 39, 40, 8].indexOf(parseInt(keypress_event.keyCode)) != -1 && keypress_event.charCode == 0) && key_code_matches(keypress_event, /[^a-zA-Z0-9\-\.]/);
  });
  
  define('key_code_matches', function(keypress_event, regex) {
    // In IE charCode is Undefined, use keyCode
    var code = keypress_event.charCode || keypress_event.keyCode;
    return regex.test(String.fromCharCode(code));
  });

  define('search_result_row', function(results) {
    var available_extensions = $.grep(results, function(ext) {
      return ext[1];
    });

    var add_domain_and_go_to_cart = function(domain) {
      Cart.add_domain(domain);
      set_route('#cart');
    };

    return tr(
      td(results[0][0].split('.')[0]),
      results.map(function(domain) {
        var tld = domain[0].split('.')[1];
        
        return td({ 'class': (domain[1] ? 'tld-available' : 'tld-taken') },
          a({ href: domain[1] ? curry(add_domain_and_go_to_cart, domain[0]) : curry(set_route, '#domains/' + domain[0]) }, tld)
        );
      })
    );
  });

}
