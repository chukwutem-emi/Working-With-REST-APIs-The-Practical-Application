const express = require("express");
const {body} = require("express-validator");
const authController  = require("../controller/auth");

const User = require("../models/user")

const router = express.Router();


router.post("/login", authController.login);
// router.get();
router.put("/signup",
    [
        body("email")
        .isEmail()
        .withMessage("Please enter a valid email.")
        .custom((value, {req}) => {
            User.findOne({email: value}).then((userDoc) => {
                if (userDoc) {
                    return Promise.reject("E-mail address already exists!");
                }
            })
        })
        .normalizeEmail(),
        body("password").trim().isLength({min: 5}),
        body("name").trim().not().isEmpty()
    ], 
    authController.signup
);
// router.delete();

module.exports = router;