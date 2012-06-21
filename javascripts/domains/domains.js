with (Hasher('Domains','Application')) {
  
  define('domains_nav_table', function() {
    var registrar_filters_div = div();
    
    var domains_nav_table = table({ style: 'width: 100%' }, tbody(
      tr(
        div({ id: 'transfer-prompt-div' })
      ),
      tr(
        td({ style: 'width: 200px; vertical-align: top;' },
          // domains nav
          div({ style: 'margin-bottom: 20px' },
            ul({ id: 'domains-left-nav' },
              li(a({ href: '#domains', 'class': (get_route().match(/^#domains$/) ? 'active' : '') }, 'All Domains')),
              li(a({ href: '#domains/pending-transfer', 'class': (get_route().match(/^#domains\/pending-transfer$/) ? 'active' : '') }, 'Pending Transfer')),
              li(a({ href: '#domains/expiring-soon', 'class': (get_route().match(/^#domains\/expiring-soon$/) ? 'active' : '') }, 'Expiring Soon'))
            )
          ),
          
          registrar_filters_div
        ),
      
        td({ style: 'vertical-align: top'},
          arguments
        )
      )
    ));
    
    // since this requires reading the domains from the cache,
    // it needs to work asynchronously like this
    build_registrar_filters(function(filters) {
      render({ into: registrar_filters_div }, filters);
    });
    
    return domains_nav_table;
  });
  
  /*
    Yield the domains fetched by BadgerCache.getDomains,
    but apply an optional filter before the yield,
    and initialize the filters' onChange code.
    
    options:
    @filter       Optional method to pass to the JavaScript
                    filter method.
    @for_each     Optional method to apply to each domain.
    @callback     Method to yield domains to. Passes the domains
                    array as the only argument.
  */
  define('with_domains', function(options) {
    BadgerCache.getDomains(function(response) {
      // filter domains if requested
      var domains = options.filter ? response.data.filter(options.filter) : response.data;
      if (options.for_each) domains.forEach(options.for_each);
      
      // sort domains by registrar, as the default presentation of the domains
      // domains = domains.stable_sort(sort_by_current_registrar);
      
      if (options.callback) options.callback(domains||[]);
      initialize_filters();
    });
  });
  
  /*
    Don't let long domain names explode the index table
  */
  define('truncate_domain_name', function(domain_name, length) {
    length = (length || 25);
    var name = domain_name.substring(0, length);
    if (domain_name.length > length) name = name + "...";
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
          b(linked_domains.length), " of these domains can be transferred to Badger automatically!"
        )
      )
    }
  });

  define('apply_selected_filters', function() {
    $("input[name^=filter-]").trigger('change');
  });
  
  /*
    Build filters from the map of registrar names.
  */
  define('build_registrar_filters', function(callback) {
    with_domains({
      callback: function(domains) {
        // callback(domains);
        
        // build an array of registrar names.
        // edge case: there is no current registrar for some reason. just return 'Unknown'
        var registrars = domains.map(function(d) {
          if (!d.current_registrar) {
            return 'Other';
          } else {
            return d.current_registrar;
          }
        }).unique();
        
        // if there is only on registrar, just render nothing and stop execution
        if (registrars.length <= 1) {
          return '';
        }
        
        // if Other is present, move it to the end of the array
        if (registrars.indexOf('Other') >= 0) {
          registrars.splice(registrars.indexOf('Other'), 1);
          registrars.push('Other');
        }
        
        // create the content for filters
        var filters = registrars.map(function(registrar) {
          return div(
            span(checkbox({ name: 'filter-registrar-' + registrar, checked: 'checked' }), registrar)
          );
        });
        
        callback(div({ id: 'registrar-filters-div' },
          h4('Filter by Registrar'),
          filters
        ));
      }
    });
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
    var d1 = date(domain1.expires_at);
    var d2 = date(domain2.expires_at);
    
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
  
  define('sort_by_transfer_progress', function(domain1, domain2) {
    var p1 = compute_transfer_progress_percentage(domain1);
    var p2 = compute_transfer_progress_percentage(domain2);
    return p1 == p2 ? 0 : (p1 < p2) ? -1 : 1;
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
          if (registrar.match(/other/i)) {
            // right now, of registrars is Other, then it means it's missing, so
            // just match empty strings
            return (row_value||"").length <= 0;
          }

          return row_value.match(new RegExp(registrar.escape_for_regexp(), 'i'));
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
      table({ id: 'domains-table', 'class': 'fancy-table' }, tbody(
        tr({ 'class': 'table-header' },
          th({ 'class': 'table-sorter', style: 'width: 35%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_domain_name, sortable_domains_table) }, 'Domain')),
          th({ 'class': 'table-sorter', style: 'width: 30%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_current_registrar, sortable_domains_table) }, 'Registrar')),
          th({ 'class': 'table-sorter', style: 'width: 20%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_expiration_date, sortable_domains_table) }, 'Expires'))
        ),
        (domains||[]).map(function(domain) {
          // return a colored expiration date
          var expiration_date = styled_expiration_date(domain);
          
          return tr({ 'class': 'domains-row' }, 
            td(a({ href: '#domains/' + domain.name }, truncate_domain_name(domain.name))),
            td({ 'class': 'registrar' }, domain.current_registrar),
            td({ 'class': 'expiration-date' }, expiration_date)
          );
        })
      ))
    );
  });
  
  define('sortable_pending_transfer_table', function(domains, target_div) {
    return div(
      table({ id: 'domains-table', 'class': 'fancy-table' }, tbody(
        tr({ 'class': 'table-header' },
          th({ 'class': 'table-sorter', style: 'width: 35%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_domain_name, sortable_pending_transfer_table) }, 'Domain')),
          th({ 'class': 'table-sorter', style: 'width: 30%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_current_registrar, sortable_pending_transfer_table) }, 'Registrar')),
          th({ 'class': 'table-sorter', style: 'width: 35%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_transfer_progress, sortable_pending_transfer_table) }, 'Transfer Progress'))
        ),
        (domains||[]).map(function(domain) {
          var step_percentage = compute_transfer_progress_percentage(domain);
          
          return tr({ 'class': 'domains-row' }, 
            td(a({ href: '#domains/' + domain.name }, truncate_domain_name(domain.name))),
            td({ 'class': 'registrar' }, domain.current_registrar),
            td(
              div({ 'class': "meter small green nostripes", style: 'height: 10px;' }, span({ style: "height: 10px; width: " + step_percentage + "%" }))
            )
          );
          
          animate_progress_bars();
        })
      ))
    );
  });
  
  /*
    Return (percentage * 100) of transfer progress for a domain.
  */
  define('compute_transfer_progress_percentage', function(domain) {
    // calculate step percentage, avoid divide by zero. 
    // default is just 1/total_steps
    var percent = 0;
    if (domain.transfer_in) percent += 20;
    if (domain.transfer_in && domain.transfer_in.unlock_domain == 'ok') percent += 20;
    if (domain.transfer_in && domain.transfer_in.enter_auth_code == 'ok') percent += 20;
    if (domain.transfer_in && domain.transfer_in.disable_privacy == 'ok') percent += 20;
    if (domain.transfer_in && domain.transfer_in.approve_transfer == 'ok') percent += 15;
    return percent;
  });
  
  define('styled_expiration_date', function(domain) {
    if (!domain.expires_at) return '';
    
    // Don't try to do anything too crazy if using IE.
    var ie_browser = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
    
    // var d1 = date();
    // var d2 = date(domain.expires_at);
    var d1 = date().getTime();
    var d2 = date(domain.expires_at).getTime();
    var days = parseInt(d2 - d1)/(24*3600*1000);
    
    var date_class = '';
    if (days <= 90 && days >= 30) {
      date_class = 'yellow'
    } else if (days < 30) {
      date_class = 'red'
    }
    
    // if the domain is set to auto renew, 
    // grey out the font
    var expiration_date_span;
    if (domain.auto_renew) {
      expiration_date_span = span({ 'class': date_class, style: 'color: #9B9B9B;' }, date(domain.expires_at).toString('MMMM dd yyyy'));
    } else {
      expiration_date_span = span({ 'class': date_class }, date(domain.expires_at).toString('MMMM dd yyyy'));
    }
    
    // quick hack: IE isn't computing
    if (ie_browser) {
      expiration_date_span = span(date(domain.expires_at).toString('MMMM dd yyyy'));
    }
    
    return expiration_date_span;
  })
  
  define('sort_domains_and_update_table', function(domains, target_div, sort_method, table_method) {
    var before_domains = domains.slice(0);
    var sorted_domains = domains.stable_sort(sort_method);
    // var sorted_domains = domains.sort(sort_method);
    
    // reverses the elements in place, if already sorted by this
    if (before_domains.equal_to(sorted_domains)) sorted_domains.reverse();
    
    render({ into: target_div },
      table_method(sorted_domains, target_div)
    );
    
    // need to explicitly reapply the filters
    apply_selected_filters();
  });
  
};
