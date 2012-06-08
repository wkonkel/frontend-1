with (Hasher('Welcome','Application')) {
  
  // The cheapest of hacks to make the site work in IE.
  // Avoids the use of multiple layouts, which was buggy.
  after_filter('#welcome', function() {
    document.getElementById('content').setAttribute('id','_content');
  });
    
  route('#welcome', function() {
    var registrar_app_icon_url = Badger.getAccessToken() ? '#linked_accounts' : "#account/create";
    
    render({ layout: default_layout },
      // div({ id: 'main' },
      div(
        div({ 'id': 'content-top' },
          img({ src: 'images/badger-6.png', style: 'float: right; width: 150px; height: auto; margin: 20px 50px 20px 20px' }),
          h1("Domain management done ", span({ style: 'letter-spacing: 2px' }, "r"), "ight."),
          //h3("Badger makes managing your domains easy, wherever they are."),

          h3("Link an existing account:"),
          div({ 'class': 'registrars', style: 'padding-left: 30px' },
            a({ href: '#linked_accounts/godaddy/link' }, img({ 'class': 'app_store_icon', src: 'images/apps/godaddy.png' }), span('GoDaddy')),
            a({ href: '#linked_accounts/networksolutions/link' }, img({ 'class': 'app_store_icon', src: 'images/apps/ns.png' }), span('Network Solutions')),
            a({ href: '#linked_accounts/enom/link' }, img({ 'class': 'app_store_icon', src: 'images/apps/enom.png' }), span('eNom')),
            a({ href: '#linked_accounts/namecheap/link' }, img({ 'class': 'app_store_icon', src: 'images/apps/namecheap.png' }), span('Namecheap'))
          ),

          h3("Search for a new domain:"),
          div({style: 'padding-left: 30px'}, 
            //a({ href: get_started, 'class': 'myButton', style: 'font-size: 20px; padding: 9px 30px' }, 'Search for domains')
            input({ 'class': 'domain-search-box', placeholder: 'e.g. badger.com', onFocus: function() { set_route('#search'); $('#form-search input').focus(); } })
          )
        ),
        
        // div({ 'id': 'content-top-right', style: 'float: left' }, 
        //   h2({ style: 'font-size: 26px' }, "Or link your account:"),
        // 
        //   div(a({ href: '#linked_accounts/godaddy/link' }, img({ 'class': 'app_store_icon mini', src: 'images/apps/godaddy.png' }), span('GoDaddy'))),
        //   div(a({ href: '#linked_accounts/networksolutions/link' }, img({ 'class': 'app_store_icon mini', src: 'images/apps/ns.png' }), span('Network Solutions'))),
        //   div(a({ href: '#linked_accounts' }, img({ 'class': 'app_store_icon mini', src: 'images/apps/enom.png' }), span('eNom'))),
        //   div(a({ href: '#linked_accounts' }, img({ 'class': 'app_store_icon mini', src: 'images/apps/namecheap.png' }), span('Namecheap')))          
        // ),
        // div({ style: 'clear: both' }),
        
        div({ 'id': 'content', style: "margin: 0", 'class': 'homepage' }, 
          table({ style: 'width: 100%' }, tbody(tr(
            td({ style: 'width: 50%; padding-right: 10px; vertical-align: top'}, 
              h3('Manage all of your domains in one place.'),
              p('Link your existing registrar accounts with your Badger account.'),
            
              h3('Automatic transfers with no downtime.'),
              p('We handle all the hard parts like auth codes and DNS migration.'),

              h3('DNS shortcuts for easy configuration.'),
              p('Install popular apps quickly without touching DNS.')
            ),
            td({ style: 'width: 50%; padding-left: 10px; vertical-align: top' },
              h3('Register domains for $10 a year.'),
              p('Pricing is the same for registrations, transfers and renewals.'),

              h3('Free WHOIS privacy and forwarding.'),
              p("Privacy, DNS hosting and email/url forwarding are included."),

              h3("We're developer friendly."),
              p('We have a RESTful API and an open source frontend.')
            )
          )))
        )
      )      
    );
    
    document.title = 'Badger'
    
    //   div({ id: 'homepage-welcome' },
    //     h2("Domains done right."),
    //     h3("Badger makes it easy to find new domains and manage existing domains.")
    //     
    //     
    // 
    //     // h3('Link existing accounts for free:'),
    //     // div({ style: 'height: 120px' },
    //     //   app_icon('images/apps/godaddy.png', 'GoDaddy'),
    //     //   app_icon('images/apps/ns.png', 'Network Solutions'),
    //     //   app_icon('images/apps/enom.png', 'eNom'),
    //     //   app_icon('images/apps/namecheap.png', 'Namecheap'),
    //     //   app_icon('images/apps/1and1.png', '1&1')
    //     // )
    //     // 
    //     // h3('Manage existing domains for free'),
    //     // div({ style: 'height: 120px' },
    //     //   app_icon('images/apps/godaddy.png', 'GoDaddy'),
    //     //   app_icon('images/apps/ns.png', 'Network Solutions'),
    //     //   app_icon('images/apps/enom.png', 'eNom'),
    //     //   app_icon('images/apps/namecheap.png', 'Namecheap')
    //     //   //app_icon('images/apps/1and1.png', '1&1')
    //     // )
    // 
    // 
    //     // h2("Domains for ", span("$10"), " a year."),
    //     // div({ 'class': 'get-started-wrapper', style: "float: right; margin-top: -85px" },
    //     //   a({ href: get_started, 'class': 'myButton', style: 'font-size: 30px; padding: 15px 30px' }, 'Get Started')
    //     // ),
    //     // img({ src: 'images/badger-6.png', 'class': 'badger', style: 'margin-top: 50px' }),
    //     // 
    //     // h3({ style: "margin-bottom: 0" }, 'Automatic transfers with no downtime:'),
    //     // //h3({ style: "margin-bottom: 0" }, 'Free WHOIS privacy and DNS hosting.'),
    //     // h3('Shortcuts for easy setup:'),
    //     // div({ style: 'height: 120px' },
    //     //   app_icon('images/apps/gmail2.png', 'Gmail'),
    //     //   app_icon('images/apps/wordpress.png', 'Wordpress'),
    //     //   app_icon('images/apps/shopify.png', 'Shopify'),
    //     //   app_icon('images/apps/heroku.png', 'Heroku'),
    //     //   app_icon('images/apps/blogger.png', 'Blogger')
    //     // ),
    //     // 
    //     // div({ style: "clear: both" })
    //     
    //     // ul(
    //     //   li('Automatic transfers with no downtime.'),
    //     //   //li('Fast search and simple registration process.'),
    //     //   li('DNS shortcuts for popular apps.'),
    //     //   li('Free privacy, DNS and email/url forwarding.')
    //     // ),
    //     
    //   )
    // );
  });
  
  define('app_icon', function(img_src, name, callback) {
    return a({ 'class': 'app_store_container', href: callback || get_started },
      img({ 'class': 'app_store_icon', src: img_src } ),
      span({ style: 'text-align: center; font-weight: bold; color: white' }, name)
    );
  });
  
  define('registrar_link_page', function(registrar) {
    if (registrar == 'godaddy')
      set_route('#linked_accounts/godaddy/link');
    else if (registrar == 'networksolutions')
      set_route('#linked_accounts/networksolutions/link');
  });

  define('get_started', function() {
    set_route('#search'); 
    $('#form-search-input').focus();
  });
}



// define('render_homepage_blurb', function() {
//   render(
//     div({ id: 'homepage' },
//               
//       div({ 'class': 'rotater' },
//         div(
//           img({ src: 'images/v2/home-search.png' }),
//           h2('Fast search and simple registration process.'), 
//           h3('$10/year'),
//           p("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum luctus dignissim viverra.")
//         ),
//         div(
//           img({ src: 'images/v2/home-search.png' }),
//           h2('Automatic transfers with no downtime.'),
//           h3('$10/year'),
//           p("Don't let them badger you again.")
//         ),
//         div(
//           img({ src: 'images/v2/home-apps.png' }),
//           h2('Popular shortcuts for quick configuration.'),
//           h3('$10/year'),
//           p("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum luctus dignissim viverra.")
//         ),
//         div(
//           img({ src: 'images/v2/home-search.png' }),
//           h2('Free privacy, DNS and email/url forwarding.'), 
//           h3('$10/year'),
//           p("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum luctus dignissim viverra.")
//         )
//       )
//     )
//   );
//   
//   var rotater = null;
//   (rotater = function() {
//     $('.rotater div:visible:first').hide().next().show();
//     if ($('.rotater div:visible:first').length == 0) $('.rotater div:first').show();
//     setTimeout(rotater, 4000);
//   })();
// });



// div({ 'id': 'search-arrow-bar', 'class': 'info-message', style: 'font-weight: bold; padding: 8px 15px; font-size: 16px' }, "«--- Search for available domains using this search box.  ", i({ style: 'font-weight: normal' }, '(Hint: type your name)')),

//h1({ style: 'margin-top: 0' }, 'Welcome to Badger'),
// table({ style: 'width: 100%' }, tbody(
//   tr(
//     td({ style: 'vertical-align: top' }, 
//       div({ style: "margin-top: 10px" },
//         // h3({ style: "margin: 0" }, "Already have a domain?"),
//         // p({ style: "margin-top: 5px; margin-bottom: 18px" }, 
//         //   form({ action: function(form_data) { set_route('#domains/' + form_data.name); } }, text({ name: 'name' }), submit('Show Information'))
//         // ),
// 
// 
//         h3({ style: "margin: 0" }, "What is badger.com?"),
//         p({ style: "margin-top: 5px; margin-bottom: 18px" }, "We are a domain registrar.  We make setting up domains easy."),
//   
//         h3({ style: "margin: 0" }, "What is a domain?"),
//         p({ style: "margin-top: 5px; margin-bottom: 18px" }, "It's the \"badger.com\" in ", a({ href: '#welcome' }, 'www.badger.com'), ' or ', a({ href: 'mailto:support@badger.com' }, 'support@badger.com'), '.'),
// 
//         h3({ style: "margin: 0" }, "What does it cost?"),
//         p({ style: "margin-top: 5px; margin-bottom: 18px" },
//           span({ style: 'color: #666'}, span({ style: 'color: black'}, "$15 per year for a .com, .net, .org, .info or .me."))
//         ),
//       
//         h3({ style: "margin: 0" }, "What services do you offer for free?"),
//         p({ style: "margin-top: 5px; margin-bottom: 18px" }, 'WHOIS privacy, DNS hosting, email/url forwarding and more.'),
// 
//         // h3({ style: "margin: 0" }, "What extensions do you support?"),
//         // p({ style: "margin-top: 5px; margin-bottom: 18px" }, u('We currently support .com, .net, .org, .info and .me'), '. We will be adding .name, .biz, .us and .co.uk in the next week or two with many more to follow.'),
// 
//         h3({ style: "margin: 0" }, "Already have a domain?"),
//         //p({ style: "margin-top: 5px; margin-bottom: 18px" }, "Read about out ", a({ href: '#faqs/how-were-different' }, "how we're different"), ".  Or, you can jump right in and ", a({ href: Transfer.show }, "transfer a domain"), ".")
//         p({ style: "margin-top: 5px; margin-bottom: 18px" }, "You can jump right in and ", a({ href: Transfer.show }, "transfer a domain"), ".")              
//       )
//     ),
