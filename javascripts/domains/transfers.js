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
          console.log(domains[i])
          results.push(domains[i]);
        }
      }
      
      render({ into: target_div }, 
        table({ 'class': 'fancy-table' },
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
                td(domain.transfer_status),
                td(domain.current_registrar),
                td(new Date(Date.parse(domain.expires_at)).toDateString())
              );
            })
          )
        )
      );
    });
  });
  
}
