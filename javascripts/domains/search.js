with (Hasher('Search','Application')) {
  route('#search', function() {
    render(
      div(
        h1('Search Results'),
        div({ 'class': 'sidebar' },
          info_message(
            h3("Already own a domain?"),
            p('We can automatically transfer your domains to Badger.'),
            div({ 'class': 'centered-button' }, a({ 'class': 'myButton small', href: '#domains/transfer' }, 'Transfer a Domain'))
          )
          
          // info_message(
          //   h3("Need lots of domains?"),
          //   p('Register many domains at once with our ', a({ href: function() { Badger.Session.write({ current_transfer_action: 'register' }); set_route('#domains/transfer'); } }, 'Bulk Register Tool'), '.')
          // )
        ),
        
        div({ 'class': 'has-sidebar' },
          p({ id: 'search-help', 'class': 'success-message', style: "font-size: 18px; margin: 0 0 25px; text-align: center" }, 'Start typing in the search box above and results will appear here.'),
          table({ id: 'search-results', 'class': 'fancy-table' }, tbody())
        )
      )
    );
    
    // refocus the search box
    $('#form-search-input').focus();
  });

  define('set_search_route', function() {
    if (get_route() != '#search') {
      set_route('#search');
      this.last_search_value = null;
    }
  })

  define('search_box_changed', function() {
    set_search_route();

    var current_value = $('#form-search-input').val().toLowerCase().replace(/[^a-zA-Z0-9\-\.]/g,'').split('.')[0];

    var search_callback = function() {
      Badger.domainSearch(current_value, true, function(resp) {
        $('#search-instructions').remove();
        $('#search-help').remove();
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
      this.search_timeout = setTimeout(search_callback, 100);
    }

    this.last_search_value = current_value;
  });

  define('search_result_row', function(results) {
    var available_extensions = $.grep(results, function(ext) {
      return ext[1];
    });
    return tr(
      td(results[0][0].split('.')[0]),
      results.map(function(domain) {
        var tld = domain[0].split('.')[1];
        return td({ 'class': 'tld' }, 
          domain[1] ? a({ href: '#domains/'+domain[0] }, tld) : span({ style: 'text-decoration: line-through' }, tld)
        );
      })
    );
  });


}
