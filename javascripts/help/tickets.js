// NOTE: This isn't used right now, commenting out so that it is not mistakenly referenced --- CAB

// with (Hasher('Ticket','Application')) {
// 
//   route('#tickets', function() {
//     render(
//       chained_header_with_links(
//         { text: 'My Account', href: '#account' },
//         { text: 'Support Tickets' }
//       ),
// 
//       div({ style: 'float: right; margin-top: -44px' },
//         a({ 'class': 'myButton small', href: '#tickets/create' }, 'Create a New Ticket')
//       ),
// 
//       Account.account_nav_table(div({ id: 'tickets' }, spinner('Loading...')))
//     );
// 
//     Badger.getTickets(function(response) {
//       var pending_tickets = response.data.pending_tickets;
//       var closed_tickets = response.data.closed_tickets;
// 
//       render({ target: 'tickets' },
//         (pending_tickets.length + closed_tickets.length) == 0 ? p('You have no tickets.')
//         : [ render_ticket_table('Your Pending Tickets', pending_tickets),
//             render_ticket_table('Your Closed Tickets', closed_tickets)
//         ]
//       );
//     });
//   });
//   
//   route('#tickets/create', function() {
//     render(
//       chained_header_with_links(
//         { href: '#account', text: 'My Account' },
//         { href: '#tickets', text: 'Support Tickets' },
//         { text: 'Create' }
//       ),
//       
//       
//       Account.account_nav_table(
//         div({ id: 'send-ticket-form-errors' }),
//         
//         form_with_loader({ 'class': 'fancy', style: 'margin-left: -65px', action: submit_ticket, loading_message: 'Submitting ticket...' },
//           fieldset(
//             label({ 'for': 'category' }, 'Category'),
//             select({ name: 'category' },
//               option({ disabled: "disabled" }, "Select A Field"),
//               option({ value: "Website Bug" }, "Website Bug"),
//               option({ value: "Feature Request" }, "Feature Request"),
//               option({ value: "Billing Inquiry" }, "Billing Inquiry")
//             )
//           ),
// 
//           fieldset(
//             label({ 'for': 'subject' }, 'Subject'),
//             text({ style: 'width: 75%', name: 'subject', placeholder: 'Hello, Badger!' })
//           ),
//           
//           fieldset(
//             label({ 'for': 'content' }, 'Content'),
//             textarea({ name: 'content', placeholder: 'Detailed description', style: 'font-size: 14px; height: 165px; width: 75%' })
//           ),
//           
//           // fieldset({ style: 'margin-top: 10px; line-height: 15px' },
//           //   label({ 'class': 'no-label' }),
//           //   div({ id: 'file-uploader' }, 'fdsa')
//           // ),
// 
//           fieldset({ 'class': 'no-label' },
//             input({ 'class': 'myButton', type: 'submit', value: 'Submit' })
//           )
//         )
//       )
//     );
//     
//     // attachment_field('file-uploader');
//   });
// 
//   route('#tickets/:id', function(id) {
//     render_ticket_info(id);
//   });
// 
//   route('#tickets/:id/response/:response_id', function(id, response_id) {
//     render_ticket_info(id, response_id);
//   });
//   
//   define('render_ticket_info', function(id, response_id) {
//     var ticket_info = div(spinner('Loading...'))
//     render(
//       h1('My Account » ', a({ href: '#tickets' }, 'Support Tickets'), ' » Ticket Information'),
//       div({ id: 'success-message', 'class': 'success-message hidden' }),
//       div({ id: 'error-message', 'class': 'error-message hidden' }),
//       Account.account_nav_table(ticket_info)
//     );
// 
//     Badger.getTicket(id, function(response) {
//       if (response.meta.status == 'ok') {
//         ticket = response.data;
//         render({ target: ticket_info },
//           table(tbody(
//             tr(
//               td(strong('Status: ')),
//               td(ticket.status, ' ', ticket.status == 'closed' ? '' : a({ href: curry(close_ticket, id), 'class': 'myButton small'}, "Close Ticket"))
//             ),
//             tr(
//               td(strong('Created on: ')),
//               td(format_date(ticket.created_at))
//             ),
//             tr(
//               td(strong('Updated on: ')),
//               td(format_date(ticket.updated_at))
//             ),
//             tr(
//               td(strong('Category: ')),
//               td(ticket.category)
//             )
//           )),
//           div({ 'class': 'ticket-content' }, p(
//             p(strong('Subject: '), ticket.subject),
//             display_attachments(ticket.attachments),
//             p(display_multiple_line(ticket.content))
//           )),
//           p(),
//           ticket.responses.map(function(ticket_response) {
//             return div({ 'class': 'ticket-response', id: 'response-' + ticket_response.id },
//               span(strong(ticket_response.person.name + ': ')),
//               span(display_multiple_line(ticket_response.response)),
//               display_attachments(ticket_response.attachments)
//             )
//           }),
//           ticket.status == 'closed' ? '' : response_form(id)
//         )
//       } else {
//         render({ target: ticket_info },
//           div({ 'class': 'error-message'}, response.data.message)
//         );
//       }
// 
//       if (ticket.status != 'closed') {
//         // attachment_field('response-file-uploader');
//       }
// 
//       if (response_id != null) {
//         $('#response-' + response_id).effect("highlight", {}, 3000);
//       }
//     });
//   });
// 
//   // define('attachment_field', function(id) {
//   //   document.domain = (document.location.host.split('.').slice(-2).join('.') || 'localhost');
//   //   var response_attachment_uploader = new qq.FileUploader({
//   //     // pass the dom node (ex. $(selector)[0] for jQuery users)
//   //     element: $('#' + id)[0],
//   //     // path to server-side upload script
//   //     action: Badger.api_host + 'attachments',
//   //     params: {
//   //       access_token: Badger.getAccessToken(),
//   //       upload_inside_iframe: document.domain
//   //     }
//   //   });
//   // })
// 
//   define('display_attachments', function(attachments) {
//     return attachments.length == 0 ? ''
//     : p(strong('Attachments: '), attachments.map(function (attachment) {
//       return [a({ href: attachment.url }, attachment.filename), " "]
//     }))
//   });
// 
//   define('response_form', function(id) {
//     var result = form({ id: "response-form", action: add_response },
//       div({ id: 'error-message', 'class': 'error-message hidden' }),
//       hidden({ name: 'id', value: id}),
//       textarea({ style: 'width: 98%; height: 60px; margin: 10px 0;', name: 'response' }),
//       div({ id: "response-file-uploader" }),
//       br(),
//       input({'class': 'myButton', type:'submit', value: 'Reply' })
//     );
// 
//     return result;
//   });
// 
//   define('submit_ticket', function(form_data) {
//     render({ target: 'send-ticket-form-errors' }, '');
// 
//     Badger.createTicket(form_data, function(response) {
//       if (response.meta.status == 'ok') {
//         set_route("#tickets");
//         
//         // set_route(get_route());
//         // render({ target: 'ticket-form-header' }, 'Support Ticket Created')
//         // render({ target: 'send-ticket-form' },
//         //   div('You have created a support ticket: "',
//         //       strong(form_data.subject),
//         //       '". We will review your ticket and respond to you as quickly as we can. Thank you!'
//         //   ),
//         //   div({ style: 'text-align: right; margin-top: 10px;' }, a({ href: hide_modal, 'class': 'myButton', value: "submit" }, "Close"))
//         // );[
//       } else {
//         render({ target: 'send-ticket-form-errors' }, error_message(response));
//         hide_form_submit_loader();
//       }
//     });
//   });
// 
//   define('add_response', function(form_data) {
//     if (form_data && form_data.response.trim() != '' ) {
//       Badger.addResponseTicket(form_data.id, form_data, function(response) {
//         if (response.meta.status == 'ok') {
//           set_route('#tickets/' + form_data.id + '/response/' + response.data.response_id)
//         } else {
//           $('#error-message').html(response.data.message);
//           $('#error-message').removeClass('hidden');
//         }
//       });
//     } else {
//       $('#error-message').html('Response cannot be empty');
//       $('#error-message').removeClass('hidden');
//     }
//   });
// 
//   define('close_ticket', function(id) {
//     Badger.closeTicket(id, function(response) {
//       set_route('#tickets/' + id);
//       if (response.meta.status == 'ok') {
//         $('#success-message').html(response.data.message);
//         $('#success-message').removeClass('hidden');
//         $('#error-message').addClass('hidden');
//       } else {
//         $('#error-message').html(response.data.message);
//         $('#error-message').removeClass('hidden');
//         $('#success-message').addClass('hidden');
//       }
//     })
//   });
// 
//   define('render_ticket_table', function(header, tickets) {
//     return(
//         tickets.length == 0 ? ''
//         : [
//           h2(header),
//           table({ 'class': 'fancy-table' }, tbody(
//             tr(
//               th('Subject'),
//               th('Category'),
//               th('Created on'),
//               th('Updated on'),
//               th('Status')
//             ),
//             tickets.map(function(ticket) {
//               return tr(
//                 td(a({ href: '#tickets/' + ticket.id }, ticket.subject)),
//                 td(ticket.category),
//                 td(format_date(ticket.created_at)),
//                 td(format_date(ticket.updated_at)),
//                 td(ticket.status)
//               );
//             })
//         ))]
//       );
//   });
// 
// 
//   define('format_date', function(day) {
//     var date = date(Date.parse(day));
//     return (date.getMonth() +  1) + '/' + date.getDate() + '/' + date.getFullYear() + ' ' + date.getHours() + ':' + date.getMinutes();
//   });
// 
//   define('display_multiple_line', function(text) {
//     var lines = text.split('\n')
//     return lines.map(function(line) {
//       return [span(line), br()]
//     });
//   });
// }
