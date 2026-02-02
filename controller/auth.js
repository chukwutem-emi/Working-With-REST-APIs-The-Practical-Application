const User = require("../models/user");
const {validationResult} = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
    const validationError = validationResult(req);
    if (!validationError.isEmpty()) {
        return res.status(422).json({message: "You entered an invalid input", error: validationError.array()});
    }
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    try {
        const hashedPw = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPw,
            name: name
        });
        const result = await user.save();
        return res.status(201).json({message: "User created successfully!", userId: result._id});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try {
        const user = await User.findOne({email: email});
        if (!user) {
            return res.status(404).json({message: "A user with this email could not be found."});
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            return res.status(400).json({message: "Wrong password"});
        }
        const token = jwt.sign({email: loadedUser.email, userId: loadedUser._id.toString()}, process.env.SECRET_KEY, {expiresIn: "1h"});
        return res.status(200).json({token: token, userId: loadedUser._id.toString()});
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};