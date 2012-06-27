with (Hasher('Blogs', 'Application')) {
 
  route('#blogs', function() {
    render(
      h1('Badger Blog'),
      div({ id: 'blog-loader' }, spinner('Loading...'))
    );

    Badger.getBlogs(function(response) {
      render({ target: 'blog-loader' }, response.data.map(function(blog) {
        var blog_body = div();
        blog_body.innerHTML = blog.body;
        return [
          h2({ 'class': 'blog-title' }, a({ href: '#blogs/' + blog.id + '-' + blog.title.replace(/ /g, '-') }, blog.title)),
          div({ 'class': 'blog-info' }, 'by ' + blog.author + ' on ' + date(blog.published_at).toString('MMMM dd yyyy')),
          blog_body
        ]
      }));
    });
  });
  
  route('#blogs/:id', function(id) {
    render('');

    Badger.getBlog(id.split('-')[0], function(response) {
      if (response.meta.status == 'ok') {
        var blog = response.data;
        var blog_body = div();
        blog_body.innerHTML = blog.body;
        render(
          h1(blog.title),
          div({ 'class': 'blog-info' }, 'by ' + blog.author + ' on ' + date(blog.published_at).toString('MMMM dd yyyy')),
          blog_body
        );
      } else {
        set_route('#blogs');
      }
    });
  });
  
}
