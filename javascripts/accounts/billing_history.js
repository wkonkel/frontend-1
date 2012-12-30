with (Hasher('Billing','Application')) {

  route('#account/billing', function() {
    var target_div = div(
      spinner("Loading...")
    );

    render(
      div(
        chained_header_with_links(
          { text: 'My Account', href: '#account' },
          { text: 'Billing & Credits' }
        ),
        div({ style: 'float: right; margin-top: -44px' },
          a({ 'class': 'myButton small', href: '#account/billing/credits' }, 'Purchase Credits')
        ),
        Account.account_nav_table(target_div)
      )
    )
    
    Badger.getCreditHistory(function(results) {
      render({ target: target_div }, 
        ((results.data||[]).length == 0) ? 'No history found.' : table({ 'class': 'fancy-table' },
          tbody(
            tr({ 'class': 'table-header' },
              th('Date'),
              th('Description'),
              th('Domain'),
              th({ style: "text-align: right" }, 'Credits')
            ),
            
            results.data.map(function(credit_history) {
              return tr(
                td(date(credit_history.created_at).toString('MMMM dd yyyy')),
                td(credit_history.details),
                td(credit_history.domain ? a({ href: '#domains/' + credit_history.domain.name }, Domains.truncate_domain_name(credit_history.domain.name, 30)) : ''),
                td({ style: "text-align: right" }, credit_history.num_credits)
              );
            })
          )
        )        
        
      );
    });
  });

}
