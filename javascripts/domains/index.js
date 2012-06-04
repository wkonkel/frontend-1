with (Hasher('Domains')) {
  route('#domains', function(domain_name) {
    var target_div = div(spinner('Loading domains...'));
    var domains_div = div();
    
    render(
      h1('My Domains'),
      target_div
    );
    
    BadgerCache.getDomains(function(response) {
      render({ into: domains_div },
        sortable_domains_table(response.data, domains_div)
      );
      
      render({ into: target_div },
        div({ 'class': 'fancy' },
          domains_nav_table(
            domains_div
          )
        )
      );
      
      initialize_filters();
    });
  });
  
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
  
  define('apply_selected_filters', function() {
    $("input[name^=filter-]").trigger('change');
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
    // no values were provided, just return
    if (arguments.length < 2) return;
    
    $("#domains-table tr[class!=table-header]").each(function() {
      var row_value = this.children[column_index].innerHTML;
      var matched = !!matcher.call(null, row_value);
      
      if (matched) {
        show ? $(this).show() : $(this).hide();
      }
    });
  });
  
  define('sortable_domains_table', function(domains, target_div) {
    return table({ id: 'domains-table', 'class': 'fancy-table' }, tbody(
      tr({ 'class': 'table-header' },
        th({ 'class': 'table-sorter', style: 'width: 35%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_domain_name) }, 'Domain')),
        th({ 'class': 'table-sorter', style: 'width: 30%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_current_registrar) }, 'Registrar')),
        th({ 'class': 'table-sorter', style: 'width: 20%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_expiration_date) }, 'Expires')),
        th({ 'class': 'table-sorter', style: 'width: 15%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_auto_renew) }, 'Auto Renew'))
      ),
      (domains||[]).map(function(domain) {
        return tr(
          td(a({ href: '#domains/' + domain.name }, domain.name)),
          td(domain.current_registrar),
          td(new Date(domain.expires_at).toString('MMMM dd yyyy')),
          td(domain.auto_renew ? 'Enabled' : 'Disabled')
        );
      })
    ));
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
  
  
};




















// with (Hasher('Domains','Application')) {
//   route('#filter_domains/:filter/:view_type', function(filter, view_type) {
//     render(
//       h1('My Domains'),
//       domain_index_nav_table()
//     );
//     
//     BadgerCache.getDomains(function(domains) {
//       var results = [];
//       if (view_type == null)
//         view_type = "list";
//       switch (filter){
//         // case 'transfers':
//         //   for (i = 0; i < domains.length; i ++) {
//         //     if ((domains[i].permissions_for_person||[]).indexOf('initiated_transfer') >= 0) {
//         //       console.log(domains[i])
//         //       results.push(domains[i]);
//         //     }
//         //   }
//         //   break;
//         case 'expiringsoon':
//           for (i = 0; i < domains.length; i ++) {
//             if (domains[i].expires_at) {
//               var current_date = new Date();
//               var expire_date = new Date(Date.parse(domains[i].expires_at));
// 
//               var days = parseInt(expire_date - current_date)/(24*3600*1000);
//               if (days <= 90)
//                 results.push(domains[i]);
//             }
//           }
//           break;
//         default:
//           filter = 'all';
//           results = domains
//       }
//       render(index_view(results, filter, view_type));
//       if (view_type == 'grid')
//         create_grid_view(results);
//     });
//   });
// 
//   define('truncate_domain_name', function(domain_name, length) {
//     length = (length || 25)
//     name = domain_name.substring(0, length)
//     if (domain_name.length > length) name = name + "..."
//     return name;
//   });
// 
//   define('create_grid_view', function(domains) {
//     var domain_names = [];
//     var search_keys = [];
//     $.each(domains, function() {
//       domain_names.push(this.name);
//       key = this.name.split(".")[0]
//       if (search_keys.indexOf(key) == -1)
//         search_keys.push(key);
//     })
// 
//     $.each(search_keys, function(){
//       var key = this.toString();
//       $('#grid tbody').append(add_grid_view(domain_names, [[key, null], [key, null]]));
//       Badger.domainSearch(this, false, function(resp) {
//         $("#grid tbody tr[key='" + key + "']").replaceWith(add_grid_view(domain_names, resp.data.domains));
//       });
//     });
// 
//     var name = BadgerCache.cached_account_info.data.name.toLowerCase();
//     var suggest_keys = [];
//     var first_name = name.split(" ")[0];
//     suggest_keys.push(first_name);
//     suggest_keys.push(name.replace(first_name,"").replace(/ /g, ""));
//     suggest_keys.push(name.replace(/ /g, ""));
//     suggest_keys.push(name.replace(/ /g, "-"));
//     $.each(suggest_keys, function(){
//       var key = this.toString();
//       $('#suggest-grid tbody').append(add_grid_view(domain_names, [[key, null], [key, null]]));
//       Badger.domainSearch(this, false, function(resp) {
//         $("#suggest-grid tbody tr[key='" + key + "']").replaceWith(add_grid_view(domain_names, resp.data.domains));
//       });
//     });
//   });
//   
//   define('domain_index_nav_table', function() {
//     var active_url = get_route().replace('grid', 'list');
//     
//     return table({ style: 'width: 100%' }, tbody(
//       tr(
//         td({ style: 'width: 200px; vertical-align: top' },
//           ul({ id: 'domains-left-nav' },
//             li(a({ href: '#domains', 'class': (active_url == '#domains' ? 'active' : '') }, 'All Domains')),
//             li(a({ href: '#domain-transfers', 'class': (active_url == '#domain-transfers' ? 'active' : '') }, 'Transfers')),
//             li(a({ href: '#filter_domains/expiringsoon/list', 'class': (active_url == '#filter_domains/expiringsoon/list' ? 'active' : '') }, 'Expiring Soon'))
//           )
//         ),
//         
//         td({ style: 'vertical-align: top'},
//           (arguments.length < 1) ? spinner('Loading domains...') : arguments
//         )
//       )
//     ));
//   });
// 
//   define('transfer_linked_domains_row', function(domains) {
//     var linked_domains = [];
//     for (var i=0; i < domains.length; i++) {
//       if ((domains[i].permissions_for_person.indexOf('linked_account') >= 0) && domains[i].supported_tld) linked_domains.push(domains[i]);
//     }
//     if (linked_domains.length > 0) {
//       return tr({ 'class': 'table-header' },
//         td({ colSpan: 3 }, 
//           info_message(
//             a({ 'class': 'myButton small', style: 'float: right; margin-top: -4px', href: curry(Transfer.redirect_to_transfer_for_domain, linked_domains.map(function(d) { return d.name })) }, 'Begin Transfer'),
//             "You have ", b(linked_domains.length, " domains"), " that can be automatically transferred to Badger!"
//           )
//         )
//       );
//     }
//   });
// 
//   define('index_view', function(domains, filter, view_type) {
//     var empty_domain_message = [];
//     var title = "My Domains";
//     switch (filter) {
//       case 'transfers':
//         empty_domain_message = [div("It looks like you don't have any domains in pending transfer.")];
//         title = "Domain Transfers";
//         break;
//       case 'expiringsoon':
//         empty_domain_message = [div("It looks like you don't have any domains expiring soon.")];
//         title = "My Domains » Expiring Soon";
//         break;
//       default:
//         empty_domain_message = [
//         div("It looks like you don't have any domains registered with us yet. You should probably:"),
//         ul(
//           li(a({ href: function() { set_route('#search'); $('#form-search-input').focus(); } }, "Search for a new domain")), // --- This is really confusing without a redirect to #search CAB
//           li(a({ href: '#domains/transfer' }, "Transfer a domain from another registrar"))
//         ),
//         div("Then this page will be a lot more fun.")
//       ];
//     }
// 
//     return div(
//       h1(
//        span(span(title), span({ id: filter + '-my-domains-h1' })),
//        span({ style: 'padding-left: 20px' },
//          a({href: "#filter_domains/" + filter + "/list"}, img({ src: 'images/icon-list-view.jpg' })),
//          ' ',
//          a({href: "#filter_domains/" + filter + "/grid"}, img({ src: 'images/icon-grid-view.gif' }))
//        )
//      ),
//       // div({ style: 'float: right; margin-top: -44px' },
//       //   a({ 'class': 'myButton small', href: '#domains/transfer' }, 'Transfer in a Domain')
//       // ),
//       
//       domain_index_nav_table(
//         (typeof(domains) == 'undefined') ? [
//           spinner('Loading domains...')
//         ]:((domains.length == 0) ? 
//          empty_domain_message
//         : [ 
//           this[view_type + '_view'](domains)
//        ])
//       )
//     );
//   });
// 
//   define('list_view', function(domains) {
//     // changed the getDomains response for compatibility with long_poll --- CAB
//     domains = domains.data;
//     
//     return [
//       table({ 'class': 'fancy-table' },
//         tbody(
//           transfer_linked_domains_row(domains),
// 
//           tr({ 'class': 'table-header' },
//             th('Name'),
//             th('Registrar'),
//             th('Expires')
//           ),
//           
//           (domains || []).map(function(domain) {
//             return tr(
//               td(a({ href: '#domains/' + domain.name }, Domains.truncate_domain_name(domain.name))),
//               td(domain.current_registrar),
//               td(domain.expires_at ? new Date(Date.parse(domain.expires_at)).toString('MMMM dd yyyy') : '')
//               
//               // td(
//               //   // img({ src: 'images/apps/facebook-icon.png'}),
//               //   // ', ',
//               //   a({ href: '#domains/' + domain.name + '/registration' }, 'registration'),
//               //   ', ',
//               //   a({ href: '#domains/' + domain.name + '/dns' }, 'dns')
//               // )
//             );
//           })
//         )
//       )
//     ];
//   });
// 
//   define('add_grid_view', function(domains, results) {
//     var available_extensions = $.grep(results, function(ext) {
//       return ext[1];
//     });
// 
//     return tr( {'key': results[0][0].split('.')[0]},
//       td(Domains.truncate_domain_name(results[0][0].split('.')[0], 40)),
// 
//       results.map(function(domain) {
//         var tld = domain[0].split('.')[1];
//         if (domains.indexOf(domain[0])!=-1)
//           return td({ 'class': 'tld'}, a({ href: '#domains/' + domain[0], style: 'color: #0a0' }, img({ src: "images/check.png" }), ' ', tld));
//         else {
//          if (!tld) return span();
//          else if (domain[1]) return td({ 'class': 'tld' }, a({ href: curry(Register.show, domain[0], $.grep(available_extensions, function(ext) { return ext != domain })) }, img({ src: "images/icon-plus.png" }), ' ', tld));
//          else return td({ 'class': 'tld' }, span(img({ src: "images/icon-no-light.gif" }), ' ', span({ style: 'text-decoration: line-through' }, tld)));
//         }
//       })
//     );
//   })
// 
//   define('grid_view', function(domains) {
//     return [
//       table({ id: 'grid', 'class': 'fancy-table' }, tbody()),
//       table({ id: 'suggest-grid', 'class': 'fancy-table' }, tbody())
//     ];
//   });
// 
// }
