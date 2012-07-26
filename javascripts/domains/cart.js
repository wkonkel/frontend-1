with (Hasher('Cart','Application')) {
  before_filter('add_query_string_domains_to_cart', function() {
    var domain_names = (Hasher.request_data.params.domains||"").split(',');
    for (var i=0; i<domain_names.length; i++) add_domain(domain_names[i]);
  });

  define('add_domain', function(domain_name) {
    if (!BadgerCart.find_domain({ name: domain_name })) {
      BadgerCart.push_domain(domain_name);
      update_shopping_cart_size();
    }
  });

  define('add_many_domains_to_cart', function(domains) {
    if (domains.length <= 0) return;

    var before_cart_size = BadgerCart.get_domains().length;
    for (var i=0; i<domains.length; i++) {
      if (!BadgerCart.find_domain({ name: domains[i].name })) {
        add_domain(domains[i]);
        update_shopping_cart_size();
      }
    }
  });

  route('#cart', function() {
    render(
      h1('Shopping Cart'),

      div({ 'class': 'sidebar' },
        info_message(
          h3("Waiting for the expiration?"),
          p("No need. Transferring your domain to Badger extends the current registration by one year.")
        )
      ),

      form_with_loader({ 'class': 'has-sidebar', action: confirm_transfers, loading_message: 'Processing...' },
        div({ id: 'errors' }),

        table({ 'class': 'fancy-table', id: 'transfer-domains-table' },
          tbody(
            tr({ 'class': 'table-header' },
              th('Name'),
              th('Registrar'),
              th('Expires'),
              th()
            ),

            // generate rows for domains
            BadgerCart.get_domains().map(function(d) { return generate_row_for_domain(d.name) }),

            tr({ id: 'add-domain-to-table-row' },
              td(
                textarea({
                  name: 'domains',
                  id: 'add_domain_to_table_text',
                  placeholder: 'e.g. badger.com',
                  onKeydown: function(e) { if ((e.charCode || e.keyCode) == 13) { stop_event(e); process_new_domains(); } },
                  onPaste: function(e) { setTimeout(process_new_domains,0); },
                  style: 'width: 150px; height: 20px; line-height: 20px; border: 1px solid #bbb; padding: 3px; margin: 3px 5px 3px 0; resize: none;'
                }),
                submit({
                  style: 'background: url(images/add.gif); width: 16px; height:16px; border: 0; border: 0; margin: 0; padding: 0; text-indent: -1000px',
                  onClick: function(e) {
                    stop_event(e);
                    process_new_domains();
                  }
                })
              ),
              td({ colSpan: '3' })
            )
          )
        ),

        div({ style: "margin-top: 20px; text-align: right "},
          input({ type: 'hidden', name: 'hidden_tag_anchor', id: 'hidden_tag_anchor', value: '' }),
          submit({ id: 'continue-transfer-btn', 'class': 'myButton', style: 'display: none', name: 'cancel', value: "Proceed to Checkout" })
        )
      )
    );

    // update all of the table rows for domains in the cart
    update_rows_for_shopping_cart_domains();
  });

  define('process_new_domains', function() {
    var raw_domains = document.getElementById('add_domain_to_table_text').value;

    var domains = [];
    (typeof(raw_domains) == "string" ? raw_domains.split('\n') : raw_domains).map(function(domain) {
      if (domain.trim() != '') domains.push(domain.trim().toLowerCase());
    });
    $.unique(domains).sort();
    if (domains.length == 0) {
      $('#transfer-form-error').html('Invalid Domains Input');
      $('#transfer-form-error').removeClass('hidden');
      return;
    }
    domains.map(function(domain) {
      add_domain_to_table({ name: domain });
      add_domain(domain);
    });
    $('#add_domain_to_table_text').val('');

    update_rows_for_shopping_cart_domains();
  });

  route('#cart/confirm', function() {
    var domains = BadgerCart.get_domains();

    render(
      chained_header_with_links(
        { text: 'Shopping Cart', href: '#cart' },
        { text: 'Confirm Purchase of ' + domains.length + ' ' + (domains.length == 1 ? 'Domain' : 'Domains') }
      ),

      form_with_loader({ 'class': 'fancy has-sidebar', action: register_or_transfer_all_domains, loading_message: 'Processing...' },
        div({ id: 'errors' }),

        fieldset({ style: 'line-height: 25px' },
          label('Domains:'),
          div(
            ul({ style: 'border: 1px solid #ccc; float: left; margin-top: 0px; padding: 5px 20px 5px 30px; max-height: 60px; overflow: auto; line-height: 18px' },
              domains.map(function(domain_obj){
                return li(domain_obj.name);
              })
            )
          )
        ),

        Contact.selector_with_all_form_fields({ name: 'registrant_contact_id' }),

        fieldset({ style: 'line-height: 25px' },
          label('Free options:'),
          div(
            checkbox({ name: 'privacy', value: true, checked: 'checked' }), 'Enable whois privacy'
          ),
          div(
            checkbox({ name: 'auto_renew', value: true, checked: 'checked' }), 'Auto-renew on expiration date'
          )
        ),

        fieldset({ 'class': 'no-label' },
          submit({ name: 'submit', value: 'Purchase ' + domains.length + ' domain' + (domains.length != 1 ? 's' : '') + ' for $' + (domains.length * 10) })
        )
      )
    );
  });

  route('#cart/processing', function() {
    var cart_domains = BadgerCart.get_domains(),
      new_domains = BadgerCart.get_new_domains(),
      transfer_domains = BadgerCart.get_transfer_domains();

    render(
      chained_header_with_links(
        { text: 'Shopping Cart', href: '#cart' },
        { text: 'Processing ' + cart_domains.length + ' ' + (cart_domains.length == 1 ? 'Domain' : 'Domains') }
      ),

      div({ 'class': 'sidebar' },
        info_message(
          h3('Processing Transfers'),
          p('It will only take a few moments to initiate the domain transfer' + (cart_domains.length != 1 ? 's' : '') + '.')
        )
      ),

      div({ 'class': 'fancy has-sidebar'},
        table({ 'class': 'fancy-table', id: 'transfer-domains-table' },
          tbody(
            tr({ 'class': 'table-header' },
              th('Name'),
              th('Status')
            ),
            cart_domains.map(function(domain_obj) {
              return tr({ id: row_id_for_domain(domain_obj.name), 'class': 'domain-row' },
                td(domain_obj.name),
                td({ 'class': 'status-cell' }, img({ 'class': 'ajax_loader', style: "padding-left: 20px", src: 'images/ajax-loader.gif'}))
              );
            })
          )
        ),
        a({ id: 'close-cart-button', href: curry(set_route, '#domains'), 'class': 'myButton', style: 'display: none; float: right; margin: 15px auto;' }, 'View My Domains')
      )
    );

//    define('possibly_show_close_button_on_register_screen', function(domain_count) {
//      var domain_name = (domain_count == 1) ? $("#transfer-domains-table tr[id$=-domain] td")[0].innerHTML : null;
//
//      if ($('#transfer-domains-table .success-row, #transfer-domains-table .error-row').length == domain_count) {
//        $('#transfer-domains-table').after(
//          div({ style: 'margin-top: 10px; text-align: right' },
//            a({ href: curry(close_transfer, domain_name), 'class': 'myButton' }, 'View My Domains')
//          )
//        );
//      }
//    });


    // wait for all of the transfers and registrations to finish
    var num_domains_processed = 0;
    var show_continue_button_if_finished = function() {
      if (++num_domains_processed >= cart_domains.length) {
        $('a#close-cart-button').show();
        BadgerCache.flush('domains');
        BadgerCache.getDomains(function() { update_my_domains_count(); });
      }
      update_shopping_cart_size();
      update_credits(true);
    };

    transfer_domains.map(function(cart_domain_obj) {
      var domain_transfer_params = cart_domain_obj.purchase_options;
      domain_transfer_params .name = cart_domain_obj.name;

      Badger.transferDomain(domain_transfer_params, function(response) {
        if (response.meta.status != 'created') {
          set_background_color_if_valid(cart_domain_obj.name, false);
          $('#' + row_id_for_domain(cart_domain_obj.name) + ' .status-cell').html(response.data.message);
        } else {
          set_background_color_if_valid(cart_domain_obj.name, true);
          $('#' + row_id_for_domain(cart_domain_obj.name) + ' .status-cell').html('Success!');
          cart_domain_obj.remove_from_cart();
        }
        show_continue_button_if_finished();
      });
    });

    new_domains.map(function(cart_domain_obj) {
      var domain_register_params = cart_domain_obj.purchase_options;
      domain_register_params.name = cart_domain_obj.name;

      Badger.registerDomain(domain_register_params, function(response) {
        if (response.meta.status != 'created') {
          set_background_color_if_valid(cart_domain_obj.name, false);
          $('#' + row_id_for_domain(cart_domain_obj.name) + ' .status-cell').html(response.data.message);
        } else {
          set_background_color_if_valid(cart_domain_obj.name, true);
          $('#' + row_id_for_domain(cart_domain_obj.name) + ' .status-cell').html('Success!');
          cart_domain_obj.remove_from_cart();
        }
        show_continue_button_if_finished();
      });
    });
  });

  define('generate_row_for_domain', function(domain) {
    return tr({ id: row_id_for_domain(domain), 'class': 'domain-row' },
      td(Domains.truncate_domain_name(domain)),
      td({ 'class': 'registrar_domain' }, img({ 'class': 'ajax_loader', style: "padding-left: 20px", src: 'images/ajax-loader.gif'})),
      td({ 'class': 'expires_domain' }),
      td({ style: 'width: 16px' }, img({ 'class': 'domain_row_trash_icon', src: 'images/trash.gif', onClick: curry(remove_domain_from_table, domain) }))
    );
  });

  // when you want to transfer a domain from somewhere else on the site,
  // invoke this method to make it happen
  define('redirect_to_transfer_for_domain', function(domains) {
    // prepopulate the domains array with this one
    Badger.Session.write({ domains: typeof(domains) == 'string' ? [domains] : domains.unique() });

    set_route('#cart');
  });

  define('row_id_for_domain', function(domain) {
    return domain.replace(/\./g,'-') + '-domain';
  });

  // valid: true - green, false - red, null - white
  define('set_background_color_if_valid', function(domain, valid) {
    var item_id = '#' + row_id_for_domain(domain);
    $(item_id).removeClass("error-row").removeClass("success-row");
    if (valid == true) $(item_id).addClass("success-row");
    if (valid == false) $(item_id).addClass("error-row");
  });

  define('show_error_for_domain', function(domain, message) {
    set_background_color_if_valid(domain, false);
    $('#' + row_id_for_domain(domain) + ' .expires_domain').remove();
    $('#' + row_id_for_domain(domain) + ' .registrar_domain').attr('colSpan', '2').html(span({ 'class': 'error' }, message));
  });


  define('add_domain_to_table', function(form_data) {
    if ($('#' +row_id_for_domain(form_data.name)).length == 0) {
      $('#add-domain-to-table-row').before(generate_row_for_domain(form_data.name));
    }
  });

  define('remove_domain_from_table', function(domain) {
    $('#' + row_id_for_domain(domain)).remove();
    remove_hidden_field_for_domain(domain);
    // remove_domain_from_cart(domain);

    // remove the domain from the cart
    var domain_obj = BadgerCart.find_domain({ name: domain });
    if (domain_obj) {
      domain_obj.remove_from_cart();
      update_shopping_cart_size();
    }
  });

  define('update_shopping_cart_size', function() {
    var cart_size = BadgerCart.get_domains().length,
      cart_size_span = $('#shopping-cart-size');
    cart_size_span.html(BadgerCart.get_domains().length);
    cart_size > 0 ? cart_size_span.show() : cart_size_span.hide();
  });

  define('update_rows_for_shopping_cart_domains', function(callback) {
    var cart_domains = BadgerCart.get_domains(),
      num_domains_updated = 0;

    $('#continue-transfer-btn').hide();

    cart_domains.forEach(function(cart_domain) {
      update_row_for_domain_in_cart(cart_domain, function(updated_domain_obj) {
        if (updated_domain_obj.available || (updated_domain_obj.current_registrar && !updated_domain_obj.current_registrar.match(/^unknown$/i))) {
          // update the domain object in the cart with the updated attributes
          for (k in updated_domain_obj) cart_domain[k] = updated_domain_obj[k];

          if (++num_domains_updated == cart_domains.length) {
            $('#continue-transfer-btn').show();
            (callback || function(){}).call(cart_domains);
          }
        }
      });
    });
  });

  define('update_row_for_domain_in_cart', function(domain_obj, callback) {
    if (domain_obj.current_registrar && !domain_obj.current_registrar.match(/^unknown$/i)) {
      var item_id = '#' + row_id_for_domain(domain_obj.name);
      if ($(item_id + ' .registrar_domain').length > 0) {
        set_background_color_if_valid(domain_obj.name, true);
        add_hidden_field_for_domain(domain_obj.name, true);
        $(item_id + ' .registrar_domain').html(domain_obj.current_registrar);
        $(item_id + ' .expires_domain').html(domain_obj.expires_at.slice(0,10));
      }
    } else if (domain_obj.available) {
      var item_id = '#' + row_id_for_domain(domain_obj.name);
      if ($(item_id + ' .registrar_domain').length > 0) {
        set_background_color_if_valid(domain_obj.name, true);
        add_hidden_field_for_domain(domain_obj.name, false);
        $(item_id + ' .registrar_domain').html('<i>Register at Badger</i>');
        $(item_id + ' .expires_domain').html('<i>Available!</i>');
      }
    } else {
      Badger.getDomain(domain_obj.name, function(response) {
        var server_domain_obj = response.data;

        if (response.meta.status == 'not_found') {
          show_error_for_domain(domain_obj.name, 'Invalid domain format');
        } else if (response.meta.status != 'ok') {
          show_error_for_domain(domain_obj.name, response.data.message || 'Error: Internal server error');
        } else if (!server_domain_obj.supported_tld) {
          show_error_for_domain(server_domain_obj.name, "Extension ." + server_domain_obj.name.split('.').pop() + " is not currently supported.");
        } else if (server_domain_obj.current_registrar && server_domain_obj.current_registrar.match(/^unknown$/)) {
          // not done loading, try again in a few seconds if the dialog is still open
          if ($('#transfer-domains-table')) setTimeout(curry(update_row_for_domain_in_cart, server_domain_obj, callback), 1500);
        } else {
          return update_row_for_domain_in_cart(server_domain_obj, callback);
        }
      });
    }
    callback(domain_obj);
  });

  define('add_hidden_field_for_domain', function(domain, is_a_transfer) {
    $('#hidden_tag_anchor').after(input({ type: "hidden", name: is_a_transfer ? "transfer_domains[]" : "new_domains[]", value: domain, id: row_id_for_domain(domain + '-hidden') }));
  });

  define('remove_hidden_field_for_domain', function(domain) {
    $('#' + row_id_for_domain(domain + '-hidden')).remove();
  });

  define('confirm_transfers', function(form_data) {
    set_route('#cart/confirm');
  });

  define('register_or_transfer_all_domains', function(form_data) {
    var cart_domains = BadgerCart.get_domains();

    // add a purchase_options hash to each cart domain. for now, each hash has the same info, but it will be
    // domain specific in the near future
    cart_domains.forEach(function(cart_domain) {
      cart_domain.purchase_options.registrant_contact_id = parseInt(form_data.registrant_contact_id) || -1;
      cart_domain.purchase_options.auto_renew = form_data.auto_renew == 'true' ? true : false;
      cart_domain.purchase_options.privacy = form_data.privacy == 'true' ? true : false;
      cart_domain.purchase_options.privacy = form_data.privacy == 'true' ? true : false;
      // cart_domain.purchase_options.import_dns = form_data.import_dns == 'true' ? true : false;
    });

    // computer the number of credits required. it's the sum of years of registration for each domain in cart.
    var num_credits_needed = 0;
    for (var i=0; i<cart_domains.length; i++) num_credits_needed += parseInt(cart_domains[i].purchase_options.years);

    Contact.create_contact_if_necessary_form_data({
      field_name: 'registrant_contact_id',
      form_data: form_data,
      message_area: $('#errors').first(),
      callback: (function() {
        BadgerCache.getAccountInfo(function(account_info) {
          if (account_info.data.domain_credits < num_credits_needed) {
            Badger.Session.write({
              necessary_credits: num_credits_needed - account_info.data.domain_credits,
              redirect_url: '#cart/processing'
            });

            set_route('#account/billing/credits');
          } else {
            set_route('#cart/processing');
          }
        });
      })
    });
  });
};
