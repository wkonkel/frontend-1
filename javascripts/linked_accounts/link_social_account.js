// with (Hasher('SocialAccount','Application')) {
//   route("#linked_accounts/social/:site/link", function(site) {
//     
//     if (site == "facebook") {
//       var SITE_NAME            = "Facebook";
//       var LINK_ACCOUNT_IMG_SRC = "images/linked_accounts/facebook.png";
//     } else if (site == "twitter") {
//       var SITE_NAME            = "Twitter";
//       var LINK_ACCOUNT_IMG_SRC = "images/linked_accounts/twitter.png";
//     } else {
//       return render(
//         div("Oh noes!")
//       );
//     }
//     
//     var target_div = div({ style: "margin-top: 50px" },
//       div({ style: "text-align: center" }, img({ src: "images/ajax-loader.gif" }))
//     );
//     
//     render(
//       h1("Link " + SITE_NAME + " Account"),
//   
//       div({ 'class': 'sidebar' },
//         info_message(
//           h3("Why link your " + SITE_NAME + " account?"),
//           p("With a linked " + SITE_NAME + " account, you can easily share your domain registrations and transfers with your friends.")
//         )
//       ),
//       
//       div({ 'class': "fancy has-sidebar" },
//         // div({ style: "margin-left: 60px" },
//         //   p("By linking your " + SITE_NAME + " account with Badger, you will be able to share your domain registrations and transfers with your friends.")
//         // ),
//         
//         target_div
//       )
//       
//       
//     );
//     
//     Badger.getLinkedAccountAuthorizationUrl("twitter", { create_account: true }, function(response) {
//       var auth_window;
//       var auth_url = response.data;
//       
//       render({ into: target_div },
//         div({ style: "text-align: center" },
//           a({ id: "link-account-button", onclick: function() { auth_window = window.open(auth_url, "", "width=600,height=600") } },
//             img({ src: LINK_ACCOUNT_IMG_SRC })
//           )
//         )
//       )
//     });
//   });
// }
