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
                tr({ 'class': 'table-header' },
                  th("Date"),
                  th("Name"),
                  th("Email"),
                  th({'class': 'center' }, "Credits"),
                  th({'class': 'center' }, "Accepted")
                ),

                invite_status.data.map(function(invite) {
                  return tr(
                    td(date(invite.date_sent).toString('MMMM dd yyyy')),
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
      hide_form_submit_loader();
      return $('#send-invite-messages').empty().append( error_message({ data: { message: "First Name, Last Name and Email can not be blank" } }) );
    }
    Badger.sendInvite(data, function(response) {
      BadgerCache.flush('account_info');
      BadgerCache.flush('invite_status');
      update_credits();
      if (response.meta.status == 'ok') {
        set_route("#invites");
      } else {
        hide_form_submit_loader();
        $('#send-invite-messages').empty().append(error_message({ data: { message: response.data.message } }) );
      }
    });
  });

  define('revoke_invite', function(invite_id) {
    Badger.revokeInvite(invite_id, function(response) {
      BadgerCache.flush('account_info');
      BadgerCache.flush('invite_status');
      update_credits();
      if (response.meta.status == 'ok') {
        set_route("#invites");
      } else {
        hide_form_submit_loader();
        $('#send-invite-messages').empty().append(error_message({ data: { message: response.data.message } }) );
      }
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
      form_with_loader({ action: send_invite, 'class': 'fancy has-sidebar', loading_message: 'Sending invite...', 'style': 'margin-left: -120px' },
        div({ id: 'send-invite-messages', style: 'margin-left: 120px' }),
        
        fieldset(
          label({ 'for': 'first_name-input' }, 'Name:'),
          text({ 'class': 'short right-margin', id: 'first_name-input', name: 'first_name', placeholder: 'John' }),
          text({ 'class': 'short', name: 'last_name', placeholder: 'Doe' })
        ),
        
        fieldset(
          label({ 'for': 'email-input' }, 'Email:'),
          input({ id: 'email-input', name: 'invitation_email', style: 'width: 330px', placeholder: 'john.doe@badger.com' })
        ),
    
        fieldset(
          label({ 'for': 'custom_message' }, 'Message:'),
          textarea({ name: 'custom_message', id: 'custom_message', placeholder: 'Enter your personal message here!',
                     style: 'width: 330px' })
        ),
        
        domain_credits > 0 ? fieldset(
          label('Gift:'),
          input({ type: 'checkbox', name: 'credits_to_gift', id: 'credits_to_gift', value: 1 }),
          label({ 'class': 'normal', 'for': 'credits_to_gift' }, ' Include one of your Credits as a gift')
        ) : '',
        fieldset({ 'class': 'no-label' },
          input({ 'class': 'myButton', type: 'submit', value: 'Send invitation »' })
        )
      )
    );
  });
}
