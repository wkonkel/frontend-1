with (Hasher('Redeem','Application')) {
  
  route('#free', function() {
    render(
      div(
        h1('Create Badger Account'),

        div({ 'class': 'sidebar' },
          info_message(
            h3("Already have an account?"),
            div({ 'class': 'centered-button' } , a({ href: '#account/login', 'class': 'myButton small' }, "Login"))
          )
        ),

        form({ 'class': 'fancy has-sidebar', action: submit_promotional_code },
          div({ id: 'signup-errors' }),
          
          div({ style: "text-align: center" },
            img({ src: 'images/v2/happybadger.png' })
          ),
      
          fieldset(
            label({ 'for': 'code-input' }, 'Promotional Code:'),
            text({ name: 'code', id: 'code-input', placeholder: 'OMGBADGER' })
          ),

          fieldset({ 'class': 'no-label' },
            submit({ value: 'Continue »' })
          )
        )
      )
    );

    $('input[name="code"]').focus();
  });

  define('submit_promotional_code', function(form_data) {
    Badger.setInviteCode(form_data.code);
    set_route('#account/create');
  });
  
};







// with (Hasher('Redeem','Application')) {
//   
//   route('#free', function() {
//     if (!Badger.getAccessToken()) {
//       // make a Badger API call that requires auth to require auth for user
//       Badger.accountInfo();
//     } else {
//       render(
//         h1("Redeem Code"),
// 
//         div({ 'class': "sidebar" },
//           info_message(
//             h3("Woohoo! Free domains!"),
//             p("Redeem codes here to add domain credits to your account, then you can register or transfer domains."),
//             p("Thanks for using Badger!")
//           )
//         ),
// 
//         div({ 'class': "fancy has-sidebar" },
//           div({ style: "text-align: center; margin: 30px auto 10px auto" },
//             img({ src: "images/v2/happybadger.png" })
//           ),
// 
//           form({ 'class': "fancy", action: submit_promotional_code },
//             div({ id: 'errors', style: "margin: auto 178px auto 219px" }),
// 
//             fieldset(
//               label({ 'for': "code" }, "Code:"),
//               text({ name: "code", placeholder: "abc123" })
//             ),
// 
//             fieldset({ 'class': "no-lable" },
//               submit({ value: 'Submit' })
//             )
//           )
//         )
//       );
//     }
//   });
//   
//   define('submit_promotional_code', function(form_data) {
//     Badger.redeemCode(form_data, function(response) {
//       console.log(response);
//       
//       if (response.meta.status == 'ok') {
//         
//       } else {
//         $("#errors").html(
//           error_message(response.message)
//         );
//       }
//     });
//     
//   });
//   
// };