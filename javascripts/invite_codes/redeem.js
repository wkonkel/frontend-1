with (Hasher('Redeem','Application')) {
  
  route('#free', function() {
    set_route("#");
    Signup.show_request_invite_modal("free_domain_card");
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