with (Hasher('Share','Application')) {
  
  route('#linked_accounts/share/:domain_name', function(domain_name) {
    var target_div = div({ 'class': 'fancy has-sidebar' }, spinner('Loading...'));
    
    render(
      h1(a({ href: '#domains' }, 'My Domains'), ' » ', a({ href: '#domains/' + domain_name }, domain_name.toLowerCase()), ' » Share'),
      
      div({ 'class': 'sidebar' },
        info_message(
          h3('Spread the Word!'),
          p('Let your friends know about the great domain you now control at Badger.')
        )
      ),
      
      target_div
    );
    
    BadgerCache.getLinkedAccounts(function(response) {
      var linked_accounts = (response.data||[]).filter(function(linked_account) {
        return linked_account.status && linked_account.status == 'linked';
      });
      
      render({ into: target_div }, linked_accounts_form(domain_name, linked_accounts));
      
      hide_form_submit_loader();
    });
  });
  
  define('linked_accounts_form', function(domain_name, linked_accounts) {
    var linked_accounts_form = form_with_loader({ 'class': 'fancy', action: share_message, loading_message: 'Submitting message...' },
      div({ id: 'response-messages' }),
      
      fieldset({ 'for': 'content' },
        label({ 'for': 'content' }, 'Message:'),
        textarea({ id: 'message-content', name: 'content', style: 'height: 75px; width: 350px' }, 'I now manage ', domain_name, ' with @Badger! https://www.badger.com')
      ),
      
      fieldset({ style: 'line-height: 20px; margin-top: 10px' },
        label('Share to:'),
        
        (linked_accounts || []).length > 0 ? [
          my_linked_accounts_table(linked_accounts)
        ] : [
          p("You have not linked a Facebook or Twitter account. ", a({ href: '#linked_accounts' }, "Add one now!")),
        ]
      ),
      
      fieldset({ 'class': 'no-label' },
        submit({ name: 'submit', value: 'Share' })
      )
    );
    
    return linked_accounts_form;
  });
  
  define('my_linked_accounts_table', function(linked_accounts) {
    return table({ style: 'width: 250px' }, tbody(
      tr(
        th({ style: 'width: 5%' }),
        th({ style: 'width: 20%' }),
        th({ style: 'width: 75%' })
      ),

      (linked_accounts || []).map(function(linked_account) {
        if (!linked_account.status || linked_account.status != 'linked') return;
        if (linked_account.site.match(/facebook/i)) {
          return linked_account_row(linked_account);
        } else if (linked_account.site.match(/twitter/i)) {
          return linked_account_row(linked_account);
        }
      })
    ));
  });
  
  define('linked_account_row', function(linked_account) {
    return tr(
      td(input({ type: 'checkbox', value: linked_account.id })),
      td({ 'class': 'clickable', onclick: curry(check_box_for_linked_account, linked_account) }, icon_for_account(linked_account)),
      td(span({ 'class': 'clickable', onclick: curry(check_box_for_linked_account, linked_account) }, linked_account.login))
    );
  });
  
  define('check_box_for_linked_account', function(linked_account) {
    var checkbox = $("input[value=" + linked_account.id + "]");

    // toggle checkbox
    checkbox.attr('checked', !checkbox.attr('checked'));
  });
  
  define('icon_for_account', function(linked_account) {
    if (linked_account.site == 'facebook')
      var image_src = 'images/apps/facebook.png';
    else if (linked_account.site == 'twitter')
      var image_src = 'images/apps/twitter.png';
    
    return span({ style: 'text-align: center; margin: 5px' },
      img({ 'class': 'app_store_icon', src: image_src, style: 'width: 30px; height: 30px; margin: 5px auto auto auto; border-radius: 10%' })
    );
  });
  
  define('share_message', function(form_data) {
    var linked_account_ids = [];
    $(':checked').map(function() { linked_account_ids.push(this.value) });
    linked_account_ids = linked_account_ids.join(',');
    
    Badger.shareMessage(linked_account_ids, form_data.content, function(response) {
      if (response.meta.status == 'ok') {
        render({ into: 'response-messages' },
          success_message('Your message has been submitted, and should be published shortly.')
        )
      } else {
        render({ into: 'response-messages' },
          error_message(response)
        )
      }
      
      hide_form_submit_loader();
    });
  });
  
};


// with (Hasher('Share','Application')) {
//  define('perform_share_registration', function(domain_name, callback) {
//    $("input[name$=-account-id]:checked").each(function() {
//       Badger.shareDomainRegistration(this.value, domain_name, hide_share_messages, function(response) {
//         console.log("share registration response", response);
//       });
//    });
// 
//    var hide_share_messages = $("input[name=hide-share-messages]").attr('checked') != undefined;
//    
//    if (hide_share_messages) {
//       Badger.changeHideShareMessages("true");
//      after_hide_share_messages_submitted();
//    } else {
//      $("input[name$=-account-id]:checked").length == 0 ? (callback ? callback() : hide_modal()) : after_submit_share(callback);
//    }
//  });
//  
//  define('perform_share_bulk_registration', function(domain_name, num_domains, hide_share_messages, callback) {
//    $("input[name$=-account-id]:checked").each(function() {
//      Badger.shareDomainBulkRegistration(this.value, domain_name, num_domains, function(response) {
//        console.log("share bulk registration response", response);
//      });
//    });
//    
//    var hide_share_messages = $("input[name=hide-share-messages]").attr('checked') != undefined;
//    
//    if (hide_share_messages) {
//       Badger.changeHideShareMessages("true");
//      after_hide_share_messages_submitted();
//    } else {
//      $("input[name$=-account-id]:checked").length == 0 ? (callback ? callback() : hide_modal()) : after_submit_share(callback);
//    }
//  });
//  
//  define('perform_share_transfer', function(num_domains, hide_share_messages, callback) {
//    $("input[name$=-account-id]:checked").each(function() {
//      Badger.shareDomainTransfer(this.value, num_domains, function(response) {
//        console.log("share transfer response", response);
//      });
//    });
//    
//    var hide_share_messages = $("input[name=hide-share-messages]:checked").length > 0;
//    
//    if (hide_share_messages) {
//       Badger.changeHideShareMessages("true");
//      after_hide_share_messages_submitted();
//    } else {
//      $("input[name$=-account-id]:checked").length == 0 ? (callback ? callback() : hide_modal()) : after_submit_share(callback);
//    }
//  });
//  
//  define('after_submit_share', function(callback) {
//    return show_modal(
//      h1("Content Submitted"),
//      p("Awesome! The message has been submitted, and should show up in a moment."),
//      br(),
//       a({ 'class': "myButton", style: "float: right; margin-top: -25px", href: callback ? callback : hide_modal }, "Close")
//    );
//  });
//  
//  define('after_hide_share_messages_submitted', function(callback) {
//    return show_modal(
//      h1("Share Messages Hidden"),
//      p("Got it, we won't show these messages to you anymore!"),
//      p("If you would like to enable them again in the future, you can do so through the ", b("Linked Accounts"), " tab, located under ", b("My Account.")),
//      br(),
//       a({ 'class': "myButton", style: "float: right; margin-top: -25px", href: callback ? callback : hide_modal }, "Close")
//    );
//  });
//  
//  
//  
//  define('show_share_modal_base', function(header, message, content, share_action, callback) {
//    var modal = show_modal(
//      div({ id: "share-modal-content", style: "height: 230px" })
//    );
//    
//    start_modal_spin();
//    
//    Badger.accountInfo(function(response) {
//      if (response.data.hide_share_messages) {
//        hide_modal();
//      } else {
//        start_modal_spin("Loading linked accounts...");
// 
//        // load linked accounts, then sub them in
//        Badger.getLinkedAccounts(function(response) {
//          // get just the social accounts
//          var accounts = [];
//          response.data.forEach(function(a) { if (a.site == "twitter" || a.site == "facebook") accounts.push(a) });
//          
//          stop_modal_spin();
//      
//          $("#share-modal-content").attr('style','').empty().append(
//            h1(header),
//            content,
//        
//            accounts.length == 0 ? [
//              div({ style: "margin-top: 20px" },
//                b("You haven't linked any accounts yet! "),
//                ul(
//                  li(a({ href: curry(TwitterAccount.show_link_accounts_modal, curry(Share.show_share_modal_base, header, message, content)) }, "Link Twitter Account")),
//                  li(a({ href: curry(FacebookAccount.show_link_accounts_modal, curry(Share.show_share_modal_base, header, message, content)) }, "Link Facebook Account"))
//                )
//              )
//            ] : [
//              table( tbody(
//                tr(
//                  td({ width: "40%" },
//                    div({ 'class': "info-message" },
//                      table({ 'class': "fancy-table" }, tbody(
//                        tr({ 'class': "table-header" },
//                          th("Linked Accounts"), th("")
//                        ),
//                        accounts.map(function(account) {
//                          if (account.status == "linked") {
//                            return tr(
//                              td(account.site.capitalize_first()),
//                              td(input({ type: "checkbox", name: (account.site + "-account-id"), value: account.id }))
//                            )
//                          }
//                        })
//                      ))
//                    )
//                  ),
//                  td({ width: "5%" }, ""),
//                  td({ width: "100%" }, preview_message(message))
//                )
//              )),
//            ],
//        
//            div({ style: "float: right; margin-top: -30px" },
//              span({ style: "margin-right: 10px" }, input({ type: "checkbox", name: "hide-share-messages" }), "Don't show this to me again"),
//              a({ 'class': "myButton myButton", href: curry(share_action, callback) }, "Continue")
//            )
//          );
//        });
//      }
//    })
//    
//    return modal;
//  });
//  
//  define('preview_message', function(message) {
//    return div({ style: "margin-top: -30px" },
//      b("Preview: "),
//      p({ id: "message-preview" }, "\"" + message + "\"")
//    );
//  })
//  
//  define('show_share_registration_modal', function(domain_name, callback) {
//    return show_share_modal_base("Share Registration", ("I just registered " + domain_name + " on Badger!"),
//      div(
//        p({ style: "margin-bottom: 10px" }, "Woohoo, you just registered ", b(domain_name), "! Would you like to tell this to your friends, and help spread the word about Badger?")
//      ),
//      curry(perform_share_registration, domain_name),
//      callback
//    );
//  });
//  
//  define('show_share_bulk_registration_modal', function(domain_name, num_domains, callback) {
//    return show_share_modal_base("Share Bulk Registration", ("I just registered " + domain_name + ", as well as " + (num_domains - 1) + " other " + (num_domains.length > 1 ? "domains" : "domain") + ", to Badger!"),
//      div(
//        p("Whoa, you registered quite a few domains there! Would you like to inform your friends of your recent domain conquest?")
//      ),
//      curry(perform_share_bulk_registration, domain_name, num_domains),
//      callback
//    );
//  });
//  
//  define('show_share_transfer_modal', function(num_domains, callback) {
//    return show_share_modal_base("Share Transfer", ("I just transfered " + num_domains + (num_domains.length > 1 ? " domains" : " domain") + " to Badger!"),
//      div(
//        p("Your domains are now enjoying themselves here at Badger! Your friends would think very highly of you knowing that you provide your domains with such a great home, wouldn't you like to tell them?")
//      ),
//      curry(perform_share_transfer, num_domains),
//      callback
//    );
//  });
//  
// };