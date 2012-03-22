with (Hasher('Welcome','Application')) {
  route('#welcome', function() {
    render(
    
      div({ id: 'homepage-welcome' },
        h2("Domains for ", span("$15"), " a year."),
        div({ 'class': 'get-started-wrapper', style: "float: right; margin-top: -85px" },
          a({ href: get_started, 'class': 'myButton', style: 'font-size: 30px; padding: 15px 30px' }, 'Get Started')
        ),
        img({ src: 'images/badger-6.png', 'class': 'badger', style: 'margin-top: 50px' }),

        h3({ style: "margin-bottom: 0" }, 'Automatic transfers with no downtime.'),
        h3({ style: "margin-bottom: 0" }, 'Free WHOIS privacy and DNS hosting.'),
        h3('Shortcuts for easy setup:'),
        div({ style: 'height: 120px' },
          app_icon('images/apps/gmail2.png', 'Gmail'),
          app_icon('images/apps/wordpress.png', 'Wordpress'),
          app_icon('images/apps/shopify.png', 'Shopify'),
          app_icon('images/apps/heroku.png', 'Heroku'),
          app_icon('images/apps/blogger.png', 'Blogger')
        ),

        // h3({ style: "margin-bottom: 0" }, 'Automatic transfers from:'),
        // div({ style: 'height: 120px' },
        //   app_icon('images/apps/godaddy.png', 'GoDaddy'),
        //   app_icon('images/apps/enom.png', 'eNom'),
        //   app_icon('images/apps/namecheap.png', 'Namecheap'),
        //   app_icon('images/apps/ns.png', 'Network Solutions'),
        //   app_icon('images/apps/1and1.png', '1&1')
        // ),
        
        div({ style: "clear: both" })
        
        // ul(
        //   li('Automatic transfers with no downtime.'),
        //   //li('Fast search and simple registration process.'),
        //   li('DNS shortcuts for popular apps.'),
        //   li('Free privacy, DNS and email/url forwarding.')
        // ),
        
      )
    );
  });
  
  define('app_icon', function(img_src, name, callback) {
    return a({ 'class': 'app_store_container', href: callback || get_started },
      img({ 'class': 'app_store_icon', src: img_src } ),
      span({ style: 'text-align: center; font-weight: bold' }, name)
    );
  })

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

//h1({ style: 'margin-top: 0' }, 'Welcome to Badger.com'),
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
