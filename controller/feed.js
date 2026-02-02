const {validationResult} = require("express-validator");
const fs = require("fs");
const path = require("path");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {    
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find()
    .countDocuments()
    .then((count) => {
        totalItems = count;
        return Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
    })
    .then((posts) => {
        return res.status(200).json({message: "Fetched posts Successfully.", post: posts, totalItems: totalItems})
    })
    .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.createPost = (req, res, next) => {
    const validationError = validationResult(req);
    if (!validationError.isEmpty()) {
        return res.status(422).json({message: "Validation failed, entered data is incorrect."});
    }
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.filename;
    let creator;
    if (!req.file) {
        return res.status(400).json({message: "No image provided."})
    }
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    })
    post.save()
    .then((result) => {
        return User.findById(req.userId)
    })
    .then((user) => {
        creator = user
        user.posts.push(post);
        return user.save()
    })
    .then((result) => {
        return res.status(201).json({
            message: "Post created successfully!",
            post: post,
            creator: {_id: creator._id, name: creator.name}
        });
    })
    .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then((post) => {
        console.log(post);
        if (!post) {
            return res.status(404).json({message: "Could not find post."});
        }
        
       return res.status(200).json({message: "Post fetched.", post: post});
    })
    .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

exports.updatePost = (req, res, next) => {
    const validationError = validationResult(req);
    if (!validationError.isEmpty()) {
        return res.status(422).json({message: "Validation failed, entered data is incorrect."});
    }
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.filename;
    };
    if (!imageUrl) {
        return res.status(400).json({message: "No file picked"})
    };
    Post.findById(postId) 
    .then((post) => {
        if (!post) {
           return res.status(404).json({message: "Could not find post."}); 
        }
        if (post.creator.toString() !== req.userId) {
            return res.status(401).json({message: "Not authorized"});
        }
        if (imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }
        post.title = title;
        post.content = content;
        return post.save();
    })
    .then((result) => {
        return res.status(200).json({message: "Post updated", post: result});  
    })
    .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then((post) => {
        if (!post) {
            return res.status(404).json({message: "Could not find post."});
        }
        if (post.creator.toString() !== req.userId) {
            return res.status(401).json({message: "Not authorized"});
        }
        clearImage(post.imageUrl);
        return Post.findByIdAndDelete(postId)
    })
    .then((result) => {
        return User.findById(req.userId);

    })
    .then((user) => {
        user.posts.pull(postId);
        return user.save()
    })
    .then((result) => {
        return res.status(200).json({message: "Deleting of post was successful."});   
    })
    .catch((err) => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    })
};

const clearImage = (filename) => {
    const fullPath = path.join(__dirname, "..", "images", filename);
    fs.unlink(fullPath, (err) => {
        console.log(err);
    })
}