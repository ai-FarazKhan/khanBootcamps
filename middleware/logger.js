// middleware are functions that have access to request and response cycle.and runs during that cycle.

// @desc    Logs request to console
// const logger = (req, res, next) => {
//     //req.hello = 'hello world'; // since we create a variable hello on this req object, now we have access to this within our routes. controllers main jakar is variable ko catch kartay hain. 
//     // console.log('middlewar ran');  // in every piece of middleware jo app banatay hain. we need to call next(), so that its knows ke ab next piece of middleware main move hona ha in the cycle.
    
//     console.log(`${req.method} ${req.protocol}://${req.get('host')}${req.originalUrl}`) // now i wanna show the method jisko hit kiya hai, aur konsi URL pe, req.protocoll means http. and then we will put :// then will have access to the host.

//     next()
// }


// module.exports = logger;