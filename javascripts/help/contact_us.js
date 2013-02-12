with (Hasher('ContactUs','Application')) {
 
  route('#contact_us', function() {
    render(
      h1('Contact Us'),
      
      div({ 'class': 'sidebar' },
        info_message(
          h3("Want to talk to a person?"),
          p("Call us at ", a({ href: 'tel:+14157875050' }, '+1-415-787-5050' ), br(), "If we don't answer, leave a message and we'll get back to you as quickly as possible.")
        ),
        
        info_message(
          h3("Want to send us a letter?"),
            "Badger", br(),
            "548 Market St. #80135", br(),
            "San Francisco, CA 94104-5401",
            br(),
            p(span({ style: 'font-weight: bold' }, "Postcards are great too!")
          )
        )
      ),

      form({ 'class': 'fancy has-sidebar', action: submit_email, id: 'send-contact-us-form' },
        div({ id: 'send-contact-us-form-errors' }),

        fieldset(
          label('To:'),
          span({ style: 'font-size: 18px' }, a({ href: 'mailto:support@badger.com' }, 'support@badger.com'))
        ),
        
        (!Badger.getAccessToken() ? [
          fieldset(
            label({ 'for': 'name-input' }, 'Your name:'),
            text({ name: 'name', id: 'name-input', placeholder: 'John Doe' })
          ),
        
          fieldset(
            label({ 'for': 'email-input' }, 'Your email:'),
            text({ name: 'email', id: 'email-input', placeholder: 'john.doe@badger.com' })
          ),
        ]:[]),
        

        fieldset(
          label({ 'for': 'subject-input' }, 'Subject:'),
          text({ name: 'subject', id: 'subject-input', placeholder: 'Brief description' })
        ),

        fieldset(
          label({ 'for': 'body-input' }, 'Body:'),
          textarea({ name: 'body', id: 'body-input', placeholder: 'Detailed description' })
        ),
        
        fieldset({ 'class': 'no-label' },
          input({ type: 'submit', value: 'Send', 'class': "myButton" })
        )
      )
    );
  });
  
  define('submit_email', function(form_data) {
    render({ target: 'send-contact-us-form-errors' }, '');

    Badger.sendEmail(form_data, function(response) {
      if (response.meta.status == 'ok') {
        render({ target: 'send-contact-us-form' },
          success_message("Your email has been sent!")
        );
      } else {
        render({ target: 'send-contact-us-form-errors' }, error_message(response));
      }
    });
  });

}
