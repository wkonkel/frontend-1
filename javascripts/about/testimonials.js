with (Hasher('Testimonials', 'Application')) {

  route('#testimonials', function() {
    testimonials = [
      testimonial({
        'name':  "Paul S.",
        'quote': "Switching from godaddy to badger was incredibly easy.  Your interface blows everything else out of the water.  Badger drew me in with a free domain during the CISPA fiasco and won me over with intuitive design & ux.  Happy to see the support is fast & responsive too.",
//        'link':  '',
        'date':  'Dec 31, 2012'
      }),

      testimonial({
        'name':  "Michael KN.",
        'quote': "badger.com is the only non-sucky registrar i've ever used.",
        'link':  'http://news.ycombinator.com/item?id=4887778',
        'date':  'Apr 17, 2012'
      }),

      testimonial({
        'name':  "James (@JimmyHawkins)",
        'quote': "Just purchased a domain using @badger - Super slick interface. Installing applications like Blogger is as easy as pushing a button.",
//        'link':  '',
        'date':  'Apr 17, 2012'
      }),

      testimonial({
        'name':  "@welocally",
        'quote': "@Badger love love love your service. Made switching from GoDaddy about as painless as humanly possible. #simplecool",
//        'link':  '',
        'date':  'Jun 7, 2012'
      }),

      testimonial({
        'name':  "Saul (@saul)",
        'quote': "I am moving all my domains to @Badger - the most pain-free domain experience I've ever had… and some of them have really stung.",
//        'link':  '',
        'date':  'Jul 5, 2012'
      }),

      testimonial({
        'name':  "Brian (@brian_pearce)",
        'quote': "Just registered a domain with @badger. Quickest domain registration of life!",
//        'link':  '',
        'date':  'Jul 6, 2012'
      }),

      testimonial({
        'name':  "Paul (@paulpod)",
        'quote': "Do you sometimes have to do things with domain names, but actually not know what you are doing? Me too! Use this badger.com",
//        'link':  '',
        'date':  'Jul 14, 2012'
      }),

      testimonial({
        'name':  "cc",
        'quote': "The automated transfer was really cool – I’m still wandering around thinking, 'there must be more things I have to fill in, it was a headache last time…' Thanks for this great price on this service. $10/year was cheaper than my last – which didn't even have free whois and DNS. Also as an aside I'm digging the clean and easy to navigate UI, most other domain/hosting-related services have miasmic mazes for layouts with information just kind of randomly pinned anywhere. I'm really happy with Badger and will definitely stick with you guys.",
        'link':  'http://blog.badger.com/2012/07/04/domain-independence-day-8/#comments',
        'date':  'Jul 14, 2012'
      }),

      testimonial({
        'name':  "Zachary (@ZacharyTong)",
        'quote': "@Badger just added the ability to link with GoDaddy. Been wanting to transfer off GoDaddy. Thanks badger.com!",
//        'link':  '',
        'date':  'Jul 15, 2012'
      }),


      testimonial({
        'name':  "Julian (@juliangiuca)",
        'quote': "I'm constantly impressed with the speed and functionality of @badger. Best damn domain registrar.",
//        'link':  '',
        'date':  'Jul 20, 2012'
      }),

      testimonial({
        'name':  "Damien (@its_damo)",
        'quote': "Transferred all my domain names to badger.com… process was 100% automated and painless. Easiest DNS configuration I know!",
//        'link':  '',
        'date':  'Jul 26, 2012'
      }),

      testimonial({
        'name':  "marklabedz",
        'quote': "I switched to Badger about a year ago. I think I switched when they 'launched' via HN and haven't had any reason to switch. I'm not the heavy user most on HN are, but everything works, its easy, and I don't get annoying sales (spam) emails.",
        'link':  'http://news.ycombinator.com/item?id=4888000',
        'date':  'Dec 7, 2012'
      }),

      testimonial({
        'name':  "ewolfe",
        'quote': "Badger does one thing, and they do it well. They also have a kick-ass API.",
        'link':  'http://news.ycombinator.com/item?id=4888147',
        'date':  'Dec 7, 2012'
      })

    ];

    render(
      h1('Badger Love'),

      div({ id: 'testimonials-div' },
        testimonials_intro(),
        div({ style: 'margin: 35px auto auto auto' },
          h1('Testimonials')
        ),
        div({ id: 'testimonials-container'},
          testimonials
        )
      )
    );
  });

  define('testimonials_intro', function() {
    return div({ 'class': 'testimonials', id: 'intro' },
      span({ id: 'logo' }, img({ src: 'images/v2/happybadger.png' })),
      p("We're very proud of the service we provide at Badger and even more so when we receive notes like these. ",
        "We welcome ", em("all"), " feedback — ", a({ href: "#contact_us" }, "drop us a line."), br({ 'clear': 'all' }))
    );
  });

  define('testimonial', function(options) {
    return div({ 'class': 'testimonials' },
      '"', options['quote'], '"', br(), span({ style: 'padding-left: 40px' }, '-- '), (options['link'] ? a({ href: options['link'] }, options['name']) : options['name'])
    );
  });

}
