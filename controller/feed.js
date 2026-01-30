exports.getPosts = (req, res, next) => {
    res.status(200).json({
        post: [{title: "first post", content: "This is the first post!"}]
    })
};

exports.createPost = (req, res, next) => {
    // create post in db
    const title = req.body.title;
    const content = req.body.content;
    res.status(201).json({
        message: "Post created successfully!",
        post: {id: new Date().toISOString(), title: title, content: content}
    });
};