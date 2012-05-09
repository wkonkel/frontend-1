with (Hasher('TermsOfService','Application')) {

  route('#terms_of_service', function() {
    var terms_list = div(spinner('Loading...'))
    render(
      h1('Terms Of Service'),
      terms_list
    );

    Badger.getTermsOfServices(function(response) {
      if (response.meta.status == 'ok')
        render({ target: terms_list },
          ul(
            response.data.map(function(term) {
              return li(a({ href: '#terms_of_service/' + term.id }, term.title));
            })
          )
        )
      else
        render({ target: terms_list }, 'Unable to load Terms of Services');
    })
  });

  route('#terms_of_service/:id', function(id) {
    var content = div(spinner('Loading...'))
    render(
      content
    )
    Badger.getTermsOfService(id, function(response) {
      if (response.meta.status == 'ok') {
        terms = response.data;
        var terms_content = div();
        terms_content.innerHTML = terms.content;
        render({ targe: content },
          h1(terms.title),
          terms_content
        );
      } else {
        render(div({ 'class': 'error-message' }, response.data.message));
      }
    });
  })
}
