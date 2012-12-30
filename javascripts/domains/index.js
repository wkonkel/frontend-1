with (Hasher('DomainsIndex','Domains')) {
  route('#domains', function(domain_name) {
    var target_div = div(spinner('Loading domains...'));
    
    render(
      chained_header_with_links(
        { text: 'Domains' },
        { text: 'My Domains' }
      ),
      
      target_div
    );
    
    with_domains({
      callback: function(domains) {
        var domains_div = div();

        render({ into: domains_div },
          (domains.length > 0) && div({ style: 'margin-bottom: 50px' }, sortable_domains_table(domains, domains_div)),
          
          h2('Add domains to Badger:'),
          add_more_domains_icons()
        );
        
        // render message for incomplete profile (legacy rhinonames contacts) --- CAB
        var update_contact_message_div = div();
        BadgerCache.getContacts(function(response) {
          // hide contacts that aren't complete, and need to be updated
          // manually by the user (legacy contact data imported from rhinonames) --- CAB
          (response.data||[]).forEach(function(contact) {
            if (contact.needs_update) {
              render({ into: update_contact_message_div },
                div({ style: 'margin-top: 15px; text-align: center; font-size: 20px;' },
                  info_message("It looks like your profile isn't complete, please ", a({ href: '#account/profiles/edit/' + contact.id }, 'complete it now.'))
                )
              );
            }
          });
        });
        
        // render message for $5 domain
        var discounted_domain_message_div = div();
        if (domains.length <= 0) {
          Account.if_referral_signup_discount(function(account_info) {
            render({ into: discounted_domain_message_div },
              success_message(
                span(account_info.referrer.name + ' welcomes you to Badger with a $5 domain!')
              )
            );
          });
        }
        
        render({ into: target_div },
          div({ 'class': 'fancy' },
            update_contact_message_div,
            
            domains_nav_table(
              transfer_linked_domains_message(domains),
              discounted_domain_message_div,
              domains_div
            )
          )
        );
        
        initialize_filters({ domains: domains });
      }
    });
  });
  
  route('#domains/pending-transfer', function() {
    var target_div = div(spinner('Loading domains...'));
    
    render(
      chained_header_with_links(
        { text: 'Domains', href: '#domains' },
        { text: 'Pending Transfer' }
      ),
      target_div
    );
    
    long_poll({
      max_time: -1,
      interval: 15000,
      
      action: {
        method: BadgerCache.getDomains,
        on_ok: function(response, poll_data) {
          var domains = (response.data || []).filter(function(domain) {
            return domain.permissions_for_person.includes('pending_transfer');
          });
          
          var domains_div = div();
          
          if (domains.length > 0) {
            save_domain_filter_states();
            render({ into: domains_div },
              sortable_pending_transfer_table(domains, domains_div)
            );
            initialize_filters({ domains: domains });
          }
          
          render({ into: target_div },
            div({ 'class': 'fancy' },
              domains_nav_table(
                info_message(
                  a({ 'class': 'myButton small', style: 'float: right; margin-top: -4px', href: '#cart' }, 'Begin Transfer'),
                  "Do you have any domains at another registrar?"
                ),
                domains_div
              )
            )
          );
        }
      }
    })
  });
  
  route('#domains/expiring-soon', function() {
    var target_div = div(spinner('Loading domains...'));
    
    render(
      chained_header_with_links(
        { text: 'Domains', href: '#domains' },
        { text: 'Expiring Soon' }
      ),
      target_div
    );
    
    with_domains({
      filter: function(domain) {
        // filter out if missing expiration date for some reason
        if (!domain.expires_at) return false;
        
        var d1 = date();
        var d2 = date(domain.expires_at);
        var days = parseInt(d2 - d1)/(24*3600*1000);
        
        return days <= 90;
      },
      
      callback: function(domains) {
        var domains_div = div();
        
        if (domains.length <= 0) {
          render({ into: domains_div },
            div('None of your domains are expiring soon, so you have nothing to worry about!')
          );
        } else {
          render({ into: domains_div },
            transfer_linked_domains_message(domains),
            sortable_domains_table(domains, domains_div)
          );
        }
        
        render({ into: target_div },
          div({ 'class': 'fancy' },
            domains_nav_table(
              domains_div
            )
          )
        );
        
        initialize_filters({ domains: domains });
      }
    });
  });
  
};




















// with (Hasher('Domains','Application')) {
//   route('#filter_domains/:filter/:view_type', function(filter, view_type) {
//     render(
//       h1('Domains'),
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
//               var current_date = date();
//               var expire_date = date(domains[i].expires_at);
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
//             li(a({ href: '#domains/pending-transfer', 'class': (active_url == '#domains/pending-transfer' ? 'active' : '') }, 'Transfers')),
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
//             a({ 'class': 'myButton small', style: 'float: right; margin-top: -4px', href: curry(Cart.redirect_to_transfer_for_domain, linked_domains.map(function(d) { return d.name })) }, 'Begin Transfer'),
//             "You have ", b(linked_domains.length, " domains"), " that can be automatically transferred to Badger!"
//           )
//         )
//       );
//     }
//   });
// 
//   define('index_view', function(domains, filter, view_type) {
//     var empty_domain_message = [];
//     var title = "Domains";
//     switch (filter) {
//       case 'transfers':
//         empty_domain_message = [div("It looks like you don't have any domains in pending transfer.")];
//         title = "Domain Transfers";
//         break;
//       case 'expiringsoon':
//         empty_domain_message = [div("It looks like you don't have any domains expiring soon.")];
//         title = "Domains » Expiring Soon";
//         break;
//       default:
//         empty_domain_message = [
//         div("It looks like you don't have any domains registered with us yet. You should probably:"),
//         ul(
//           li(a({ href: function() { set_route('#search'); $('#form-search-input').focus(); } }, "Search for a new domain")), // --- This is really confusing without a redirect to #search CAB
//           li(a({ href: '#cart' }, "Transfer a domain from another registrar"))
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
//       //   a({ 'class': 'myButton small', href: '#cart' }, 'Transfer in a Domain')
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
//               td(domain.expires_at ? date(domain.expires_at).toString('MMMM dd yyyy') : '')
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
