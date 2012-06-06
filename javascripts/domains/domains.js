with (Hasher('Domains','Application')) {
  
  define('domains_nav_table', function() {
    return table({ style: 'width: 100%' }, tbody(
      tr(
        td({ style: 'width: 180px; vertical-align: top;' },
          div(
            h4('Filter by State'),
            state_filters(),
            
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
  
  define('registrar_filters', function() {
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