with (Hasher('Domains','Application')) {
  
  define('domains_nav_table', function() {
    return table({ style: 'width: 100%' }, tbody(
      tr(
        div({ id: 'transfer-prompt-div' })
      ),
      tr(
        td({ style: 'width: 200px; vertical-align: top;' },
          // domains nav
          div({ style: 'margin-bottom: 20px' },
            ul({ id: 'domains-left-nav' },
              li(a({ href: '#domains', 'class': (get_route().match(/^#domains$/) ? 'active' : '') }, 'All Domains')),
              li(a({ href: '#domains/pending-transfer', 'class': (get_route().match(/^#domains\/pending-transfer$/) ? 'active' : '') }, 'Pending Transfer'))
            )
          ),
          
          div(
            // h4('Filter by State'),
            // state_filters(),
            
            h4('Filter by Registrar'),
            registrar_filters()
          )
        ),
      
        td({ style: 'vertical-align: top'},
          arguments
        )
      )
    ));
  });
  
  define('state_filters', function() {
    return div({ 'class': 'domain-filters' },
      // div(
      //   span(checkbox({ name: 'filter-state-toggle-all', checked: 'checked' }))
      // ),
      
      // div(
      //   span(checkbox({ name: 'filter-state-expiring', checked: 'checked' }), " Expiring Soon")
      // ),
      div(
        span(checkbox({ name: 'filter-state-transfers', checked: 'checked' }), " Pending Transfers")
      )
    );
  });
  
  define('registrar_filters', function(options) {
    return div({ 'class': 'domain-filters' },
      // div(
      //   span(checkbox({ name: 'filter-registrar-toggle-all', checked: 'checked' }))
      // ),
      
      div(
        span(checkbox({ name: 'filter-registrar-badger', checked: 'checked' }), " Badger")
      ),
      div(
        span(checkbox({ name: 'filter-registrar-godaddy', checked: 'checked' }), " GoDaddy")
      ),
      div(
        span(checkbox({ name: 'filter-registrar-networksolutions', checked: 'checked' }), " Network Solutions")
      ),
      div(
        span(checkbox({ name: 'filter-registrar-other', checked: 'checked' }), " Other")
      )
    );
  });
  
  // comparison method for Array#sort
  define('sort_by_domain_name', function(domain1, domain2) {
    if (domain1.name < domain2.name) return -1;
    if (domain1.name > domain2.name) return 1;
    return 0;
  });
  
  // comparison method for Array#sort
  define('sort_by_current_registrar', function(domain1, domain2) {
    if (domain1.current_registrar < domain2.current_registrar) return -1;
    if (domain1.current_registrar > domain2.current_registrar) return 1;
    return 0;
  });
  
  // comparison method for Array#sort
  define('sort_by_expiration_date', function(domain1, domain2) {
    d1 = new Date(domain1.expires_at);
    d2 = new Date(domain2.expires_at);
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  });
  
  // comparison method for Array#sort
  define('sort_by_auto_renew', function(domain1, domain2) {
    if (domain1.auto_renew && !domain2.auto_renew) return -1;
    if (!domain1.auto_renew && domain2.auto_renew) return 1;
    return 0;
  });
  
  /*
    Setup the javascript change event to dynamically alter the domains list
  */
  define('initialize_filters', function() {
    // update filters
    $("input[name^=filter-]").change(function() {
      // if this is a registrar filter box
      if (this.name.match(/^filter-registrar-/i)) {
        // pick off the registrar name from the checkbox name attribute
        var registrar = this.name.split('-').slice(-1)[0];

        // now toggle the row based on matcher
        toggle_show_of_rows_with_column_index_and_values(this.checked, 1, function(row_value) {
          if (registrar == 'other') {
            // get names of all known registrars
            // TODO update this regex as new filters are added. Perhaps just write code to
            // get all registrar names from filter @names and build a regex that way.
            return !row_value.match(/badger|godaddy|networksolutions/i);
          }

          return row_value.match(new RegExp(registrar, 'i'));
        });
      }
      
      // filter states
      if (this.name.match(/^filter-state-/i)) {
        var state_name = this.name.split('-').slice(-1)[0];
        var is_checked = this.checked;

        // don't need the domain objects to do apply this filter
        if (state_name == 'expiring') {
          toggle_show_of_rows_with_column_index_and_values(is_checked, 2, function(row_value) {
            var current_date = new Date();
            var expire_date = new Date(Date.parse(row_value));
            var days = parseInt(expire_date - current_date)/(24*3600*1000);
            
            return days <= 90;
          });
        }
        
        // need the domain objects to get transfer information
        BadgerCache.getDomains(function(response) {
          if (state_name == 'transfers') {
            // get list of all of the domains pending transfer
            var domains_pending_transfer = (response.data||[]).map(function(d) { if (d.transfer_steps) return d.name; }).compact();

            toggle_show_of_rows_with_column_index_and_values(is_checked, 0, function(row_value) {
              for (var i = 0; i < domains_pending_transfer.length; i++) {
                var regex = new RegExp(domains_pending_transfer[i], 'i');
                return row_value.match(regex);
              }
            });
          }
        });
      }
    });
  });
  
  /*
    look through all of the rows in the table, and
    show or hide the appropriate rows.
    all of the remaining arguments after @show and @column_index
    will be checked against table_row[@column_index] to show/hide
    
    @show           Show the row if true, hide the row if false
    @column_index   The index of the td whose value is checked
                      for equality against each of arguments.slice(2)
    @matcher        A function, whose return value is used for
                    matching. True to show, false to hide. If a function, then
                    the value row[@column_index] is passed in as the only argument.
                    
    Example:  
      Hide all of the rows whose second column value is equal to "Godaddy":
      
      toggle_show_of_rows_with_column_index_and_values(false, 1, function(row_value) {
        return !!row_value.match(/godaddy/i);
      });
  */
  define('toggle_show_of_rows_with_column_index_and_values', function(show, column_index, matcher) {
    $("#domains-table tr[class!=table-header]").each(function() {
      var row_value = this.children[column_index].innerHTML;
      var matched = !!matcher.call(null, row_value);
      
      if (matched) {
        show ? $(this).show() : $(this).hide();
      }
    });
  });
  
  define('sortable_domains_table', function(domains, target_div) {
    return div(
      transfer_linked_domains_message(domains, { style: 'margin-bottom: 20px;' }),
      
      table({ id: 'domains-table', 'class': 'fancy-table' }, tbody(
        tr({ 'class': 'table-header' },
          th({ 'class': 'table-sorter', style: 'width: 35%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_domain_name) }, 'Domain')),
          th({ 'class': 'table-sorter', style: 'width: 30%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_current_registrar) }, 'Registrar')),
          th({ 'class': 'table-sorter', style: 'width: 20%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_expiration_date) }, 'Expires')),
          th({ 'class': 'table-sorter', style: 'width: 15%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_auto_renew) }, 'Auto Renew'))
        ),
        (domains||[]).map(function(domain) {
          return tr(
            td(a({ href: '#domains/' + domain.name }, truncate_domain_name(domain.name))),
            td(domain.current_registrar),
            td(!domain.expires_at ? '' : new Date(domain.expires_at).toString('MMMM dd yyyy')),
            td(domain.auto_renew ? 'Enabled' : 'Disabled')
          );
        })
      ))
    );
  });
  
  define('sort_domains_and_update_table', function(domains, target_div, sort_method) {
    var before_domains = domains.slice(0);
    var sorted_domains = domains.stable_sort(sort_method);
    // var sorted_domains = domains.sort(sort_method);
    
    // reverses the elements in place, if already sorted by this
    if (before_domains.equal_to(sorted_domains)) sorted_domains.reverse();
    
    render({ into: target_div },
      sortable_domains_table(sorted_domains, target_div)
    );
    
    // need to explicitly reapply the filters
    apply_selected_filters();
  });
  
  define('apply_selected_filters', function() {
    $("input[name^=filter-]").trigger('change');
  });
  
  /*
    Don't let long domain names explode the index table
  */
  define('truncate_domain_name', function(domain_name, length) {
    length = (length || 25)
    name = domain_name.substring(0, length)
    if (domain_name.length > length) name = name + "..."
    return name;
  });

  /*
    Let the user know that they can transfer linked account domains to Badger!
  */
  define('transfer_linked_domains_message', function(domains, options) {
    var linked_domains = [];
    for (var i=0; i < domains.length; i++) {
      if ((domains[i].permissions_for_person.indexOf('linked_account') >= 0) && domains[i].supported_tld) linked_domains.push(domains[i]);
    }
    if (linked_domains.length > 0) {
      
      return div(options || {},
        info_message(
          a({ 'class': 'myButton small', style: 'float: right; margin-top: -4px', href: curry(Transfer.redirect_to_transfer_for_domain, linked_domains.map(function(d) { return d.name })) }, 'Begin Transfer'),
          "You have ", b(linked_domains.length, " domains"), " that can be automatically transferred to Badger!"
        )
      )
    }
  });
  
};