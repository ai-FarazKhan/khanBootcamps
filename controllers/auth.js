const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');


// @desc    Register a user.
// @route   POST /api/v1/auth/register.
// @access  Public

exports.register = asyncHandler(async (req, res, next) => {
    // we gonna be sending data in the body, when we make our POST request. so we need to get that.
    const { name, email, password, role } = req.body; // so hum destructuring kar rhai hain, and pull some stuff out from req.body. from body what we wanna get is the name,email, password and role.

    // Create User.
    // we are using mongoose its, return a promise, so we need to use await out Model.
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    // main abhi idhar password ko hash nhin kar rha, kunke main add karoonga a piece of middleware, so when a user is save in user model, then password will be automatically hashed there, instead of here putting it into our controller.
    // right down here what i wanna ultimately do to send back a token. 
    // but right now my goal is just to get the user register etc.

    // console.log(user);


    sendTokenResponse(user, 200, res);
});





// so now we are able to register a user, and get back the token, and token includes the user Id within the payload.

// @desc    Login user.
// @route   POST /api/v1/auth/login.
// @access  Public

exports.login = asyncHandler(async (req, res, next) => {

    // first thing i wanna do is to get the data that passed in, so we need the email and password, we gonna pull that from the req.body
    const { email, password } = req.body;

    // Validate email and password.
    if (!email || !password) {
        return next(new ErrorResponse('Please provide and email and password !!', 400));
    }

    // Check for user.
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401)); // status 401 which is unauthorized.
    }

    // ab password ko dekhnay ke validate karnay, hum body main password laingain aur usko main karaingain encrypted password se jokay database main store hai. so we gonna create model method in User model. to match the password.
    // Check if password matches.

    const isMatch = await user.matchPassword(password); // so this will be true or false.

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
});







// @desc    Logout User / clear cookies.
// @route   GET /api/v1/auth/logout
// @access  Private

exports.logout = asyncHandler(async (req, res, next) => {

    // In here what i wanna do is take that cookie and then set it to none.
    // toh hum res.cookie() use karaingain. cookie ka access hai hamain, because of the cookie parser middleware.
    // first argument main name aiga, jo bhi name diya tha cookie ka, in this case name jo diya tha humnay woh token tha. Second argument main none kardaingain. Aur phir third argument main expire kardaingain cookie ko.
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + (1000 / 10) % 60),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
});









// now what i wanna do is to create a route to get the current logged in user.
// @desc    Get current logged in user.
// @route   GET /api/v1/auth/me
// @access  Private         this is going to be private, matlab ke hamain token chahiye hoga is route ko access karnay ke liye.

exports.getMe = asyncHandler(async (req, res, next) => {
    // ab kunke hum protect route use kar rhai hain toh hamain access hoga req.user, which is always gonna be the current logged in user.
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user
    });
});







// Now i want the user the logged in user to be able to update name and email and also update there password. And these are gonna be the two separate routes.
// main chata hoon ke CRUD function for users jo ho, woh sirf admin kar sakain. Basically CRUD functionality for users which only admins can do, This is more for authentication, because it has to do with the current logged in user.
// toh main yeh functionality auth main laga rha hoon.

// @desc    Update user details.
// @route   PUT /api/v1/auth/updatedetails
// @access  Private

exports.updateDetails = asyncHandler(async (req, res, next) => {
    // We gonna use findByIdAndUpdate. But we dont wanna just pass in req.body, because then if the password is sent or a role or any other fields thats in the user model is sent, it will actually update that.
    // And we dont want that, this should just be for the name and email, so we gonna say 
    const fieldsToUpdate = {
        name: req.body.name,
        email: req.body.email
    }

    // For reminder me: yeh jo req.user.id  hai ye logged in user ki id hai.
    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: user
    });
});







// @desc    Update password.
// @route   PUT /api/v1/auth/updatepassword
// @access  Private

exports.updatePassword = asyncHandler(async (req, res, next) => {
    // Toh password ko update karnay ke liye hum user se, current password mangain gain aur new password mangain gain. Basically whats gonna happen, is we gonna send the current password and the new password in the body.

    // So first of all we gonna find the current logged in user id. But i also want the password, which by default select false.
    const user = await User.findById(req.user.id).select('+password');

    // Check current password, make sure thats true. now remember we have matchPassword method in our User model, and its asynchronous, and its returns a promise. So we wanna say if not that.
    if (!(await user.matchPassword(req.body.currentPassword))) {
        // Yeh bug theek kiya hai. Password agar match na ho toh atleast new password jo end user likhay ga woh add na karday database main, isiliye isko prevent karnay ke liye kiya hai.
        req.body.newPassword = undefined;
        next(new ErrorResponse('Password in incorrect', 401));
    }

    // So if we get the password, than we just gonna take the user object and set the password to the new password, which is gonna be in req.body.newPassword
    user.password = req.body.newPassword;

    // And then finnaly we wanna save the user.
    await user.save();


    // Now lets actually returns the token. Because if the user change the password, i just want token to be sent back. Just like when the use reset the password.
    sendTokenResponse(user, 200, res);
});








// @desc    Forgot password.
// @route   POST /api/v1/auth/forgotpassword
// @access  Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {

    // what we wanna do the first, is to get the user by the email jo kay body main sent ki gai hai. so we gonna use findOne().

    const user = await User.findOne({ email: req.body.email }); // we wanna match the email to the req.body.email

    // now we wanna check for that user. if there is no user with that email. 
    if (!user) {
        return (next(new ErrorResponse('There is no user with that email', 404)));
    }

    // Now we wanna get our reset token.
    // and we actually gonna have a method inside our user model with this name getResetPasswordToken. so that we can call that on the user itself.
    const resetToken = user.getResetPasswordToken();

    // console.log(resetToken);

    await user.save({ validateBeforeSave: false });

    // now we need to prepare somethings to pass into our sendEmail utility, one is gonna be the reset URL thats include the token.
    // Create Reset URL.
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`; // i dont just want to send the token, i also want then to have the entire URL which is gonna be /resetPassword/token. So lets get the actuall protocol http or https. This ${req.get('host') will gives us the host

    // now we wanna create a message to pass in.
    const message = `You are receiving this email because you (or someone else) hase requested the reset password. Please make a PUT request to: \n\n ${resetUrl}`;   // now this will be different, if you are using frontend with react, it would probably include a frontend link, that you would clicked to, and you would go to. But in this case, we dont have frontend application, so what we gonna do in the email, lets just say, make a specific type of request to this URL, to reset your password.


    // Now we wanna call the sendEmail function from our utility. jokay options lega, jaisa ke maine options ka parameter rakha tha sendEmail() function main.
    try {
        // user.email matlab whatever the email that send in the body from the user, which is gonna be user email, which gonna sent there 
        await sendEmail({
            email: user.email,
            subject: 'Password reset token',
            message
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        // if something goes wrong then we wanna get rid of those fields in the database, the resetPasswordToken and the resetPasswordExpire 
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false }); // we dont wanna run the validator, toh argument main likh daingain save ke.

        // and then we gonna just return an error
        return next(new ErrorResponse('Email could not be sent', 500));
    }


    res.status(200).json({
        success: true,
        data: user
    });
});








// @desc    Reset password.
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public

exports.resetPassword = asyncHandler(async (req, res, next) => {
    // First thing i wanna do is to get token from the URL, and hash it because thats what we need to match, in the database its gonna be hash
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex'); // update main pass karaingain token from the url, which is req.params.resettoken

    // So now we wanna find the user by the resettoken, and only if the expiration is greater than right now. Make sure that resetPasswordExpire greater than right now. we can use gt operator, which means greater.
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    }); // so this will gives us the user by the token.


    // check if the user exist. 
    if (!user) {
        return next(new ErrorResponse('Invalid Token !!', 400));
    }

    // if user does exits. if we found the user by the token, and the token isn't expire.
    // then lets set the new password.
    user.password = req.body.password;
    // So now i wanna set these fields resetPasswordToken and resetPasswordExpire to go to nothing undefined.
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    // so now we just need to safe the user.
    await user.save();


    sendTokenResponse(user, 200, res);
});








// Creating a custom function here, that will get token from the model, also create cookie and send response.
// parameter main kuch cheezain aigeen. like we gonna need access to the user, because we need to call getSignedToken() method. toh first parameter user hoga. Second main hamain access chahiye hoga status code ka. Third parameter main hamain response object bhi chahiye hoga.
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    // now we gonna proceed to create our cookie
    // we gonna have some options here that we gonna pass in, like we want to set the expiration of the cookie, ab expiration main same rakhna chata hoon jo config.env ki file main defined hai already. toh config.env main another variable create karaingain jiska name JWT_COOKIE_EXPIRE.
    // the date we wanna it to be expire is gonna be 30 days. ab in our config file/environment variable we just have 30. So we have to specify that this is gonna be 30 days
    // now second option main hum chatay hain ke that we only want the cookie to be accessed through the client side script. so we gonna set this to httpOnly to true
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }


    if (process.env.NODE_ENV === 'production') {
        options.secure = true; // abhi development mode main hain jabhi secure flag ko false kiya wa hai. jab production main jaingain toh true hojaiga.
    }


    // and to send the cookie you can do res.cookie. Cookie gonna takes in three things, 1 is key, matlab cookie ko kiya name daingain, maine token diya hai. and second argument main Value aigi, which is gonna be the token itself. and then the options.
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token
    }); // so we the sending the token back in the response. we also set the cookie. Now its up to the client side that how they want to handle it.
}