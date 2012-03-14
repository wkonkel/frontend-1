with (Hasher('Welcome','Application')) {
  route('#welcome', function() {
    render(
    
      div({ id: 'homepage-welcome' },
        h2("Domains for $15/year."),
        img({ src: 'images/badger-6.png', style: 'padding: 20px 30px; float: right' }),
        ul(
          li('Fast search and simple registration process.'),
          li('Automatic transfers with no downtime.'),
          li('Popular shortcuts for quick configuration.'),
          li('Free privacy, DNS and email/url forwarding.')
        ),
        
        div({ style: 'text-align: center; margin-top: 30px' },
          a({ href: get_started, 'class': 'myButton', style: 'font-size: 30px; padding: 15px 30px' }, 'Get Started')
        )

        // img({ src: 'images/badger-6.png', style: 'padding: 20px 30px; float: right' }),
        // h2("$15/year")
      )
    );
  });

  define('get_started', function() {
    set_route('#search'); 
    $('#form-search-input').focus();
  });
}


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
//   )
// ))
