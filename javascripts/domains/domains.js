with (Hasher('Domains','Application')) {
  /*
    Build a nav table for a specific domain. Fetches domain info from server
    and passes it to the callback.
    
    example:
    registration_nav_table_for_domain('test.com', function(nav_table, domain_obj) {
      render(
        h1('My Page'),
        
        nav_table(
          div('code wrapped by nav'),
          div('My domain: ' + domain_obj.name)
        )
      );
    });
  */
  define('with_domain_nav', function(domain, callback) {
    BadgerCache.getDomain(domain, function(response) {
      var domain_obj = response.data||{};

      var active_url = get_route();
      var base_url = '#domains/' + domain;

      var permissions = domain_obj.permissions_for_person || [];
      var show_transfer_out = !domain_obj.locked && permissions.includes('transfer_out'),
          show_whois = !domain_obj.available && !(domain_obj.current_registrar||'').match(/^unknown$/i),
          show_settings = permissions.includes('renew');

      var cloudflare_app = Hasher.domain_apps['badger_cloudflare'] || {},
          show_cloudflare = (/\/apps\/cloudflare\/install$/).test(get_route()) || (cloudflare_app.is_installed && cloudflare_app.is_installed(domain_obj));

      // TODO set the default menu if the domain TLD is not supported
      var nav_table = function() {
        return table({ style: 'width: 100%' }, tbody(
          tr(
            td({ style: 'width: 200px; vertical-align: top' },
              ul({ id: 'domains-left-nav' },
                li(a({ href: base_url, 'class': (active_url.match(/^#domains\/([-a-z0-9]+\.)+[a-z]{2,}$/i) ? 'active' : '') }, 'Applications')),
                show_whois && li(a({ href: (base_url + '/whois'), 'class': (active_url.match(/^#domains\/([-a-z0-9]+\.)+[a-z]{2,}\/whois$/) ? 'active' : '') }, 'Registration')),
                show_settings && li(a({ href: (base_url + '/renew'), 'class': (active_url.match(/^#domains\/([-a-z0-9]+\.)+[a-z]{2,}\/renew$/) ? 'active' : '') }, 'Renew')),
                show_settings && li(a({ href: (base_url + '/settings'), 'class': (active_url.match(/^#domains\/([-a-z0-9]+\.)+[a-z]{2,}\/settings$/) ? 'active' : '') }, 'Settings')),
                show_cloudflare && li(a({ id: 'cloudflare-tab', href: (base_url + '/apps/cloudflare'), 'class': (active_url.match(/^#domains\/([-a-z0-9]+\.)+[a-z]{2,}\/apps\/cloudflare/) ? 'active' : '') }, 'Cloudflare')),
                show_transfer_out && li(a({ href: (base_url + '/transfer-out'), 'class': (active_url.match(/^#domains\/([-a-z0-9]+\.)+[a-z]{2,}\/transfer-out$/) ? 'active' : '') }, 'Transfer Out'))
              ),
              div({ style: 'margin: 15px 5px;' },
                Share.icons()
              )
            ),


            td({ style: 'vertical-align: top'},
              arguments
            )
          )
        ));
      };

      callback(nav_table, response.meta.status != 'ok' ? null : domain_obj);
    });
  });


  define('domains_nav_table', function() {
    var registrar_filters_div = div(),
        rewards_progress_div = div();
    
    var domains_nav_table = table({ style: 'width: 100%' }, tbody(
      tr(
        div({ id: 'transfer-prompt-div' })
      ),
      tr(
        td({ style: 'width: 200px; vertical-align: top;' },
          // domains nav
          div({ style: 'margin-bottom: 20px' },
            ul({ id: 'domains-left-nav' },
              li(a({ onClick: curry(save_domain_filter_states_and_set_route, '#domains'), 'class': (get_route().match(/^#domains$/) ? 'active' : '') }, 'My Domains')),
              li(a({ onClick: curry(save_domain_filter_states_and_set_route, '#domains/pending-transfer'), 'class': (get_route().match(/^#domains\/pending-transfer$/) ? 'active' : '') }, 'Pending Transfers')),
              li(a({ onClick: curry(save_domain_filter_states_and_set_route, '#domains/expiring-soon'), 'class': (get_route().match(/^#domains\/expiring-soon$/) ? 'active' : '') }, 'Expiring Soon'))
            )
          ),
          registrar_filters_div,
          rewards_progress_div
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

    // render the progress bar with rewards points earned
    BadgerCache.getAccountInfo(function(response) {
      // only render if person created a referral code
      if (((response.data||{}).referral_codes||[]).length <= 0) return;
      
      var referral_stats = (response.data||{}).referral_stats,
          points_to_display = ((referral_stats.points_earned - referral_stats.points_redeemed) >= 100 ? 100 : referral_stats.points_earned % 100);
      render({ into: rewards_progress_div },
        info_message({ id: 'mini-progress-bar', style: 'margin-top: 15px; margin-right: 25px; padding: 10px; text-align: center;' },
          span(b(points_to_display+'/100'), ' points earned'),
          div({ 'class': 'meter small green nostripes', style: 'height: 10px;' },
            span({ style: 'height: 10px; width: ' + (points_to_display)+'' + '%' })
          ),
          a({ href: '#rewards', style: 'margin-top: 3px;' }, 'Earn More Points!')
        )
      );
    });

    return domains_nav_table;
  });
  
  define('add_more_domains_icons', function() {
    return div((arguments[0] || {}),
      table(tbody(
        tr(
          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Register a New Domain',
              image_src: 'images/apps/dns.png',
              href: '#search'
            })
          ),

          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Transfer in Your Domain',
              image_src: 'images/apps/web-forward.png',
              href: '#cart'
            })
          ),

          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Link With: GoDaddy',
              image_src: 'images/apps/godaddy.png',
              href: '#linked_accounts/godaddy/link'
            })
          ),

          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Link With: Network Solutions',
              image_src: 'images/apps/ns.png',
              href: '#linked_accounts/networksolutions/link'
            })
          ),
          
          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Link With: eNom',
              image_src: 'images/apps/enom.png',
              href: '#linked_accounts/enom/link'
            })
          )
        )
      ))
    );
  });

  define('link_domains_icons', function() {
    return div((arguments[0] || {}),
      table(tbody(
        tr(
          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Link With: GoDaddy',
              image_src: 'images/apps/godaddy.png',
              href: '#linked_accounts/godaddy/link'
            })
          ),

          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Link With: Network Solutions',
              image_src: 'images/apps/ns.png',
              href: '#linked_accounts/networksolutions/link'
            })
          ),

          td({ style: 'vertical-align: top' },
            app_store_icon({
              name: 'Link With: eNom',
              image_src: 'images/apps/enom.png',
              href: '#linked_accounts/enom/link'
            })
          )
        )
      ))
    );
  });

  define('save_domain_filter_states_and_set_route', function(route) {
    save_domain_filter_states();
    set_route(route);
    apply_selected_filters();
  });
  
  define ('save_domain_filter_states', function() {
    var domain_filter_states = {};
    $(':checkbox[name^=filter-registrar]').each(function() {
      domain_filter_states[this.name] = this.checked;
    });
    Badger.Session.write({ 'domain_filter_states': domain_filter_states });
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
    var linked_domains = domains.filter(function(domain) {
      return (domain.permissions_for_person.includes('linked_account')) && domain.supported_tld && !BadgerCart.find_domain({ name: domain.name });
    });

    var add_domains_to_cart_and_redirect = function() {
      for (var i=0; i<linked_domains.length; i++) Cart.add_domain(linked_domains[i]);
      set_route('#cart');
    };

    // just return now if no linked domains
    if (linked_domains.length > 0) {
      return info_message({ id: 'auto-transfer-message' },
        a({ 'class': 'myButton small', style: 'float: right; margin-top: -4px', onclick: function(e) { $(this.parent).toggle(); }, href: add_domains_to_cart_and_redirect }, 'Add ' + linked_domains.length + ' Domains to Cart'),
        span({ id: 'count', style: 'font-weight: bold' }, linked_domains.length), " of these domains can be transferred to Badger automatically!"
      );
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
        
        // if there is only onw registrar, just render nothing and stop execution
        if (registrars.length <= 1) {
          return '';
        }
        
        // if Other is present, move it to the end of the array
        if (registrars.indexOf('Other') >= 0) {
          registrars.splice(registrars.indexOf('Other'), 1);
          registrars.push('Other');
        }
        
        // read the previous domain filter_states
        var previous_filter_states = Badger.Session.get('domain_filter_states') || {};
        
        // create the content for filters
        var filters = registrars.map(function(registrar) {
          var filter_name = 'filter-registrar-' + normalized_registrar_name(registrar),
              filter_checkbox = null;
          
          // if explicitly set to true, or not yet set, render the box checked.
          if (!!previous_filter_states[filter_name] || previous_filter_states[filter_name] == undefined) {
            filter_checkbox = checkbox({ name: filter_name, id: filter_name, checked: 'checked' });
          } else {
            filter_checkbox = checkbox({ name: filter_name, id: filter_name });
          }
          
          return div(
            span(filter_checkbox, label({ 'for': filter_name }, registrar))
          );
        });
        
        callback(div({ id: 'registrar-filters-div' },
          h4('Filter by Registrar'),
          filters
        ));
      }
    });
  });
  
  define('normalized_registrar_name', function(registrar_name) {
    return registrar_name.replace(/\W+/,'').replace(/\./,'').toLowerCase();
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
  define('initialize_filters', function(options) {
    options = options || {};
    var linked_domains = [];
    if (options.domains) {
      for (var i=0; i < options.domains.length; i++) {
        if ((options.domains[i].permissions_for_person.indexOf('linked_account') >= 0) && options.domains[i].supported_tld) linked_domains.push(options.domains[i].name);
      }
    }
    
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

          return normalized_registrar_name(row_value).match(new RegExp(registrar.escape_for_regexp(), 'i'));
        });
      }
      
      // update the 'transfer X domains to Badger' counter
      if (linked_domains.length > 0) {
        var visible_domains = $('table#domains-table tr[class=domains-row]:visible').map(function() { return $(this.children[0]).find('a').html(); }),
            count = 0;
        for (var i = 0; i < visible_domains.length; i++) {
          if (linked_domains.includes(visible_domains[i])) count++;
        }
        
        if (count > 0) {
          $('div#auto-transfer-message').show();
          $('div#auto-transfer-message #count').html(count);
        } else {
          $('div#auto-transfer-message').hide();
        }
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
          th({ 'class': 'table-sorter', style: 'width: 35%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_current_registrar, sortable_domains_table) }, 'Registrar')),
          th({ 'class': 'table-sorter', style: 'width: 30%;' }, a({ onclick: curry(sort_domains_and_update_table, domains, target_div, sort_by_expiration_date, sortable_domains_table) }, 'Expires / Renews'))
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
          // TODO get this to work
//          setTimeout('DomainShow.update_progress_bar(' + step_percentage + ', "progress-' + domain.name + '")', 50);
          return tr({ 'class': 'domains-row' },
            td(a({ href: '#domains/' + domain.name }, truncate_domain_name(domain.name))),
            td({ 'class': 'registrar' }, domain.current_registrar),
            td(
              div({ 'class': "meter small green nostripes", style: 'height: 10px;' },
                  span({ style: "height: 10px; width: " + step_percentage + "%", id: "progress-" + domain.name }))
            )
          );
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
    if (domain.transfer_in && domain.transfer_in.unlock_domain == 'ok') percent += 15;
    if (domain.transfer_in && domain.transfer_in.enter_auth_code == 'ok') percent += 15;
    if (domain.transfer_in && domain.transfer_in.disable_privacy == 'ok') percent += 15;
    if (domain.transfer_in && domain.transfer_in.accept_foa == 'ok') percent += 15;
    if (domain.transfer_in && domain.transfer_in.approve_transfer == 'ok') percent += 15;
    return percent;
  });
  
  define('styled_expiration_date', function(domain) {
    if (!domain.expires_at) return '';
    
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
    
    if (domain.badger_registration && domain.auto_renew) {
      return span(date(domain.expires_at).toString('MMMM dd yyyy'), ' ', a({ style: 'color: #B8B8B8; text-decoration: none', href: '#domains/' + domain.name + '/settings' }, '(auto)'));
    } else {
      return span({ 'class': date_class }, date(domain.expires_at).toString('MMMM dd yyyy'));
    }
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

  route('#foa_accepted/:domain', function(domain) {
    render(
      h1('Transfer Authorized'),
      div('Thank you! You have authorized the domain ', a({ href: '#domains/' + domain }, domain), ' for transfer.')
    );
  });

}
