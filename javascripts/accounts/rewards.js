with (Hasher('Rewards','Application')) {
  route('#rewards', function() {
    var target_div = div(spinner('Loading...'));
    
    render(
      target_div
    );
    
    BadgerCache.getAccountInfo(function(response) {
      var rewards_enabled = response.data.rewards_enabled || false,
          referral_stats = (response.data.referral_stats||{}),
          show_create_referral_code_form = (response.data.referral_codes||[]).length <= 0,
          default_slug = response.data.suggested_slug,
          free_domains_earned = Math.floor((referral_stats.points_earned - referral_stats.points_redeemed) / 100),
          points_to_display = ((referral_stats.points_earned - referral_stats.points_redeemed) >= 100 ? 100 : referral_stats.points_earned % 100);
          
      var referral_codes = response.data.referral_codes || [],
          url_base = Badger.api_host.replace(/api/,'www').split('//')[1],
          referral_code = referral_codes[0]; // for the sake of local and qa development
      
      // render point redemption message at the top of the page if needed
      if (points_to_display >= 100) {
        var free_domains_earned = Math.floor((referral_stats.points_earned - referral_stats.points_redeemed) / 100);
        
        render({ into: 'before-content' },
          info_message({ style: 'text-align: center; margin-top: 20px;' },
            p({ style: 'font-size: 20px;' },"You have earned ", b(free_domains_earned+''), " free ", (free_domains_earned == 1 ? 'domain' : 'domains'), "! Good work, we're all so proud of you."),
            a({ 'class': 'myButton large', href: redeem_reward_points }, 'Redeem Domain Credits')
          )
        );
      }
      var top_div = div();
      
      if (!rewards_enabled) {
        render({ into: top_div },
          info_message("To start earning free domains, you need to register or transfer at least 1 domain to Badger."),
          div({ style: 'margin: 20px 20px 0px 20px;' },
            h3('Add domains now'),
            Domains.add_more_domains_icons()
          )
        );
      } else if (show_create_referral_code_form) {
        return render({ into: target_div },
          form_with_loader({ 'class': 'fancy', action: create_referral_code },
            div(
              h1('Start Earning Free Domains'),
              p("First, you need to create a ", b("referral code"), ". Creating a referral code will give you a unique ", b('referral link'), " that you can share with your friends to earn rewards."),
              p("For example, if you make your referral code ", b('badgerlicious'), ", you will be given the referral link ", b('www.badger.com/badgerlicious'), "."),

              p(b("WARNING:"), " Once you create a referral code, it ", b("CANNOT"), " be changed."),

              div({ id: 'referral-code-create-errors' }),
              div({ id: 'referral-code-create-div', style: '' },
                fieldset({ 'for': 'slug' },
                  label('My Referral Code:'),
                  input({ style: 'width: 150px;', name: 'slug', value: default_slug }),
                  ul({ style: 'font-size: 12px; line-height: 20px; margin: 0px;' },
                    li('Length must be at least 6 characters'),
                    li('Code can only contain the characters: A-Z, 0-9, and _'),
                    li('Code must begin and end with the characters A-Z and 0-9')
                  )
                ),
                fieldset({ 'class': 'no-label' },
                  submit('Create Referral Code')
                )
              )
            )
          )
        );
      } else {
        render({ into: top_div },
          subtle_info_message({ style: 'text-align: center; font-size: 16px;' },
            div({ style: 'text-align: center;' },
              p({ style: 'margin-top: 5px;' }, 'You have earned ', b(points_to_display+''), ' of ', b('100'), ' points toward a free domain'),

              div({ 'class': 'meter small green nostripes', style: 'height: 15px;' },
                span({ style: 'height: 15px; width: ' + (points_to_display)+'' + '%' })
              )
            )
          )
        );
      }
      
      render({ into: target_div },
        top_div,
        
        rewards_enabled && !show_create_referral_code_form && div(
          div({ 'class': 'reward-description' },
            div({ 'class': 'description' },
              p({ 'class': 'main' }, 'Refer your friends to Badger'),
              div({ 'class': 'sub' },
                p('You get points for every purchase they make.'),

                div({ style: 'margin-top: 10px;' },
                  span({ style: 'width: 25%; font-weight: bold; margin-right: 10px' },'Your Referral Link:'),
                  // clicking the input field selects the text inside, and resizes the box
                  input({ 'class': 'fancy', id: 'referral-link', style: 'width: 40%; margin: 0px; color: #707070; cursor: pointer', readonly: true, value: (url_base + referral_code), onclick: function() { this.select(); this.style.width = ((this.value.length + 5) * 8) + 'px'; } })
                )
              )
            ),
            div({ 'class': 'points' },
              p({ 'class': 'number' }, '+10'),
              p({ 'class': 'sub' }, 'per year of registration')
            )
          ),

          div({ style: 'clear: left;' }),

          div({ 'class': 'reward-description' },
            div({ 'class': 'description' },
              p({ 'class': 'main' }, "Link + Tweet / Share"),

              div({ 'class': 'sub' },
                p("Link an account and share your link for an easy 10 points."),

                div({ id: 'errors' }),

                form({ 'class': 'fancy', style: 'margin-left: -125px;' },
                  fieldset(
                    label({ 'for': 'share-message' }, 'Message:'),
                    textarea({ id: 'share-message', style: 'width: 310px; height: 75px;' }, "Come register a domain with Badger for only $5! " + (url_base+referral_code))
                  ),
                  fieldset(
                    label('Share:'),
                    div({ style: 'margin: 15px 0px;' },
                      Share.share_icon({ onclick: curry(window.open, 'https://twitter.com/intent/tweet?original_referrer='+encodeURIComponent(window.location.origin)+'&via=Badger&url='+url_base+referral_code+'&text=Come register a domain with Badger for only $5! '+url_base+referral_code, '' , 'width=600,height=260'), image_src: 'images/apps/twitter.png' }),
                      Share.share_icon({ onclick: function() { show_spinner_modal('Posting message...'); Share.share_message_to_facebook(); }, image_src: 'images/apps/facebook.png' })
                    )
                  )
                )
              )
            ),
            div({ 'class': 'points' },
              p({ 'class': 'number' }, '+10')
            )
          ),

          div({ style: 'clear: left;' }),

          div({ 'class': 'reward-description' },
            div({ 'class': 'description' },
              p({ 'class': 'main' }, 'Add domains via linked accounts'),
              div({ 'class': 'sub' },
                p('You get points for every domain added through a linked account.'),
                Domains.link_domains_icons()
              )
            ),
            div({ 'class': 'points' },
              p({ 'class': 'number' }, '+10'),
              p({ 'class': 'sub' }, 'per linked domain')
            )
          )
        ),


        // show the referral code create form
        !show_create_referral_code_form && div({ style: 'text-align: center; margin-top: 30px;' },
          a({ 'class': 'myButton', href: '#rewards/history' }, 'Show Rewards History')
        )
      );
      
      $('input[name=slug]').focus();
      $('input#referral-link').trigger('click');
    });
  });

  define('create_referral_code', function(form_data) {
    show_spinner_modal('Creating referral code...');
    
    Badger.createReferralCode(form_data, function(response) {
      hide_modal();
      
      // replace 'slug' with 'referral code' in a totally awesome manner
      response = JSON.parse(JSON.stringify(response).replace(/slug/g,'referral code'));
      
      if (response.meta.status == 'ok') {
        BadgerCache.flush('account_info');
        set_route('#rewards');
      } else {
        $('#referral-code-create-errors').html(
          error_message(response)
        );
        hide_form_submit_loader();
      }
    });
  });
  
  // the actual logic and redemption happens on the backend
  define('redeem_reward_points', function() {
    show_spinner_modal('Redeeming points...');
    Badger.redeemRewardPoints(function(response) {
      hide_modal();
      BadgerCache.flush('account_info');
      set_route(get_route());
    });
  });
  
  route('#rewards/history', function() {
    var target_div = div(spinner('Loading...'));
    
    render(
      chained_header_with_links(
        { text: 'My Account', href: '#account' },
        { text: 'Rewards', href: '#rewards' },
        { text: 'History' }
      ),
      
      Account.account_nav_table(
        target_div
      )
    );
    
    /*
      Get the referral codes from account info.
      If the user has no referral codes, render the referral code create screen.
      Otherwise, render the rewards page, with referral code and completed actions table.
    */
    BadgerCache.getAccountInfo(function(response) {
      var referral_codes = response.data.referral_codes || [],
          url_base = Badger.api_host.replace(/api/,'www').split('//')[1]; // for the sake of local and qa development
          
      var referral_code = referral_codes[0],
          rewards = response.data.rewards || [],
          referral_stats = response.data.referral_stats || {},
          rewards_div = div();
          
      // calculate the number of points to show by the progress bar
      var total_free_domains_earned = Math.floor(referral_stats.points_redeemed / 100),
          points_to_display = ((referral_stats.points_earned - referral_stats.points_redeemed) >= 100 ? 100 : referral_stats.points_earned % 100),
          free_domains_earned_now = Math.floor((referral_stats.points_earned - referral_stats.points_redeemed) / 100);
      
      if (!referral_code) {
        return render({ into: target_div },
          p("You haven't joined the rewards program yet. ", a({ href: '#rewards' }, "Join now"), " and start earning free domains.")
        );
      }

      render({ into: target_div },
        div({ 'class': 'sidebar' },
          subtle_info_message(
            h3('Accomplishments'),
            table({ 'class': 'rewards-stats' },tbody(
              tr(
                td({ 'class': 'metric' }, referral_stats.points_earned+''),
                td((referral_stats.points_earned == 1 ? 'Point' : 'Points') + ' earned to date.')
              ),
              tr(
                td({ 'class': 'metric' }, total_free_domains_earned+''),
                td('Free ' + (total_free_domains_earned == 1 ? 'domain' : 'domains') + ' earned.')
              ),
              tr(
                td({ 'class': 'metric' }, referral_stats.domains_linked+''),
                td((referral_stats.domains_linked == 1 ? 'Domain' : 'Domains') + ' added through a linked account.')
              ),
              tr(
                td({ 'class': 'metric' }, referral_stats.people_referred+''),
                td((referral_stats.people_referred == 1 ? 'Person' : 'People') + ' referred to Badger.')
              ),
              tr(
                td({ 'class': 'metric' }, referral_stats.domains_registered+''),
                td((referral_stats.domains_registered == 1 ? 'Domain' : 'Domains') + ' registered by your referrals.')
              ),
              tr(
                td({ 'class': 'metric' }, referral_stats.domains_transferred+''),
                td((referral_stats.domains_transferred == 1 ? 'Domain' : 'Domains') + ' transferred by your referrals.')
              )
            ))
          )
        ),
        
        div({ 'class': 'has-sidebar', style: 'min-height: 350px;' },
          subtle_info_message({ style: 'text-align: center;' },
            h3({ style: 'margin: 0px' }, 'My Referral Link'),
            input({ 'class': 'fancy', style: 'font-size: 20px; text-align: center; width: 400px; color: #707070; cursor: pointer', readonly: true, value: (url_base + referral_code), onClick: function(e) { e.target.select() } })
          ),

          rewards_div
        )
      );
      
      render({ into: rewards_div },
        table({ 'class': 'fancy-table' }, tbody(
          tr({ 'class': 'table-header' },
            th({ style: 'width: 8%; text-align: center' }, 'Points'),
            th({ style: 'width: 65%' }, ''),
            th('Completed On')
          ),
          rewards.map(function(reward) {
            return tr(
              td({ style: 'text-align: center; font-weight: bold' }, reward.point_value),
              td(reward.description),
              td(date(reward.created_at).toString('MMMM dd yyyy'))
            );
          })
        ))
      );
    });
  });
};