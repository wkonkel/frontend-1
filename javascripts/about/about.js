with (Hasher('About', 'Application')) {
  
  route('#about', function() {
    team_bios = [
      bio({
        profile_image_src: 'images/team/warren.png',
        'Name':       "Warren Konkel",
        'Team Role':  "Founder and CEO",
        'Duties':     "Writing code, making plans, and Chief Badgerer",
        'Recently':   "Senior Engineer at LivingSocial",
        'Hometown':   "Washington, DC",
        'Education':  "Rensselaer Polytechnic Institute",
        'For Fun':    "Snowboarding and sailing",
        'Least Favorite Game': 'Elephant Quest'
      }),
      
      bio({
        profile_image_src: 'images/team/paul.png',
        'Name':             "Paul Makepeace",
        'Team Role':        "Director of Engineering",
        'Duties':           "Writing code, foreign accent",
        'Previously':       "Site Reliability Engineer at Google",
        'Hometown':         "Bristol, UK",
        'Education':        "Cambridge University",
        'For Fun':          "Flying planes and [bm]aking stuff",
        'Favorite Fixture': "Disco ball"
      }),
      
      bio({
        profile_image_src: 'images/team/cory.png',
        'Name':             "Cory Boyd",
        'Team Role':        "Software Engineer",
        'Duties':           "Code Alchemy, Task Destroying, Badger Whispering",
        'Hometown':         "San Juan Bautista, CA",
        'Yachts Owned':     "Zero",
        'Favorite Quote':   "\"I aim to misbehave.\"",
        'Desk Decoration':  "Pokeball containing a gold plated Togepi. No shame."
      }),
      
      bio({
        profile_image_src: 'images/team/camille.png',
        'Name':             "Camille Vergara",
        'Team Role':        "Finance/Content/Community Manager",
        'Duties':           "Dotting the i's and crossing the t's",
        'Recently':         "…graduated",
        'Hometown':         "Manila, Philippines",
        'Education':        "Mathematics at De La Salle University",
        'Desk Decoration':  "Darth Vader, Blueberry Green Tea, myriad of post-it messages",
        'Favorite Animal':  "Baby badgers"
      }),
    ];
    
    render(
      h1('About Badger'),
      
      div({ id: 'about-div' },
        about_company(),

        div({ style: 'margin: 35px auto auto auto' },
          h1('Meet the Team!')
        ),
        
        div({ id: 'bio-container'},
          team_bios
        )
      )
    );
  });
  
  define('about_company', function() {
    return div({ 'class': 'bio', id: 'company' },
      div({ id: 'logo' }, img({ src: 'images/v2/happybadger.png' })),
      h2("Domain management you'll enjoy."),
      p("Seriously, we make domains so easy that a first grader could do 'em!*"), 
      p("Domains effectively drive the entire internet, shouldn't they be easier to manage? We thought so, and thus, Badger was born! You shouldn't have to auction off your house and sacrifice your first born to transfer domains, you should be able to press a button that says \"Transfer Domain\" and be done with it. That is our philosophy, and we think you will appreciate it."),
      p("Stop letting domain registrars badger you, and start using... Badger!"),
      span({ style: 'font-size: 10px; text-align: right' }, '*Must be 18 or older. Sorry kids.')
    );
  });
  
  define('bio', function(options) {
    // pick off the profile image src
    var profile_image_src = options.profile_image_src || 'images/apps/badger.png';
    delete options.profile_image_src;
    
    return div({ 'class': 'bio' },
      table(tbody(
        tr(
          td(
            img({ 'class': 'profile', src: profile_image_src })
          ),
          td(
            form({ 'class': 'fancy content' },
              Object.keys(options).map(function(key) {
                return fieldset({ style: 'margin-left: 255px' },
                  label(key + ':'),
                  span({ 'class': 'big-text' }, options[key])
                );
              })
            )
          )
        )
      ))
    );
  });
  
}
