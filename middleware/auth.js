// ab hum protect middleware bana rhai hain. and its use to protect routes.
// so let bring the jwt. because we need that in order to verify the token.
const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
// and then finally we need bring in the user model. because we need to look up the user by the id thats in the token.
const User = require('../models/User');



// Protect Routes.

exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // now we wanna check the headers. we wanna check for that authorization header. jokay maine add new bootcamp jo postman hai wahan uskay header main set kiya tha.
    // now we can access any headers we want with req.headers.
    // now we also wanna make sure that this header is formatted correctly. with Bearer space token.
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // hamain ab sirf token part chahiye. Bearer nhin chahiye jo token ke saath start main likha wa hai. so the way i am gonna extract the token is by turning this to an array, where bearer is the first item and the token is the second. and then i will just grab the token. so we can just use split method to do that.
        // Set token from Bearer token in header.
        token = req.headers.authorization.split(' ')[1]; // we gonna split it with the space, because its bearer space toke. and then we want the second item which is gonna be at the 1 index.
    }



    // Ab hum agar Bearer token authorization main se hata bhi dain, toh tab bhi token jo hamara hai woh cookies main set hojai ga.
    // Ab agar hamain cookies use nhin karni, hum sirf header authentication chatay karna sirf. toh is elseif ko kardena hoga bas.
    // Set token from cookie.
    // else if(req.cookies.token){
    //     token=req.cookies.token;
    // }



    
    // now we get the token from the headers. and now we wanna make sure that its actually sent
    // Make sure token is exists

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route !!', 401)); // and then its gonna be 401 which is unauthorize.
    }

    // now if the token does exist, we need to verify it.

    try {
        // Verify Token
        // ab main token main se payload ko extract karloonga.
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify method 2 cheezain leta hai. no 1 the token itself, and the secret. Remember the secret is inside the config.env file. it has to be the same secret that it was signed with.
        console.log(decoded);

        // ab yeh jo decoded object jo hai, is main id property hai. jo kay user id hai.
        // so we gonna set a new req.user value.
        req.user = await User.findById(decoded.id); // toh koi bhi id jokay token main hogi, which is the user id got by login in with correct credentials, thats gonna be pass here, and then thats gonna be set to the req.user. So req.user will always be the currently logged in user.

        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route !!', 401));
    }
});




// Grant access to specific roles.
// yeh function parameter main kuch roles lega. so i am gonna use spread operator. because whats gonna passed in here in the roles, will be the coma seprated value list of roles, like publisher coma admin or something like that.
exports.authorize = (...roles) => {
    // and then we need to return our middleware function, which is gonna have request,response and next.
    return (req, res, next) => {
        // now what i wanna do is to check to see, if the currently logged in user, which we can get with req.user. I wanna see if the role is included whats passed in here in the parameter. Agar roles include nhin hain. !roles.include.
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role ${req.user.role} is unauthorized to access this route !!`, 403)); // its gonna be 403 which is a forbidden error.
        }
        next();
    }
}