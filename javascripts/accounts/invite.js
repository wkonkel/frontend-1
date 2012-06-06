with (Hasher('Invite','Application')) {
  route('#invites', function() {
    var invites_h1 = function(sent_invites_count) {
      return div(a({ href: '#account'}, 'My Account'), ' » Sent Invites',
                 (sent_invites_count > 0 ? ' (' + sent_invites_count + ')' : ''));
    };
    var target_h1 = h1(invites_h1());
    var target_div = div(spinner('Loading...'));
    var target_button_area = div({ style: 'float: right; margin-top: -44px' });
    
    render(
      target_h1,
      target_button_area,
      Account.account_nav_table(target_div)
    );
    
    BadgerCache.getAccountInfo(function(response) {
      BadgerCache.getInviteStatus(function(invite_status) {
        var invites_available = response.data.invites_available;
        var domain_credits = response.data.domain_credits;
        var sent_invites_count = invite_status.data.length;
        
        if (invites_available) {
          render({ target: target_button_area }, 
            a({ 'class': 'myButton small', href: '#invites/send' }, 'Send Invite')
          );
        }
        
        var invites_refill = function () {
          return invites_available ? '' :
            p("You're currently out of invites. Please ", a({ href: '#contact_us' }, 'contact us'),
              ' for a refill!');
        };
        if (invites_available && sent_invites_count <= 0) {
          set_route('#invites/send');
        } else if (sent_invites_count > 0) {
          render({ target: target_h1 }, invites_h1(sent_invites_count));
          
          render({ target: target_div },
            table({ 'class': 'fancy-table invite-status-table' },
              tbody(
                tr(
                  th("Date"),
                  th("Name"),
                  th("Email"),
                  th({'class': 'center' }, "Credits"),
                  th({'class': 'center' }, "Accepted")
                ),

                invite_status.data.map(function(invite) {
                  return tr(
                    td(new Date(Date.parse(invite.date_sent)).toDateString()),
                    td(invite.name),
                    td(invite.email),
                    td({'class': 'center' }, invite.domain_credits),
                    invite.accepted ? td({ 'class': 'center' }, 'Yes!')
                    : invite.revoked_at ? td({ 'class': 'center' }, 'Cancelled')
                    : td({ 'class': 'center' }, 'Not yet'
                      // a({ href: curry(Invite.revoke_invite, invite.id) }, "Revoke?")
                      )
                  )
                })
              )
            ),
            invites_refill()
          )
        } else {
          render({ target: target_div }, invites_refill());
        }
      });
    });
  });

  route('#invites/send', function() {
    var target_h1 = h1(a({ href: '#account'}, 'My Account'), ' » ', a({ href: '#invites'}, 'Invites'), ' » Send Invites');
    
    var target_div = div(spinner('Loading...'));
    render(
      target_h1,
      Account.account_nav_table(target_div)
    );
    BadgerCache.getAccountInfo(function(response) {
      BadgerCache.getInviteStatus(function(invite_status) {
        var invites_available = response.data.invites_available;
        var domain_credits = response.data.domain_credits;
        var sent_invites_count = invite_status.data.length;

        if (invites_available <= 0) {
          set_route('#invites');
        } else {
          send_invite_form(target_div, domain_credits);
        }
      });
    });
  });

  define('send_invite', function(data) {
    if(data.first_name == "" || data.last_name == "" || data.invitation_email == "") {
      return $('#send-invite-messages').empty().append( error_message({ data: { message: "First Name, Last Name and Email can not be blank" } }) );
    }
    Badger.sendInvite(data, function(response) {
      BadgerCache.flush('account_info');
      BadgerCache.flush('invite_status');
      send_invite_result(response.data, response.meta.status);
      update_credits();
      // update_invites_available();  // Always on: https://www.pivotaltracker.com/story/show/30427979
      set_route("#invites");
    });
  });

  define('revoke_invite', function(invite_id) {
    Badger.revokeInvite(invite_id, function(response) {
      BadgerCache.flush('account_info');
      BadgerCache.flush('invite_status');
      set_route('#invites');
      update_credits();
      // update_invites_available();  //  Always on: https://www.pivotaltracker.com/story/show/30427979
      revoke_message(response.data, response.meta.status);
    });
  });

  define('send_invite_form', function(target_div, domain_credits) {
    render({ target: target_div },
      div({ 'class': 'sidebar' },
        info_message(
          h3('Invite Rewards'),
          p("We're working on a rewards program but in the meantime we're keeping track of your signups!")
        )
      ),
      form_with_loader({ action: send_invite, 'class': 'has-sidebar', loading_message: 'Sending invite...' },
        div({ id: 'send-invite-messages' }),
          table({ id: 'invitee-information' },
            tbody(
              tr(
                td(label({ 'for': 'first_name' }, 'First Name:')),
                td(input({ name: 'first_name', 'class': 'fancy' }))
              ),
              tr(
                td(label({ 'for': 'last_name' }, 'Last Name:')),
                td(input({ name: 'last_name', 'class': 'fancy' }))
              ),
              tr(
                td(label({ 'for': 'invitation_email' }, 'Email:')),
                td(input({ name: 'invitation_email', 'class': 'fancy' }))
              ),
              tr(
                td({ style: 'vertical-align: top' }, label({ 'for': 'custom_message' }, 'Custom Message:')),
                td(textarea({ name: 'custom_message' }))
              ),
              domain_credits > 0 ? tr(
                td(label({ 'for': 'credits_to_gift' }, "Include a Credit as a gift? ")),
                td(checkbox({ name: 'credits_to_gift', checked: 'checked', value: 1 }))
              ) : '',
              tr(
                td(),
                td({ style: 'padding-top: 20px' }, input({ 'class': 'myButton', type: 'submit', value: 'Send Invitation' })
              )
            )
          )
        )
      )
    );
  });

  define('send_invite_result', function(data, status) {
    show_modal(
      div(
        h1("Invitation Message"),
        p( { 'class': status == 'ok' ? '': 'error-message'}, data.message),
        a({ href: hide_modal, 'class': 'myButton', value: "submit" }, "Close")
      )
    );
  });

  define('revoke_message', function(data, status) {
    show_modal(
      div (
        h1("Revoke Result Message"),
        p( {'class': status == 'ok' ? '' : 'error-message'}, data.message),
        a({ href: hide_modal, 'class': 'myButton', value: "submit" }, "Close")
      )
    );
  });

}
