with (Hasher('Domains','Application')) {
  route('#domains/transfers', function(filter, view_type) {
    var target_div = div('Loading...');

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
              th('Status'),
              th('Registrar'),
              th('Expires')
            ),

            results.map(function(domain) {
              return tr(
                td(a({ href: '#domains/' + domain.name }, Domains.truncate_domain_name(domain.name))),
                td(status_for_domain_transfer(domain)),
                td(domain.current_registrar),
                td(new Date(Date.parse(domain.expires_at)).toDateString())
              );
            })
          )
        )
      );
    });
  });
  
  define('status_for_domain_transfer', function(domain) {
    switch (domain.transfer_status) {
      case 'needs_unlock':
        return "Needs to be unlocked";
      case 'needs_privacy_disabled':
        return "Needs whois privacy disabled";
      case 'needs_auth_code':
        return "Needs authcode";
      case 'needs_transfer_request':
        return "Needs to retry transfer";
      case 'transfer_requested':
        return "Needs approval from current registrar";
    }
  });
}
