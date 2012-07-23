with (Hasher('Application')) {

  // empty this before every page load
  before_filter(function() {
    $('#before-content').html('');
    $('#after-content').html('');
  })

  // define('update_sidebar', function() {
  //   if ($('#sidebar')) {
  //     var request_uri = get_route();
  //     check_if_domain_should_be_added_to_sidebar(request_uri);
  //     if (Badger.getAccessToken()) {
  //       update_my_domains_count();
  //       //update_invites_available_count();
  //     }
  //     update_sidebar_with_correct_actives(request_uri);
  //     OutlineFix.fix_ie_7();
  //   }
  // 
  //   // Fix placeholder does not work in IE
  //   Placeholder.fix_ie();
  // })
  // 
  // after_filter('update_sidebar', update_sidebar);


  // define('update_sidebar_with_correct_actives', function(request_uri) {
  //   if (!request_uri) request_uri = get_route();
  //   if (request_uri.indexOf("filter_domains") != -1) request_uri = request_uri.replace('grid', 'list');
  //   if (request_uri.indexOf("#blogs/") == 0) request_uri = '#blogs';
  //   if (request_uri.indexOf("#tickets/") == 0) request_uri = '#tickets';
  //   if (request_uri.indexOf("#knowledge_center/") != -1) request_uri = '#knowledge_center';
  // 
  //   // select active link and expand parent
  //   $('#sidebar ul').removeClass('expanded');
  //   $('#sidebar a').removeClass('active');
  //   $('#sidebar li').removeClass('active');
  //   if (request_uri == '#search') {
  //     $('#form-search').addClass('active');
  //   } else {
  //     $('#form-search').removeClass('active');
  //     var links = $('#sidebar a[href="' + request_uri + '"]').addClass('active');
  //     var parent_li = links.parent();
  //     parent_li.addClass("active");
  //     if (!parent_li.parent().is('#menu')) parent_li = parent_li.parent().parent();
  //     parent_li.find('ul').addClass('expanded');
  //   }
  // });

  define('update_my_domains_count', function(refresh) {
    if (!Badger.getAccessToken()) return;
    if (refresh) BadgerCache.flush('domains');
    
    BadgerCache.getDomains(function(response) {
      var count = (response.data||[]).length;
      if (count > 0) {
        $('#my-domains-count').html(" (" + count + ")");
        $('#all-my-domains-h1').html(" (" + count + ")");
        $('#user-nav-domains').html(count + " Domain" + (count != 1 ? 's' : ''));
      } else {
        $('#user-nav-domains').html("Domains");
      }
    });
  });
  
  after_filter('update_my_domains_count', update_my_domains_count);

  define('check_if_domain_should_be_added_to_sidebar', function(request_uri) {
    if (!request_uri) request_uri = get_route();
    var domain = (request_uri.match(/#domains\/([^\/]+)/) || [])[1];
    if (domain) {
      if ($('#menu #domain-menu-item-' + domain.replace('.','-')).length == 0) {
        $('#menu .domain-menu-item').slice(4).remove();
        $('#nav-help-and-support').after(domain_menu_item(domain));
      }
      if (request_uri.indexOf("filter_domains/all") != -1) request_uri = '#';
      else if (request_uri.indexOf("filter_domains") != -1) request_uri = request_uri.replace('grid', 'list');
    }
  });

  layout('default_layout', function(yield) {
    // var ie_browser = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
    return [
      header(),

      div({ id: 'wrapper' },
        div({ id: 'main' },
          div({ id: 'before-content' }),
          div({ 'class': 'content' }, 
            yield
          ),
          div({ id: 'after-content' })
        )
      ),
      
      footer(),
      
      chatbar()
    ];
  });


  define('chatbar', function() {
    return div({ 'class': 'closed', id: 'chatbar' },
      a({ href: Chat.hide_chat, 'class': 'close-button' }, 'X'),
      a({ href: Chat.minimize_chat, 'class': 'close-button min-button' }, '–'),
      h2({ onclick: Chat.show_chat }, 'Badger Chatroom'),
      div({ "class": "content" })
    );
  });

  define('header', function() {
    return div({ id: 'header', 'class': (Badger.getAccessToken() && 'loggedin') },
      div({ 'class': 'inner' },
        h2({ id: 'logo' }, a({ href: '#welcome'}, 'Badger')),
        //h2({ id: 'logo' }, img({ src: 'images/badger-4.png', style: 'height: 40px'}), span({ style: "color: #fff; font-size: 13px" }, '3 Domains')),

        //a({ href: '#search', 'class': 'myButton', style: 'margin: 8px 0 0 20px; padding: 4px 14px; font-size: 16px' }, 'Search for a new domain'),
        Search.search_box(),
        
        Badger.getAccessToken() ? left_topnav() : unauthed_left_topnav(),
        right_topnav(),
      
        Badger.getAccessToken() ? user_nav() : unauthed_user_nav()
      )
    );
  });
  
  define('footer', function() {
    return div({ id: 'footer' },
      div({ 'class': 'outer' },
        div({ 'class': 'inner' },
          div({ 'class': "col" },
            h2('Company'),
            ul(
              li(
                a({ href: "#about", target: '_blank' }, 'About'),
                ' / ',
                a({ href: "http://blog.badger.com", target: "_blank" }, 'Blog')
              ),
              li(a({ href: "#terms_of_service" }, 'Terms of Service')),
              li(a({ href: "http://www.icann.org/en/registrars/registrant-rights-responsibilities-en.htm", target: "_blank" }, 'ICANN Registrant Rights')),
              li(a({ href: "#whois", target: '_blank' }, 'Whois Lookup'))
            )
          ),
          div({ 'class': "col" },
            h2('Help and Support'),
            ul(
              li(a({ href: "#contact_us" }, 'Contact Us')),
              // li(a({ href: "#faqs" }, 'Frequently Asked Questions')),
              // li(a({ href: "#knowledge_center" }, 'Knowledge Center')),
              li(a({ href: "http://community.badger.com/badger/products/badger_faqs", target: "_blank" }, 'Frequently Asked Questions')),
              li(a({ href: "http://community.badger.com/badger/products/badger_knowledge_center", target: "_blank" }, 'Knowledge Center')),
              li(a({ href: 'https://github.com/badger/frontend', target: '_blank' }, 'Developers'))
            )
          ),
          div({ 'class': "col" },
            h2('Connect With Us'),
            ul(
              li(a({ href: "mailto:support@badger.com", target: '_blank' }, 'support@badger.com')),
              li(a({ href: 'tel:+1-415-787-5050' }, '+1-415-787-5050' )),
              li(
                a({ href: "https://twitter.com/badger", target: "_blank" }, 'Twitter'),
                ' / ',
                a({ href: "https://www.facebook.com/BadgerDotCom", target: "_blank" }, 'Facebook'),
                ' / ',
                a({ href: "irc://irc.freenode.net/badger" }, 'IRC')
              ),
              li(a({ href: "https://www.google.com/search?tbm=isch&q=" + (Math.random() > 0.5 ? "baby+badgers" : "badger+cubs"), target: "_blank" }, 'More Badgers'))
            )
          ),
          div({ 'class': "col" },
            h2('Accreditations'),
            img({ src: 'images/icann.png' })
          ),

          div({ style: 'clear: both'})
        )
      )
    )
  });
  
  define('left_topnav', function() {
    return div({ 'id': 'left-topnav'},
      a({ 'class': 'navlink', href: '#domains', id: 'user-nav-domains' }, 'Domains'),
      a({ 'class': 'navlink last', href: Chat.show_chat }, 'Chatroom')
      //a({ 'class': 'navlink last', href: '#rewards'}, '20 Reward Points')
    );
  });
  
  define('unauthed_left_topnav', function() {
    return div({ 'id': 'left-topnav'},
      a({ 'class': 'navlink', href: 'https://demo.badger.com/', target: '_blank' }, 'Try Demo'),
      a({ 'class': 'navlink last', href: Chat.show_chat }, 'Chatroom')
    );
  });

  define('right_topnav', function() {
    return div({ 'id': 'right-topnav' },
      a({ 'class': 'navlink', href: '#account/billing', id: 'user_nav_credits', style: 'display: none' }, 'Credits'),
      a({ id: 'shopping-cart-nav-button', 'class': 'navlink last', href: '#cart'}, 'Shopping Cart', span({ id: 'shopping-cart-size', 'class': 'another-alert', style: 'display: ' + (BadgerCart.get_domains().length > 0 ? '' : 'none') }, BadgerCart.get_domains().length))
      //a({ 'class': 'navlink last', href: '#domains'}, 'Balance', span({ 'class': 'another-alert' }, '$5.00'))
    );
  });
  
  define('unauthed_user_nav', function() {
    return div({ id: 'user-nav', 'class': 'unauthed' },
      a({ 'class': 'navlink', href: '#account/login' }, 'Login'),
      a({ 'class': 'navlink last' , href: '#account/create' }, 'Create Account')
    );
  });

  define('user_nav_flyout_mouseout', function() {
    if (this.usernav_timeout) clearTimeout(this.usernav_timeout);
    this.usernav_timeout = setTimeout(function() {
      $('#user-nav').removeClass('flyout');
    }, 500);
  });
  
  define('user_nav_flyout_mouseover', function() {
    $('#user-nav').addClass('flyout');
    if (this.usernav_timeout) {
      clearTimeout(this.usernav_timeout);
      delete this.usernav_timeout;
    }
  });
  
  define('user_nav', function() {
    var user_nav = div({ id: 'user-nav', onMouseOver: user_nav_flyout_mouseover, onMouseOut: user_nav_flyout_mouseout },
      a({ href: function() {} }, 'Loading...', span({ 'class': 'downarrow' }, '▼'))
    );
    
    with_user_nav_content(function(content) {
      render({ into: 'user-nav' }, content);
    });

    return user_nav;
  });

  // pulled this out so that it can be rendered in later as an update
  define('with_user_nav_content', function(callback) {
    BadgerCache.getAccountInfo(function(response) {
      callback([
        a({ href: '#account', id: 'user_nav_a' }, span({ id: 'use_nav_name' }, response.data.name), span({ 'class': 'downarrow' }, '▼')),
        div({ id: 'user_nav_flyout' },
          a({ href: '#linked_accounts' }, 'Linked Accounts'),
          a({ href: '#account/billing' }, 'Billing'),
          a({ href: '#rewards' }, 'Rewards'),
          a({ href: '#invites', id: 'user_nav_invites_available' }, 'Invites'),
          a({ href: '#account' }, 'Settings'),
          a({ href: Badger.logout }, 'Logout')
        )
      ]);
    });
      
    // //$(user_nav).prepend(span(a({ href: '#account/settings'}, response.data.name)));
    // // $(user_nav).prepend(span(a({ href: '#invites', id: 'user_nav_invites_available' }, 'Invites')));
    // $(user_nav).prepend(span(a({ href: '#domains', id: 'user-nav-domains' }, 'Domains')));  // updated by update_credits after_filter
    // $(user_nav).prepend(span(a({ href: '#search' }, 'Search')));
  });

  define('update_credits', function(refresh) {
    if (!Badger.getAccessToken()) return;
    if (refresh) BadgerCache.flush('account_info');
    BadgerCache.getAccountInfo(function(response) {
      $('#user_nav_credits').html(response.data.domain_credits == 1 ? '1 Credit' : response.data.domain_credits + ' Credits');
      response.data.domain_credits > 0 ? $('#user_nav_credits').show() : $('#user_nav_credits').hide();
    });
  });

  after_filter('update_credits', update_credits);

  define('update_account_name', function() {
    BadgerCache.flush('account_info');
    BadgerCache.getAccountInfo(function(response) {
      $('#use_nav_name').html(response.data.name);
    });
  });

  // Invites are on for everyone, all the time so don't display count
  // https://www.pivotaltracker.com/story/show/30427979
  // define('update_invites_available', function(refresh) {
  //   if (refresh) BadgerCache.flush('account_info');
  //   BadgerCache.getAccountInfo(function(response) {
  //     $('#user_nav_invites_available a').html(response.data.invites_available + ' Invites');
  //     if (response.data.invites_available > 0)
  //       $('#user_nav_invites_available').removeClass('hidden');
  //     else
  //       $('#user_nav_invites_available').addClass('hidden');
  //   });
  // });
  // after_filter('update_invites_available_count', update_invites_available_count);
  

  ////////////////
  // dom helpers
  ////////////////
  
  define('country_options', function(selected_country) {
    countries = [["AF", "Afghanistan"],["AX", "Åland"],["AL", "Albania"],["DZ", "Algeria"],["AS", "American Samoa"],["AD", "Andorra"],["AO", "Angola"],["AI", "Anguilla"],["AQ", "Antarctica"],["AG", "Antigua and Barbuda"],["AR", "Argentina"],["AM", "Armenia"],["AW", "Aruba"],["AU", "Australia"],["AT", "Austria"],["AZ", "Azerbaijan"],["BS", "Bahamas"],["BH", "Bahrain"],["BD", "Bangladesh"],["BB", "Barbados"],["BY", "Belarus"],["BE", "Belgium"],["BZ", "Belize"],["BJ", "Benin"],["BM", "Bermuda"],["BT", "Bhutan"],["BO", "Bolivia"],["BA", "Bosnia and Herzegovina"],["BW", "Botswana"],["BV", "Bouvet Island"],["BR", "Brazil"],["IO", "British Indian Ocean Territory"],["BN", "Brunei Darussalam"],["BG", "Bulgaria"],["BF", "Burkina Faso"],["BI", "Burundi"],["KH", "Cambodia"],["CM", "Cameroon"],["CA", "Canada"],["CV", "Cape Verde"],["KY", "Cayman Islands"],["CF", "Central African Republic"],["TD", "Chad"],["CL", "Chile"],["CN", "China"],["CX", "Christmas Island"],["CC", "Cocos (Keeling) Islands"],["CO", "Colombia"],["KM", "Comoros"],["CG", "Congo (Brazzaville)"],["CD", "Congo (Kinshasa)"],["CK", "Cook Islands"],["CR", "Costa Rica"],["CI", "Côte d'Ivoire"],["HR", "Croatia"],["CU", "Cuba"],["CY", "Cyprus"],["CZ", "Czech Republic"],["DK", "Denmark"],["DJ", "Djibouti"],["DM", "Dominica"],["DO", "Dominican Republic"],["EC", "Ecuador"],["EG", "Egypt"],["SV", "El Salvador"],["GQ", "Equatorial Guinea"],["ER", "Eritrea"],["EE", "Estonia"],["ET", "Ethiopia"],["FK", "Falkland Islands"],["FO", "Faroe Islands"],["FJ", "Fiji"],["FI", "Finland"],["FR", "France"],["GF", "French Guiana"],["PF", "French Polynesia"],["TF", "French Southern Lands"],["GA", "Gabon"],["GM", "Gambia"],["GE", "Georgia"],["DE", "Germany"],["GH", "Ghana"],["GI", "Gibraltar"],["GR", "Greece"],["GL", "Greenland"],["GD", "Grenada"],["GP", "Guadeloupe"],["GU", "Guam"],["GT", "Guatemala"],["GG", "Guernsey"],["GN", "Guinea"],["GW", "Guinea-Bissau"],["GY", "Guyana"],["HT", "Haiti"],["HM", "Heard and McDonald Islands"],["HN", "Honduras"],["HK", "Hong Kong"],["HU", "Hungary"],["IS", "Iceland"],["IN", "India"],["ID", "Indonesia"],["IR", "Iran"],["IQ", "Iraq"],["IE", "Ireland"],["IM", "Isle of Man"],["IL", "Israel"],["IT", "Italy"],["JM", "Jamaica"],["JP", "Japan"],["JE", "Jersey"],["JO", "Jordan"],["KZ", "Kazakhstan"],["KE", "Kenya"],["KI", "Kiribati"],["KP", "Korea, North"],["KR", "Korea, South"],["KW", "Kuwait"],["KG", "Kyrgyzstan"],["LA", "Laos"],["LV", "Latvia"],["LB", "Lebanon"],["LS", "Lesotho"],["LR", "Liberia"],["LY", "Libya"],["LI", "Liechtenstein"],["LT", "Lithuania"],["LU", "Luxembourg"],["MO", "Macau"],["MK", "Macedonia"],["MG", "Madagascar"],["MW", "Malawi"],["MY", "Malaysia"],["MV", "Maldives"],["ML", "Mali"],["MT", "Malta"],["MH", "Marshall Islands"],["MQ", "Martinique"],["MR", "Mauritania"],["MU", "Mauritius"],["YT", "Mayotte"],["MX", "Mexico"],["FM", "Micronesia"],["MD", "Moldova"],["MC", "Monaco"],["MN", "Mongolia"],["ME", "Montenegro"],["MS", "Montserrat"],["MA", "Morocco"],["MZ", "Mozambique"],["MM", "Myanmar"],["NA", "Namibia"],["NR", "Nauru"],["NP", "Nepal"],["NL", "Netherlands"],["AN", "Netherlands Antilles"],["NC", "New Caledonia"],["NZ", "New Zealand"],["NI", "Nicaragua"],["NE", "Niger"],["NG", "Nigeria"],["NU", "Niue"],["NF", "Norfolk Island"],["MP", "Northern Mariana Islands"],["NO", "Norway"],["OM", "Oman"],["PK", "Pakistan"],["PW", "Palau"],["PS", "Palestine"],["PA", "Panama"],["PG", "Papua New Guinea"],["PY", "Paraguay"],["PE", "Peru"],["PH", "Philippines"],["PN", "Pitcairn"],["PL", "Poland"],["PT", "Portugal"],["PR", "Puerto Rico"],["QA", "Qatar"],["RE", "Reunion"],["RO", "Romania"],["RU", "Russian Federation"],["RW", "Rwanda"],["BL", "Saint Barthélemy"],["SH", "Saint Helena"],["KN", "Saint Kitts and Nevis"],["LC", "Saint Lucia"],["MF", "Saint Martin (French part)"],["PM", "Saint Pierre and Miquelon"],["VC", "Saint Vincent and the Grenadines"],["WS", "Samoa"],["SM", "San Marino"],["ST", "Sao Tome and Principe"],["SA", "Saudi Arabia"],["SN", "Senegal"],["RS", "Serbia"],["SC", "Seychelles"],["SL", "Sierra Leone"],["SG", "Singapore"],["SK", "Slovakia"],["SI", "Slovenia"],["SB", "Solomon Islands"],["SO", "Somalia"],["ZA", "South Africa"],["GS", "South Georgia and South Sandwich Islands"],["ES", "Spain"],["LK", "Sri Lanka"],["SD", "Sudan"],["SR", "Suriname"],["SJ", "Svalbard and Jan Mayen Islands"],["SZ", "Swaziland"],["SE", "Sweden"],["CH", "Switzerland"],["SY", "Syria"],["TW", "Taiwan"],["TJ", "Tajikistan"],["TZ", "Tanzania"],["TH", "Thailand"],["TL", "Timor-Leste"],["TG", "Togo"],["TK", "Tokelau"],["TO", "Tonga"],["TT", "Trinidad and Tobago"],["TN", "Tunisia"],["TR", "Turkey"],["TM", "Turkmenistan"],["TC", "Turks and Caicos Islands"],["TV", "Tuvalu"],["UG", "Uganda"],["UA", "Ukraine"],["AE", "United Arab Emirates"],["GB", "United Kingdom"],["UM", "United States Minor Outlying Islands"],["US", "United States of America"],["UY", "Uruguay"],["UZ", "Uzbekistan"],["VU", "Vanuatu"],["VA", "Vatican City"],["VE", "Venezuela"],["VN", "Vietnam"],["VG", "Virgin Islands, British"],["VI", "Virgin Islands, U.S."],["WF", "Wallis and Futuna Islands"],["EH", "Western Sahara"],["YE", "Yemen"],["ZM", "Zambia"],["ZW", "Zimbabwe"]];
    return [
      option({ value: "AU" }, "Australia"),
      option({ value: "CA" }, "Canada"),
      option({ value: "GB" }, "United Kingdom"),
      option({ value: "US" }, "United States of America"),
      option({ disabled: 'disabled' },''),

      countries.map(function(country) {
        var opts = { value: country[0] };
        if (selected_country == country[0]) opts.selected = 'selected';
        return option(opts, country[1]);
      })
    ];
  });
  
  define('scroll_to_top', function() {
    $.smoothScroll(0);
  });
  
  
  define('logged_in', function(route) {
    return !!Badger.getAccessToken();
  });
  
  define('error_message', function(response) {
    return div({ 'class': 'error-message' },
      div(
        response.data ? [
          response.data.message,
          !response.data.errors ? "" : ": " + response.data.errors.map(function(error) { return error.reason ? error.reason : error.field.replace(/_/g, ' ').capitalize_first() + " " + error.code.replace(/_/g, ' ');}).join(', ')
        ] : arguments
      )
    )
  });

  define('success_message', function(response) {
    return div({ 'class': 'success-message' },
      div( response.data ? response.data.message : arguments )
    )
  });

  define('info_message', function() {
    if (arguments[0].data && arguments[0].data.message) {
      return div({ 'class': 'info_message' }, arguments[0].data.message);
    } else {
      var arguments = flatten_to_array(arguments);
      var options = shift_options_from_args(arguments);
      options['class'] = 'info-message';
      return div(options, arguments);
    }
  });
  
  define('subtle_info_message', function() {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);
    options['class'] = 'subtle-info-message';
    return div(options, arguments);
  });
  
  define('spinner', function() {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);
    
    // override the styling, but allow other attributes to be set
    options.style = 'left: 0px; top: 115px; position: relative; text-align: center;';
        
    return div(options,
      img({ src: 'images/spinner.gif' }),
      br(),
      span({ style: 'font-style: italic' }, arguments)
    );
  });
  
  // like spinner, but wrapped in a modal
  define('show_spinner_modal', function(message) {
    show_modal({ style: 'height: 150px; text-align: center;' },
      div({ style: 'padding: 65px;' },
        img({ src: 'images/spinner.gif' }), br(),
        span({ style: 'font-style: italic' }, message)
      )
    )
  });
  
  // this will return a form, and when the submit button is clicked, it will hide the form content,
  // and display a loader div
  define('form_with_loader', function() {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);

    // pick off whether or not this form has a sidebar. hacky.
    var has_sidebar = !!((options['class'] || '').match(/has-sidebar/));
    
    // save the original form action now
    var original_form_action = options.action;
    var wrapper_div = div(
      div({ id: '_form-loader', style: "display: none;" },
        spinner({ has_sidebar: has_sidebar }, options.loading_message || 'Loading...')
      ),
      div({ id: '_form-internals' },
        arguments
      )
    );
    
    // override the form action
    options.action = (function(form_data) {
      show_form_submit_loader();
      
      // if it's a long page, the user likely clicked a submit button at the bottom.
      // scroll the page to the top to show any errors that might show up
      scroll_to_top();
      
      // execute the original form aciton
      original_form_action(form_data);
    });
    
    return form(options, wrapper_div);
  });
  
  // render a header with links
  define('chained_header_with_links', function() {
    var arguments = flatten_to_array(arguments);
    var header_arguments = [];
    for (i = 0; i < arguments.length; i++) {
      var options = arguments[i];
      var href = options.href; delete options.href; // delete off the href
      var text = options.text; delete options.text; // delete off the text
      
      if (!href) {
        header_arguments.push(span(options, text));
      } else {
        options.href = href;
        header_arguments.push(a(options, text));
      }
      if ((i + 1) != arguments.length) header_arguments.push(" » ");
    }
    return h1(header_arguments);
  })
      
  define('hide_form_submit_loader', function() {
    make_visible('#_form-loader', false);
    make_visible('#_form-internals', true);
  });
  
  define('show_form_submit_loader', function() {
    make_visible('#_form-loader', true);
    make_visible('#_form-internals', false);
  });

  // helper function to intuitively toggle either visibility or display.
  define('make_visible', function(id, visible) {
    if (visible) {
      if ($(id).css('display') == 'none') $(id).css('display', '');
      if ($(id).css('visibility') == 'hidden') $(id).css('visibility', 'visible');
    } else {
      if ($(id).css('display') != 'none') $(id).css('display', 'none');
      if ($(id).css('visibility') != 'hidden') $(id).css('visibility', 'hidden');
    }
  });
  
  // easily define pretty looking icons to throw in tables, etc.
  define('app_store_icon', function() {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);
    
    // override the class of the anchor
    options['class'] = 'app_store_container';
    
    return a(options,
      span({ 'class': 'app_store_icon', style: 'background-image: url(' + (options.image_src || 'images/apps/badger.png') + ')' } ),
      span({ style: 'text-align: center; font-weight: bold; min-height: 36px' }, options.name || "")
    );
  });
  
  // just show the ajax loader gif
  define('ajax_loader', function() {
    var arguments = flatten_to_array(arguments);
    var options = shift_options_from_args(arguments);
    return div(options, img({ src: 'images/ajax-loader.gif' }));
  });
  

  //////////////
  // left nav
  //////////////

  // define('left_nav', function() {
  //   var badger_menu_items = [
  //     li({ 'class': "blog" }, a({ href: "#blogs" }, 'OUR BLOG')),
  //     li({ 'class': "faq" }, a({ href: "#faqs" }, 'FAQS')),
  //     li({ 'class': "knowledge-center" }, a({ href: "#knowledge_center" }, 'KNOWLEDGE CENTER')),
  //     li({ 'class': "contact-us" }, a({ href: "#contact_us" }, 'CONTACT US'))
  //   ];
  //   
  //   return ul({ id: 'menu' },
  //     Badger.getAccessToken() ? [
  //       li({ id: 'nav-my-domains' },
  //         a({ href: "#domains" }, span(span('MY DOMAINS'), span({ id: 'my-domains-count' }))),
  //         ul(
  //           li({ 'class': "transfer"}, a({ href: "#domain-transfers" }, 'TRANSFERS')),
  //           li({ 'class': "expiring-soon"}, a({ href: "#filter_domains/expiringsoon/list" }, 'EXPIRING SOON'))
  //         )
  //       ),
  // 
  //       li({ id: 'nav-my-account' },
  //         a({ href: "#account" }, 'MY ACCOUNT'),
  //         my_account_nav()
  //       ),
  // 
  //       li({ id: 'nav-help-and-support' },
  //         a({ href: "#welcome" }, 'BADGER.COM'),
  //         ul(badger_menu_items)
  //       )
  //     ] : [
  //       li(a({ href: "#welcome" }, 'BADGER.COM')),
  //       badger_menu_items
  //     ]
  // 
  //   );
  // });
  
  // define('badger_menu_items', function() {
  //   return ;
  // });

  // define('my_account_nav', function() {
  //   var nav = ul(
  //     li({ 'class': "support-ticket" }, a({ href: "#tickets" }, 'SUPPORT TICKETS')),
  //     li({ 'class': "whois-pro" }, a({ href: "#account/profiles" }, 'WHOIS PROFILES')),
  //     li({ 'class': "credit-billing" }, a({ href: "#account/billing" }, 'CREDITS & BILLING')),
  //      li({ 'class': "linked-account" }, a({ href: "#linked_accounts" }, 'LINKED ACCOUNTS')),
  //     li({ 'class': "send-invite hidden", id : 'invites_available'}, a({ href: "#invites" }, span('SEND INVITES'), span({ id: 'invite_available_count' })))
  //   );
  // 
  //   return nav;
  // });

  // define('domain_menu_item', function(domain) {
  //   //var domain = Domain.find(domain);
  //   var app_list = ul();
  // 
  //   load_domain(domain, function(domain_obj) {
  //     if (domain_obj.current_registrar == 'Unknown') {
  //       var timeout = setTimeout(function() {
  //         Badger.getDomain(domain_obj.name, function(response) {
  //           clearTimeout(timeout);
  //           domain_menu_item(domain);
  //         });
  //       }, 1000);
  //     } else if (domain_obj.current_registrar) {
  //       for (var key in Hasher.domain_apps) {
  //         if (DomainApps.app_is_installed_on_domain(Hasher.domain_apps[key], domain_obj) && Hasher.domain_apps[key].menu_item) {
  //           css_class = Hasher.domain_apps[key].menu_item.css_class || "website"
  //           app_list.appendChild(
  //             li({ 'class':  css_class },
  //               a({
  //                 href: Hasher.domain_apps[key].menu_item.href.replace(/:domain/, domain)
  //               }, Hasher.domain_apps[key].menu_item.text)
  //             )
  //           );
  //         }
  //       }
  // 
  //       update_sidebar_with_correct_actives(get_route());
  //     }
  //   });
  // 
  //   return li({ id: 'domain-menu-item-' + domain.replace('.','-'), 'class': 'domain-menu-item' },
  //     a({ href: "#domains/" + domain }, div({ 'class': 'long-domain-name' }, domain.toUpperCase())),
  //     app_list
  //   );
  // });

}


// domain.dns.each()
//   var items = [];
//   for (var key in Hasher.domain_apps) {
//     if (Hasher.domain_apps[key].is_installed(domain) && Hasher.domain_apps[key].menu_item) {
//       Hasher.domain_apps[key].menu_item
//       items.push(
//         li({ 'class': "website" },
//           a({
//             href: Hasher.domain_apps[key].menu_item.href.replace(/:domain/, domain)
//           }, Hasher.domain_apps[key].menu_item.text)
//         )
//       );
//     }
//   }
//   return items;

//     li({ 'class': "email" }, a({ href: "#domains/" + domain + "/whois" }, 'WHOIS & PRIVACY'))
//
//     ul(
//       li({ 'class': "email" }, a({ href: "#domains/" + domain + "/dns" }, 'DNS')),
//       li({ 'class': "email" }, a({ href: "#domains/" + domain + "/whois" }, 'WHOIS & PRIVACY'))
// // li({ 'class': "email" }, a({ href: "#domains/" + domain + "/email_forwards" }, 'EMAIL FORWARDS')),
// // li({ 'class': "email" }, a({ href: "#domains/" + domain + "/web_forwards" }, 'WEB FORWARDS'))
//       //li({ 'class': "email" }, a({ href: "#domains/" + domain + "/whois" }, 'TRANSFER'))
//     )

