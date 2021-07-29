const crypto = require('crypto'); // we gonna use the core module which name is crypto, jiska ka kaam token ko generate karna aur phir usko hash karna hai
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'publisher'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});


// Adding mongoose middleware to encrypt password using bcrypt.js
UserSchema.pre('save', async function (next) {

    if (!this.isModified('password')) {
        next();
    }

    // we need to generate a salt to use that to actually hash the password, and when we call genSalt, which is the method on the bcrypt object, it returns a promise, so we need to use await.
    const salt = await bcrypt.genSalt(10,); // genSalt method ke first argument main no of rounds declare karaingain. the higher the round the more secure, but also the more heavier on your system, 10 is actually the recommended in the documentation
    this.password = await bcrypt.hash(this.password, salt);
});


// Sign JWT and return.
// static method bana rhai hain. aur name diya hai getSignedJwtToken.
// basically we just want the user id, so that when a user sends a request with the token, we know which user that is. So if we wanna get the logged in user profile, then we can look at the token, get payload part of the token, and pull out the user id and use that in the mongoose query to get that correct user. or to make sure that user belongs to the bootcamp thats trying to be updated, things like that.

UserSchema.methods.getSignedJwtToken = function () {
    // sign mehtod payload leta hai aur secret leta hai, payload main user id dalain gain. aur secret ko config file main define karaingain. this._id current user jo bhi logged in uski id hogi. aur third parameter main expires in aye, third parameter main options atay hain.
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
} // now ab is method ko apnay controller main, jahan register method wahan direct call karaingain. aur wahan jaisai koi banda register karaiga, toh token create hojaiga.


// Matching user entered password to the hashed password in database.
// in order to do this, we again need to use bcryptjs. us main aik method hota hai compare ka. that allows us to do that.
// this function gonna take in the user entered password.
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}




// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {

    // First i am gonna do is to generate the token. This will gives us the reset token.
    const resetToken = crypto.randomBytes(20).toString('hex'); // randomBytes() jo method hai iska kaam generate karna hai some random data. aur argument main number bytes batani hai, jo kay 20 likhi hain maine.  Now this will gives us the buffer, and we actually want to formate this a string. so we gonna use toString() aur iskay argument main hex likdaingain.

    // Now we want to hash the token, and set to resetPasswordToken field.
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // first parameter main batana hai ke konsa algorithm use karna hai, abhi sha256 use kar rhai hain. and then update main jo hash karna hai woh pass kardo. jaisai ke resetToken in this case. And then we just want to digest it as a string as hex

    // Set expire. 
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // we wanna set it to 10 minutes. Date.now() + 10 * 60 * 1000 this will gives us ten minutes.


    // and then we simply wanna return the orignal reset toke. not the hash version just the orignal token.
    return resetToken;
}


module.exports = mongoose.model('User', UserSchema);