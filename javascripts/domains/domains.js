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
      
      div(
        span(checkbox({ name: 'filter-state-expiring-soon', checked: 'checked' }), " Expiring Soon")
      ),
      div(
        span(checkbox({ name: 'filter-state-inbound-transfer', checked: 'checked' }), " Transfers")
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
  
  define('truncate_domain_name', function(domain_name, length) {
    length = (length || 25)
    name = domain_name.substring(0, length)
    if (domain_name.length > length) name = name + "..."
    return name;
  });
  
};