with (Hasher('DnsApp','DomainApps')) {

  register_domain_app({
    id: 'dns',
    name: 'DNS',
    icon: 'images/apps/dns.png',
    menu_item: { text: 'DNS', href: '#domains/:domain/apps/dns', css_class: 'dns' }
  });

  // // use cases:
  // 1. badger registration. badger nameservers.  // nameservers_button dns_manager 
  // 2. badger registration. no/remote nameservers.  // nameservers_button use_badger_nameservers_splash
  // 
  // 3. remote registration. badger nameservers. linked account.  // nameservers_button dns_manager
  // 4. remote registration. no/remote nameservers.  linked account. // nameservers_button import_dns_button remote_dns_viewer 
  // 
  // 5. remote registration. badger nameservers. no linked account.      // dns_manager
  // 6. remote registration. no/remote nameservers.  no linked account.  // dns_viewer

  route('#domains/:domain/apps/dns', function(domain) {
    var content_div = div(spinner('Loading DNS records...'));
    var message_div = div();
    var button_div = div({ style: 'float: right; margin-top: -44px' });
    
    with_domain_nav_for_app(domain, Hasher.domain_apps['dns'], function(nav_table, domain_obj) {
      render(
        h1_for_domain(domain, 'DNS'),
        nav_table(
          button_div,
          message_div,
          content_div
        )
      );
    });
    
    Badger.getDomain(domain, function(response) {
      var domain_obj = response.data;
      if (response.meta.status == 'ok') {
        var badger_dns = domain_obj.badger_dns;
        var modify_dns = $.inArray("modify_dns", domain_obj.permissions_for_person || []) >= 0;
        var change_nameservers = $.inArray("change_nameservers", domain_obj.permissions_for_person || []) >= 0;
        
        // if it's a domain registered at badger
        if (domain_obj.badger_registration || domain_obj.linkable_registrar) {
          if (change_nameservers)
            render({ into: button_div }, change_name_servers_button(domain_obj));
        } else if (change_nameservers) {
          render({ into: button_div }, 
            a({ 'class': 'myButton small', href: curry(show_you_need_to_update_your_nameservers_manually_modal, domain_obj) }, 'Nameservers')
          );
        }

        // switch to badger dns message
        if (!modify_dns && !badger_dns && change_nameservers) {
          render({ into: message_div }, div({ 'class': 'error-message' }, "NOTE: These records are read-only because you are not using Badger nameservers. ",
            a({ href: curry(change_name_servers_modal, domain_obj) }, "Switch to Badger DNS?") )
          );
        }
        
        render_records({ into: content_div, read_only: !modify_dns }, domain_obj);
      } else {
        render({ into: content_div }, error_message(response));
      }
    });
  });

  define('render_records', function(options, domain) {
    var domain_obj = $.extend(true, {}, domain);
    var app_dns= get_dns_of_installed_apps_list(domain_obj);
    
    //move Badger NS and SOA records into their own array
    var auto_dns = [], dns = [];
    domain_obj.dns.forEach(function(r) {
      ((r.record_type == "soa" || (r.record_type == "ns" && r.content.match(/badger\.com$/))) ? auto_dns : dns).push(r)
    });
    
    render({ into: options.into }, 
      div({ id: 'errors' }),
      table({ 'class': 'fancy-table' },
        tbody(
          tr({ 'class': 'table-header' },
            th('Type'),
            th('Subdomain'),
            th('Content'),
            th('TTL'),
            th(' ')
          ),

          options.read_only ? [] : tr(
            td(
              select({ id: 'dns-add-type', onchange: function() { show_correct_form_fields(); } },
                option('A'),
                option('AAAA'),
//                option('ALIAS'),
                option('CNAME'),
                option('MX'),
                option('TXT'),
//                option('SRV'),
                option('NS')
              )
            ),
            td(input({ id: 'dns-add-subdomain' }), div({ 'class': 'long-domain-name domain-name-label' }, '.' + domain_obj.name)),
            td(
              select({ id: 'dns-add-content-priority' }, option('10'), option('20'), option('30'), option('40'), option('50')),
              input({ id: 'dns-add-content-ipv4', placeholder: 'XXX.XXX.XXX.XXX' }),
              input({ id: 'dns-add-content-ipv6', placeholder: 'XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX' }),
              input({ id: 'dns-add-content-host', placeholder: 'example.com' }),
              input({ id: 'dns-add-content-text', placeholder: 'SPF, domain keys, etc.' }),
              input({ id: 'dns-add-content-ns',   placeholder: 'ns1.example.com' })
            ),
            td(
              select({ id: 'dns-add-ttl' },
                option({ value: '1800' }, '30 mins'),
                option({ value: '3600' }, '1 hour'),
                option({ value: '21600' }, '6 hours'),
                option({ value: '43200' }, '12 hours'),
                option({ value: '86400' }, '1 day'),
                option({ value: '259200' }, '3 days'),
                option({ value: '604800' }, '1 week')
              )
            ),
            td({ style: 'text-align: center' }, button({ style: "background-image: url(images/add.gif); background-color:Transparent; border: none; width: 16px; height: 16px; cursor: pointer", onclick: curry(dns_add, domain_obj.name) }))
          ),

          sort_dns_records(dns).map(function(record) {
            return record_row(record, domain_obj.name, !options.read_only)
          }),
          
          auto_dns.length == 0 ? [] : auto_dns_record_rows(sort_auto_dns_records(auto_dns), domain_obj.name),

          app_dns.map(function(app_item) {
            return app_dns_rows(app_item.name, app_item.id, sort_dns_records(app_item.requires.dns), domain_obj);
          })
        )
      )
    );
    show_correct_form_fields();
  });

  
  define('show_you_need_to_update_your_nameservers_manually_modal', function(domain_obj) {
    // TODO: wire in DNS auto-import
    show_modal(
      h1('Change Your Nameservers'),
      p('Please log into ', domain_obj.current_registrar, ' and manually change your nameservers to:'),
      ul(
        li('ns1.badger.com'),
        li('ns2.badger.com')
      ),
      div({ style: 'text-align: center' },
        a({ 'class': 'myButton', href: hide_modal }, 'Close')
      )
    );
  });
  









    // 
    //   var domain_info = response.data'];
    // 
    // 
    //   if (domain_info.name_servers.join(',') == 'ns1.badger.com,ns2.badger.com') {
    //     var app_dns = []
    //     load_domain(domain, function(domain_obj) {
    //       render(manager_view(domain_info, domain_obj.dns, app_dns));
    //       show_correct_form_fields();
    //     });
    //   } else {
    //     render('Reading DNS from external servers...');
    //     set_route('#domains/' + domain + '/remote_dns');
    //   }
    // });



    // render('Loading...');
    // 
    // Badger.getDomain(domain, function(response) {
    //   var domain_info = response['data'];
    //   if (domain_info.name_servers.join(',') == 'ns1.badger.com,ns2.badger.com') {
    //     var app_dns = []
    //     load_domain(domain, function(domain_obj) {
    //       for (var key in Hasher.domain_apps) {
    //         var app = Hasher.domain_apps[key];
    //         if (app.requires.dns && app_is_installed_on_domain(app, domain_obj)) {
    //           var app_result = { app_id: key, app_name: app.name, records: [] }
    //           for (var dns_record in app.requires.dns) {
    //             for (var i=0; app.requires.dns && (i<app.requires.dns.length); i++) {
    //               var found_record = domain_has_record(domain_obj, app.requires.dns[i]);
    //               if (found_record) {
    //                 app_result.dns.push(found_record);
    // 
    //                 domain_obj.dns = $.grep(domain_obj.dns, function(value) {
    //                   return value != found_record;
    //                 });
    //               }
    //             }
    //           }
    //           app_dns.push(app_result);
    //         }
    //       }
    //       render(manager_view(domain_info, domain_obj.dns, app_dns));
    //       show_correct_form_fields();
    //     });
    //   } else {
    //     render('Reading DNS from external servers...');
    //     set_route('#domains/' + domain + '/remote_dns');
    //   }
    // });

  route('#domains/:domain/apps/remote_dns', function(domain) {
    load_domain(domain, function(domain_info) {
      render(
        div(
          h1('Nameservers for ' + domain),
          change_name_servers_button(domain_info),

          p("You are not currently using Badger DNS."),
          h2('Remote Name Servers'),
          ((domain_info.name_servers && domain_info.name_servers.length > 0) ? 
            ul(
              domain_info.name_servers.map(function(server) {
                return li(server);
              })
            )
          : 'None')
        )
      );
    });
    render(spinner('Loading...'));
  });

  // define('manager_view', function(domain_info, records, app_dns) {
  //   var domain = domain_info.name;
  //   return div(
  //     h1({ 'class': 'header-with-right-btn' }, div({ 'class': 'long-domain-name' }, 'BADGER DNS FOR ' + domain)),
  //     change_name_servers_button(domain_info),
  // 
  //   );
  // });

  define('app_dns_rows', function(app_name, app_id, records, domain_obj) {
    return [
      tr({ 'class': 'table-header' },
        td({ colSpan: 5, 'class': 'app_dns_header' }, 
          (Account.has_permission('modify_dns', domain_obj.permissions_for_person)) ? [
            div({ style: 'float: right; margin-top: 10px' },
              a({ 'class': 'myButton small', href: curry(show_settings_modal_for_app, app_id, domain_obj.name) }, 'Settings')
            )
          ] : [],

          h2({ style: "border-bottom: 1px solid #888; padding-bottom: 5px; margin-bottom: 0" }, app_name)
        )
      ),
      records.map(function(record) {
        return record_row(record, domain_obj.name, false)
      })
    ];
  });

  define('auto_dns_record_rows', function(records, domain) {
    return [
      tr({ 'class': 'table-header' },
        td({ colSpan: 5, 'class': 'app_dns_header' }, h2({ style: "border-bottom: 1px solid #888; padding-bottom: 5px; margin-bottom: 0px" }, "Automatic Records"))
      ),
      records.map(function(record) {
        return record_row(record, domain, false)
      })
    ];
  });
  
  define('record_row', function(record, domain, editable) {
    // prevent editing SOA & Badger NS records
    if (record.record_type == "soa") editable = false;
    if (record.record_type == "ns" && record.content.match(/badger\.com$/)) editable = false;
    
    return tr({ id: 'dns-row-' + record.id },
      td(record.record_type.toUpperCase()),
      td(div({ 'class': 'long-domain-name', style: 'width: 300px;' }, record.subdomain.replace(domain,''), span({ style: 'color: #888' }, domain))),
      td(record.priority, ' ', Domains.truncate_domain_name(record.content)),
      td(parse_readable_ttl(record.ttl)),
      editable ? td({ style: "text-align: center; min-width: 40px;"},
        div({ 'class': 'edit-buttons' },
          //button({ events: { 'click': curry(dns_edit, domain, record.id) }}, 'Edit'),
          a({ 'class': 'hover-buttons icon-buttons', href: curry(edit_dns, domain, record) }, img({ src: 'images/edit.gif'})),
          a({ 'class': 'hover-buttons icon-buttons', href: curry(dns_delete, domain, record) }, img({ src: 'images/trash.gif'}))
      )) : td()
    );
  });

  define('show_correct_form_fields', function(id) {
    var type = '-add-';
    if (id != null)
      type = '-' + id + '-edit-';
    var record_type = $('#dns' + type + 'type').val();
    $('#dns' + type + 'content-ipv4')[['A'].indexOf(record_type) >= 0 ? 'show' : 'hide']();
    $('#dns' + type + 'content-ipv6')[['AAAA'].indexOf(record_type) >= 0  ? 'show' : 'hide']();
    $('#dns' + type + 'content-host')[['ALIAS','CNAME','MX'].indexOf(record_type) >= 0  ? 'show' : 'hide']();
    $('#dns' + type + 'content-priority')[['MX'].indexOf(record_type) >= 0  ? 'show' : 'hide']();
//    $('#dns' + type + 'content-text')[['SRV'].indexOf(record_type) >= 0  ? 'show' : 'hide']();
    $('#dns' + type + 'content-text')[['TXT'].indexOf(record_type) >= 0  ? 'show' : 'hide']();
    $('#dns' + type + 'content-ns')[['NS'].indexOf(record_type) >= 0  ? 'show' : 'hide']();
  });

define('get_dns_params', function(id) {
    var type = '-add-';
    if (id != null)
      type = '-' + id + '-edit-';

    $('#errors').empty();

    var dns_fields = {
      record_type: $('#dns' + type + 'type').val(),
      subdomain: $('#dns' + type + 'subdomain').val(),
      ttl: $('#dns' + type + 'ttl').val()
    };

    if (dns_fields.record_type == 'A') {
      dns_fields.content = $('#dns' + type + 'content-ipv4').val();
    } else if (dns_fields.record_type == 'AAAA') {
      dns_fields.content = $('#dns' + type + 'content-ipv6').val();
    } else if (dns_fields.record_type == 'ALIAS' || dns_fields.record_type == 'CNAME') {
      dns_fields.content = $('#dns' + type + 'content-host').val();
    } else if (dns_fields.record_type == 'MX') {
      dns_fields.content = $('#dns' + type + 'content-host').val();
      dns_fields.priority = $('#dns' + type + 'content-priority').val();
//    } else if (dns_fields.record_type == 'SRV') {
//      dns_fields.content = $('#dns' + type + 'content-host').val();
//      dns_fields.service = $('#dns' + type + 'content-service').val();
//      dns_fields.proto = $('#dns' + type + 'content-proto').val();
//      dns_fields.name = $('#dns' + type + 'content-name').val();
//      dns_fields.weight = $('#dns' + type + 'content-weight').val();
//      dns_fields.priority = $('#dns' + type + 'content-priority').val();
//      dns_fields.target = $('#dns' + type + 'content-target').val();
    } else if (dns_fields.record_type == 'TXT') {
      dns_fields.content = $('#dns' + type + 'content-text').val();
    } else if (dns_fields.record_type == 'NS') {
      dns_fields.content = $('#dns' + type + 'content-ns').val();
    }

    return dns_fields;
  });

  define('dns_add', function(domain) {
    $('#errors').empty();

    Badger.addRecord(domain, get_dns_params(), function(response) {
      if (response.meta.status == 'ok') {
        set_route(get_route());
      } else {
        $('#errors').empty().append(error_message(response));
      }
    })
  });

  define('dns_delete', function(domain, record) {
    if (confirm('Are you sure you want to delete this record?')) {
      Badger.deleteRecord(domain, record.id, function(results) {
        // console.log(results);
        set_route(get_route());
      })
    }
  });

  define('dns_update', function(domain, record) {
    $('#errors').empty();
    Badger.updateRecord(domain, record.id, get_dns_params(record.id), function(results) {
      if (results.meta.status == 'ok') {
        set_route(get_route());
      } else {
        $('#errors').empty().append(error_message(results));
      }
    })
  });

  define('edit_dns', function(domain, record) {
    $('#dns-row-' + record.id).after(edit_dns_row(domain, record));
    $('#dns-row-' + record.id).addClass('hidden');
    show_correct_form_fields(record.id);
  });

  define('reset_dns_row', function(id) {
    $('#dns-row-' + id).removeClass('hidden');
    $('#edit-dns-' + id).remove();
  });

  define('edit_dns_row', function(domain, record) {
    return tr({ id: 'edit-dns-' + record.id },
      td(
        select({ id: 'dns-' + record.id + '-edit-type', onchange: function() { show_correct_form_fields(record.id); } },
          option( record.record_type.toUpperCase() == 'A' ? { selected: 'selected' } : {}, 'A'),
          option( record.record_type.toUpperCase() == 'AAAA' ? { selected: 'selected' } : {}, 'AAAA'),
          option( record.record_type.toUpperCase() == 'ALIAS' ? { selected: 'selected' } : {}, 'ALIAS'),
          option( record.record_type.toUpperCase() == 'CNAME' ? { selected: 'selected' } : {}, 'CNAME'),
          option( record.record_type.toUpperCase() == 'MX' ? { selected: 'selected' } : {}, 'MX'),
          option( record.record_type.toUpperCase() == 'TXT' ? { selected: 'selected' } : {}, 'TXT'),
//          option( record.record_type.toUpperCase() == 'SRV' ? { selected: 'selected' } : {}, 'SRV'),
          option( record.record_type.toUpperCase() == 'NS' ? { selected: 'selected' } : {}, 'NS')
        )
      ),
      td(input({ style: 'width: 60px', id: 'dns-'+record.id+'-edit-subdomain', value: record.subdomain.replace('.'+domain,'') }), span({ style: 'color: #888' }, '.' + domain)),
      td(
        select({ id: 'dns-' + record.id + '-edit-content-priority' },
          option( record.priority == 10 ? { selected: 'selected' } : {}, '10'),
          option( record.priority == 20 ? { selected: 'selected' } : {}, '20'),
          option( record.priority == 30 ? { selected: 'selected' } : {}, '30'),
          option( record.priority == 40 ? { selected: 'selected' } : {}, '40'),
          option( record.priority == 50 ? { selected: 'selected' } : {}, '50')
        ),
        input({ id: 'dns-' + record.id + '-edit-content-ipv4', placeholder: 'XXX.XXX.XXX.XXX', value: record.content }),
        input({ id: 'dns-' + record.id + '-edit-content-ipv6', placeholder: 'XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX:XXXX', value: record.content }),
        input({ id: 'dns-' + record.id + '-edit-content-host', placeholder: 'example.com', value: record.content }),
        input({ id: 'dns-' + record.id + '-edit-content-text', placeholder: 'SPF, domain keys, etc.', value: record.content }),
        input({ id: 'dns-' + record.id + '-edit-content-ns', placeholder: 'ns1.example.com', value: record.content })
      ),
      td(
        select({ id: 'dns-' + record.id + '-edit-ttl' },
          option({ value: '1800' }, '30 mins'),
          option(record.ttl == 3600 ? { selected: 'selected', value: '3600' } : { value: '3600' }, '1 hour'),
          option(record.ttl == 21600 ? { selected: 'selected', value: '21600' } : { value: '21600' }, '6 hours'),
          option(record.ttl == 43200 ? { selected: 'selected', value: '43200' } : { value: '43200' }, '12 hours'),
          option(record.ttl == 86400 ? { selected: 'selected', value: '86400' } : { value: '86400' }, '1 day'),
          option(record.ttl == 259200 ? { selected: 'selected', value: '259200' } : { value: '259200' }, '3 days'),
          option(record.ttl == 604800 ? { selected: 'selected', value: '604800' } : { value: '604800' }, '1 week')
        )
      ),
      td({ style: 'text-align: center; min-width: 40px' },
        a({ 'class': 'icon-buttons', href: curry(dns_update, domain, record) }, img({ src: 'images/save.png'})),
        a({ 'class': 'icon-buttons', href: curry(reset_dns_row, record.id) }, img({ src: 'images/cancel.png'}))
      )
    );
  });

  define('parse_readable_ttl', function(ttl) {
    var array = []
    array.push(["week", parseInt(ttl / 604800)]);
    array.push(["day", parseInt((ttl % 604800) / 86400)]);
    array.push(["hour", parseInt((ttl % 86400) / 3600)]);
    array.push(["min", parseInt((ttl % 3600) / 60)]);
    array.push(["second", ttl % 60]);

    array = array.map(function(item) {
      return item[1] > 0 ? (item[1] > 1 ? (item[1] + ' ' + item[0] + 's') : "1 " + item[0]) : ''
    });
    return $.grep(array, function(item) { return item != '' }).join(' ');
  });

  define('sort_dns_records', function(records) {
    var results = [];
    var count = 0;
    var tempts = records.map(function(record) {
      return [record.record_type + (record.priority || '').toString() + record.subdomain + record.content, count++];
    });

    tempts.sort(function(x,y){
      var a = x.toString().toUpperCase();
      var b = y.toString().toUpperCase();
      if (a > b)
         return 1
      if (a < b)
         return -1
      return 0;
    });

    results = tempts.map(function(item) {
      return records[item[1]];
    })

    return results;
  });

  define('sort_auto_dns_records', function(records) {
    return records.sort(function(a,b){
      if (a.record_type == "soa")
        return -1;
      else if (b.record_type == "soa")
        return 1;
      else
        return (a.content > b.content) ? 1 : -1;
      return 0;
    });
  });









  define('change_name_servers_modal', function(domain_info) {
    show_modal(
      div(
        h1(domain_info.name, ' Nameservers'),
        div({ id: 'errors_modal' }),
      
        div({ style: 'width: 275px; padding-right: 20px; float: left; margin-right: -1px; border-right: 1px solid #ccc' },
          h2(span({ style: 'cursor: pointer; font-size: 20px', onclick: function() { $('#remote-dns-details').hide(); $('#badger-dns-details').show(); $('#radio-nameservers-badger').click(); } }, radio({ id: 'radio-nameservers-badger', style: 'margin: 0 8px 2px 0', name: 'nameservers' }), 'Badger DNS'), span({ style: 'padding-left: 10px; font-weight: normal; font-size: 11px'}, '(Recommended)')),
          div({ id: 'badger-dns-details' },
            ul(
              li("Proven reliability"),
              // li("Servers around the world."),
              li("Manage from within Badger")
            ),
            
            div({ id: 'badger-dns-installed-div', style: 'margin-top: 30px; font-size: 20px; font-weight: bold; text-align: center; font-style: italic; display: none'}, 
              img({ src: "images/check.png" }),
              'Already Installed!'
            ),
            div({ id: 'badger-dns-install-button-div', style: 'margin-top: 10px; text-align: center; display: none' }, button({ 'class': 'myButton', onclick: curry(save_name_servers, domain_info, 'ns1.badger.com,ns2.badger.com') }, 'Install'))
          )
        ),

        div({ style: 'width: 275px; padding-left: 20px; float: left; border-left: 1px solid #ccc' },
          h2(span({ style: 'cursor: pointer; font-size: 20px', onclick: function() { $('#remote-dns-details').show(); $('#badger-dns-details').hide(); $('#radio-nameservers-remote').click(); } }, radio({ id: 'radio-nameservers-remote', style: 'margin: 0 8px 2px 0', name: 'nameservers' }), 'External'), span({ style: 'padding-left: 10px; font-weight: normal; font-size: 11px'}, '(The hard way)')),
          div({ id: 'remote-dns-details', style: "padding-left: 20px" },
            form({ action: function() { save_name_servers(domain_info, $('#name_server_select').val()); } },
              div({ style: 'font-weight: bold' }, 'DNS Provider:'), 
              select({ 
                  id: 'name_server_select', 
                  onChange: update_name_server_ul_from_select
                },
                dns_provider_options(domain_info.name_servers.join(','))
              ),
              
              div({ style: 'font-weight: bold; margin-top: 10px' }, 'Name Servers:'),
              ul({ id: 'name_server_ul', style: 'margin-left: 0px; padding-left: 0; margin-top: 0' }),

              div({ style: 'margin-top: 10px' }, input({ 'class': 'myButton', type: 'submit', value: 'Save' }))
            )
          )
        ),

        div({ style: 'clear: left' }),
        
        p({ style: "font-style: italic; padding-top: 20px; margin-bottom: 0" }, 'WARNING: Changing these settings could take up to 48 hours to be updated by everybody.')
        
      )
    );

    if (domain_info.name_servers.join(',') == 'ns1.badger.com,ns2.badger.com') {
      $('#badger-dns-installed-div').show();
      $('#radio-nameservers-badger').click();
    } else {
      $('#badger-dns-install-button-div').show();
      $('#badger-dns-options-div').show();
      $('#radio-nameservers-remote').click();
    }

    update_name_server_ul_from_select();
  });

  define('save_name_servers', function(domain_info, new_name_servers) {
    start_modal_spin(domain_info.linkable_registrar ? 'This usually takes about 2 minutes to complete at ' + domain_info.current_registrar : 'Updating name servers...');
    
    var import_dns = !!$("input[name=import-dns]").attr('checked');
    
    $('#errors_modal').empty();
    Badger.updateDomain(domain_info.name, { name_servers: new_name_servers, import_dns: import_dns }, function(response) {
      if (response.meta.status == 'ok') {
        BadgerCache.flush('domains');

        hide_modal();
        $('#domain-menu-item-' + domain_info.name.replace('.','-')).remove();
        set_route('#domains/' + domain_info.name);
      } else {
        stop_modal_spin();
        $('#errors_modal').empty().append(error_message(response));
      }
    });
  });

  define('update_name_server_ul_from_select', function() {
    $('#name_server_ul').empty()
    var tmp_select = $('#name_server_select');
    if (tmp_select[0].selectedIndex == 0) {
      var tmp_custom_option = tmp_select[0].childNodes[0];
      $('#name_server_ul').append(
        li({ style: 'list-style: none' }, 
          textarea({ 
            style: 'width: 200px; height: 80px',
            onChange: function() {
              tmp_custom_option.value = $(this).val().replace("\r",'').split("\n").join(',').replace(/,+/,',').replace(/^,/,'').replace(/,$/,'');
            }},
            tmp_select.val().split(',').join("\n")
          )
        )
      );
    } else {
      $('#name_server_select').val().split(',').map(function(server) {
        if (server && server.length > 0) $('#name_server_ul').append(li({ style: "margin-left: 20px" }, server));
      });
    }
  });

  define('dns_provider_options', function(current) {
    var custom_option = option({ value: '' }, 'Custom');
    var options = [
      custom_option,
      option({ disabled: 'disabled' }),
    
      optgroup({ label: 'Hosting' },
        option({ value: 'ns1.dnsmadeeasy.com,ns2.dnsmadeeasy.com' }, 'DNSMadeEasy'),
        option({ value: 'ns1.dreamhost.com,ns2.dreamhost.com,ns3.dreamhost.com' }, 'DreamHost'),
        option({ value: 'ns1.mydyndns.org,ns2.mydyndns.org' }, 'DynDNS'),
        option({ value: 'ns1.no-ip.com,ns2.no-ip.com,ns3.no-ip.com,ns4.no-ip.com,ns5.no-ip.com' }, 'NO-IP'),
        option({ value: 'dns-us1.powerdns.net,dns-us2.powerdns.net,dns-eu1.powerdns.net,dns-eu2.powerdns.net' }, 'PowerDNS'),
        option({ value: 'ns.rackspace.com,ns2.rackspace.com' }, 'Rackspace'),
        option({ value: 'ns1.slicehost.com,ns2.slicehost.com,ns3.slicehost.com' }, 'SliceHost'),
        option({ value: 'ns1.softlayer.com,ns2.softlayer.com' }, 'SoftLayer'),
        option({ value: 'a.ns.zerigo.net,b.ns.zerigo.net,c.ns.zerigo.net,d.ns.zerigo.net,e.ns.zerigo.net,f.ns.zerigo.net' }, 'Zerigo')
      ),
      
      optgroup({ label: 'Parking' },
        option({ value: 'ns1.1plus.net,ns2.1plus.net' }, '1plus.net'),
        option({ value: 'ns1.bodis.com,ns2.bodis.com' }, 'Bodis'),
        option({ value: 'ns1.dsredirection.com,ns2.dsredirection.com' }, 'DomainSponsor'),
        option({ value: 'ns1.fabulous.com,ns2.fabulous.com' }, 'Fabulous'),
        option({ value: 'ns1.fastpark.net,ns2.fastpark.net' }, 'FastPark.net'),
        option({ value: 'ns1.googleghs.com,ns2.googleghs.com,ns3.googleghs.com,ns4.googleghs.com' }, 'Google AdSense'),
        option({ value: 'ns1.hitfarm.com,ns2.hitfarm.com' }, 'Hit Farm'),
        option({ value: 'ns1.parked.com,ns2.parked.com' }, 'Parked'),
        option({ value: 'ns1.parkingpanel.com,ns2.parkingpanel.com' }, 'Parking Panel'),
        option({ value: 'ns1.parkingspa.com,ns2.parkingspa.com' }, 'ParkingSpa'),
        option({ value: 'ns1.sedoparking.com,ns2.sedoparking.com' }, 'Sedo'),
        option({ value: 'ns1.smartname.com,ns2.smartname.com' }, 'SmartName'),
        option({ value: 'ns1.trafficz.com,ns2.trafficz.com' }, 'TrafficZ'),
        option({ value: 'ns1.whypark.com,ns2.whypark.com' }, 'WhyPark')
      )
    ];

    if (current == 'ns1.badger.com,ns2.badger.com') current = '';

    if (current) {
      for (var i=0; i < options.length; i++) {
        if (options[i].nodeName == 'OPTGROUP') {
          for (var j=0; j < options[i].childNodes.length; j++) {
            if (options[i].childNodes[j].value && (options[i].childNodes[j].value == current)) {
              options[i].childNodes[j].selected = 'selected';
              return options;
            }
          }
        }
      }
      
      // if we made it this far, set the value of the first option to whatever was passed in
      custom_option.value = current;
    }
         
    return options;
  });

  define('change_name_servers_button', function(domain_info) {
    return a({ 'class': 'myButton small', href: curry(change_name_servers_modal, domain_info) }, 'Nameservers');
  })



}
