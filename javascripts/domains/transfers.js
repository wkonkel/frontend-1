with (Hasher('Domains','Application')) {
  route('#domain-transfers', function(filter, view_type) {
    var target_div = div('Loading...');
    
    // force reload of domains
    BadgerCache.flush('domains')

    render(
      h1('Domain Transfers'),
      div({ style: 'float: right; margin-top: -44px' },
        a({ 'class': 'myButton small', href: Transfer.show }, 'Transfer in a Domain')
      ),
      target_div
    );

    BadgerCache.getDomains(function(domains) {
      var results = [];
      
      for (var i = 0; i < domains.length; i ++) {
        if ((domains[i].permissions_for_person||[]).indexOf('pending_transfer') >= 0) {
          results.push(domains[i]);
        }
      }
      
      render({ into: target_div }, 
        results.length == 0 ? p("It looks like you don't have any domains in pending transfer.")
          : table({ 'class': 'fancy-table' },
          tbody(
            tr({ 'class': 'table-header' },
              th('Name'),
              th('Complete'),
              th('Registrar'),
              th('Expires')
            ),

            results.map(function(domain) {
              return tr(
                td(a({ href: '#domains/' + domain.name }, Domains.truncate_domain_name(domain.name))),
                td(complete_percentage_for(domain)),
                td(domain.current_registrar),
                td(new Date(Date.parse(domain.expires_at)).toDateString())
              );
            })
          )
        )
      );
    });
  });
  
  define('complete_percentage_for', function(domain) {
    return (domain.steps_completed.length * 100)/(domain.steps_completed.length + domain.steps_pending.length) + '%';
  });
}
