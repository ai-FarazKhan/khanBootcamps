// creating basic CRUD functionality before implementing authentication and all that stuff.
// bringing in the model

const path = require('path');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// here we will going to create a different methods, that will be associated with different routes.
// now we also need to export each methods. so that we can bring it in, in the routes files

// basically these are middleWare functions. toh yeh apnay argument main request and response and next lete hain.




// @desc    Create new bootcamp.
// @route   POST /api/v1/bootcamps
// @access  Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    // console.log(req.body);  // req.body ko access karnay ke liye humko middleware functionality bana ni paraygi. Toh server.js ki file main yeh karna hoga. app.use(express.json());
    // res.status(200).json({ success: true, message: 'Create New bootcamp' })
    // so when using async/await we could use try/Catch


    // humnay bootcamp model main user ko associate kardiya hai bootcamp se. Now in order to have that happen, in order for user to get inserted in into this field   user: { type: mongoose.Schema.ObjectId,ref: 'User',required: true }. We have to edit something here in the Bootcamp controller. 
    // So we are creating a bootcamp based of what is in the req.body. Ab user ki jo id hai woh zahir si baat hai ke hum body main submit nhin karaingain, thats not gonna come from the client, thats gonna come from our middleware, where we, remember we have access to that req.user
    // Add User to req.body
    req.body.user = req.user.id; // remember that req.user is the logged in user. and we want the id from that user.

    // now lets add the functionality where publisher or admin can only add one bootcamp. a publisher is someone that works for the bootcamp, that sign-ups to our website or our application. and creates a listing for there bootcamp.
    // Check for published bootcamp
    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id }); // and we wanna find it by the user. toh karli braces main hum kahain gain ke, where the user is equal to the logged in user. which is req.user.id. So that will find all bootcamps by this user, any bootcamp jo is user ne banaya ho.

    // If the user is not an admin, then they can only add one bootcamp. But if they are admin, then they can add as many as they want.
    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(new ErrorResponse(`The user with ID ${req.user.id} has already published a bootcamp !!!`, 400));
    }

    // now we want to add the data in req.body to database.
    const bootcamp = await Bootcamp.create(req.body); // ab agar is main koi aisi field hai jo hamaray model main hai toh woh database main add nhin hogi.because thats how mongoose works. This line returns promise, toh hum .then() wala tariqa bhi use karsaktay hain. but main async await use karoonga.

    // we are creating something, toh hum 201 status code use karaingain.
    res.status(201).json({
        success: true,
        data: bootcamp
    });
});




// @desc    Get All bootcamps.
// @route   GET /api/v1/bootcamps
// @access  Public
exports.getBootcamps = asyncHandler(async (req, res, next) => {

    res.status(200).json(res.advancedResults); // we have accessed to res.advancedResults this is because, this method is using that middleware.

    // res.status(200).json({ success: true, message: 'Show all bootcamps' })  // hello: req.hello yeh bhi add karsatay hain, but example ke liye hata diya maine. Ab yeh jo req.hello hamaray middle jo function hai wahan se a rha hai. When we build our authentication, hamara middleware validate karayga token ko jo bhaija gai ga, and if that token validate, than we gonna set a user on this, so it will be req.user etc, and that user will come from the database, and that wil be the currently logged in user, and then we can use that within out methods here to do certain things.
});














// @desc    Get Single bootcamp.
// @route   GET /api/v1/bootcamps/:id
// @access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        // now since we have with in this try block, we have two responses here. even though here is a if statement, its gives us the error that says, headers are already sent. when we have something like this, we have to return the first one.
        // return res.status(400).json({
        //     success: false
        // });

        // yeh jab run karayga, jab hamari id toh bilkul sahi formated hai, lekin id wrong hai. like main agar end main 6 ki jagah 7 likhdoon. {{URL}}/api/v1/bootcamps/60b91448f6f1291060c169c6
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: bootcamp
    });
    // res.status(400).json({
    //     success: false
    // });
    // next(err); // agar koi error hai toh hum express ka built in middleware bhi use karsaktay hain. its gives by default 500 status code. and renders a html page. But thats what jo hamain nhin chahiye. humko JSON data return karna hai na kay HTML. So basically hamain custom error handler bana na hai. toh aik aur middleware banatay hain error.js ke name se. 
    // so instead of just passing error like this  next(err); We actually want to create a new ErrorResponse object with a message and a status code.

    // Yeh jab chalayga jab url pe id Formated nhin hogi. i mean agar ID yeh hai {{URL}}/api/v1/bootcamps/60b91448f6f1291060c169c6adsdasdadsdads  ab yahan maine abcd likhdiya, toh is condition yeh catch wala block run karayga.
    // Now this is the format we actually wanna use, whenever we want explicitly set an errorResponse
    // next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`,404)) // 404 jaisa ke pata hai hamain ke not found.


    // res.status(200).json({ success: true, message: `Show bootcamp ${req.params.id}` }) // to access the id in the url we use req.params.id
});




// @desc    Update bootcamp.
// @route   PUT /api/v1/bootcamps/:id
// @access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    // res.status(200).json({ success: true, message: `Update bootcamp ${req.params.id}` }) // to access the id in the url we use req.params.id

    let bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id);
    // aur hamain make sure karna hai phele, ke bootcamp exits.
    if (!bootcamp) {
        // return res.status(400).json({ success: false });

        // we dont want to directly return the status. we wanna use our ErrorResponse.
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }

    // Make sure user is bootcamp owner. yani jo bhi banda bootcamp ko create karayga, toh wohi ussi cheez ka owner ho lazmi. warna usko yeh rights nhin hoon ke woh bootcamp ko update kar sakay. aur agar woh admin hai toh woh publisher ke bhi bootcamp ko update karsakta hai.
    // so this here bootcamp.user gives us the objectID of the user, and we wanna compare this to the actuall request.user.id which is a string. So we wanna turn this objectID bootcamp.user to string, before we actually try to compare this. So we gonna use the javascript method toString.
    // toh hum yeh keh rhai hain nichay if statement main ke, if the user is the owner and also not an admin, then we gonna send an error.
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this bootcamp`, 401));
    }

    bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,   // setting new to true,because when we get our response, we want the data to be the updated Data, the new data. its returns the updated bootcamp.
        runValidators: true  // and also we wanna run the mongoose validators on update. isko explicitly set kiya hai true
    }); // this method findByIdAndUpdate gonna takes the id from the url, which we can get from req.params.id. And then what we want to insert is going to be, req.body. We can add some options as a third parameter.



    // aur agar jo bootcamp hum update karna chatay hain woh exist karta hai toh.. 
    res.status(200).json({ success: true, data: bootcamp });

    // return res.status(400).json({ success: false });

});




// @desc    Delete bootcamp.
// @route   Delete /api/v1/bootcamps/:id
// @access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    // res.status(200).json({ success: true, message: `Delete bootcamp ${req.params.id}` })

    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        // return res.status(400).json({ success: false });

        // we dont want to directly return the status. we wanna use our ErrorResponse.
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }


    // Make sure user is bootcamp owner. yani jo bhi banda bootcamp ko create karayga, toh wohi ussi cheez ka owner ho lazmi. warna usko yeh rights nhin hoon ke woh bootcamp ko update kar sakay. aur agar woh admin hai toh woh publisher ke bhi bootcamp ko update karsakta hai.
    // so this here bootcamp.user gives us the objectID of the user, and we wanna compare this to the actuall request.user.id which is a string. So we wanna turn this objectID bootcamp.user to string, before we actually try to compare this. So we gonna use the javascript method toString.
    // toh hum yeh keh rhai hain nichay if statement main ke, if the user is the owner and also not an admin, then we gonna send an error.
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this bootcamp`, 401));
    }


    bootcamp.remove(); // this remove method gonna trigger that middleware, jokay humnay Bootcamp model main banaya tha. ta kay jo bootcamp delete karain toh uskay saath jo bhi courses associated hain woh bhi remove hojain.
    res.status(200).json({ success: true, data: {} });

    // return res.status(400).json({ success: false });

});






// getting bootcamps within the radius of the zipcode.
// @desc    Get bootcamps within a radius.
// @route   Get /api/v1/bootcamps/radius/:zipcode/:distance   kisi bhi city ka zipcode dalna hoga, aur distance yani ke kitnay area main app bootcamp dekhna chatay hain in number of miles.
// @access  Private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    // now ab params se zipcode aur distance pull out / nikaltay hain
    const { zipcode, distance } = req.params; // remember ke yeh sab URL se a rha hai jo end user dalayga.

    // now lets get the Latitude and longitude from the geocoder.
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // now we have to calculate the radius.
    // Calculate radius using radians. radians which is unit of measurement.
    // what we need to do here is to first get the radius of the earth. and we can get this by dividing the distance, whatever the distance is by the radius of the earth.
    // Divide distance by radius of the earth.
    // Earth radius is = 3963 miles / 6378 km

    // distance jokay humnay URL se pull kiya hai.
    const radius = distance / 3963;  // ab agar kilometer main calculate karna hai toh 6378 se divide kardaingain. but abhi miles main calculate kar rhai hain.

    // now inside find({}) we wanna find by location.
    const bootcamps = await Bootcamp.find({
        location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });


    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    });

});








// @desc    Upload Photo for the bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo      PUT request is liye hogi kunke hum update kar rhai hain bootcamp ko.
// @access  Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404));
    }


    // Make sure user is bootcamp owner. yani jo bhi banda bootcamp ko create karayga, toh wohi ussi cheez ka owner ho lazmi. warna usko yeh rights nhin hoon ke woh bootcamp ko update kar sakay. aur agar woh admin hai toh woh publisher ke bhi bootcamp ko update karsakta hai.
    // so this here bootcamp.user gives us the objectID of the user, and we wanna compare this to the actuall request.user.id which is a string. So we wanna turn this objectID bootcamp.user to string, before we actually try to compare this. So we gonna use the javascript method toString.
    // toh hum yeh keh rhai hain nichay if statement main ke, if the user is the owner and also not an admin, then we gonna send an error.
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this bootcamp`, 401));
    }


    // checking if the file is actually uploaded.
    if (!req.files) {
        return next(new ErrorResponse(`Please Upload a file !!`, 400));
    }

    // console.log(req.files.file);

    const file = req.files.file;    // req.files.file main hamara sara file data/information hoti, like md5 hash, filename, buffer etc wagera wagera.


    // Now i wanna do little bit validation. main make sure karna chata hoon ke Image jo banda upload kar rha hai woh photo hi haina.
    // Remember that file main aik cheez hoti hai, mimetype, so we wanna just test it out.
    // now main ab javasript ka method startswith use karoonga, kunke jab app ke paas jpg,png etc toh its always gonna be image/jpg etc. So i wanna see if its starts with image. instead of doing a check foreach one, swith wagera. here we save some lines of code.
    // if its doesn't startswith image
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file !!!`, 400));
    }


    // now lets check the file size, ab hum limit set karaingain, file ke size ki. toh main config.env environment variables set karaingain, aur limit set karoonga. aur file upload path bhi
    // Check file size.

    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400));
    }

    // now ab file save karnay se phele, i wanna create a custom fileName, because if someone uploads an image with the same name, then its just gonna overwrite it. Toh name ko overwrite honay se bachana hai.
    // Creating custom fileName.

    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`; // console log karnay par yeh cheez photo_${bootcamp._id} hamain yeh output degi. photo_5d725a1b7b292f5f8ceff788, now notice its does not gives us the extension, now to get the filename and extension, we gonna use the path module. 
    // Ab yeh cheez add karnay se ${path.parse(file.name).ext} hamain extension milgai file ki. Like this  photo_5d725a1b7b292f5f8ceff788.jpg
    // console.log(file.name);


    // Now ab upload karnay time agaya hai file ko.
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
        if (err) {
            console.error(err);
            return next(new ErrorResponse(`Problem with file upload !!`, 500));
        }
        // now we want to insert the file name into the database.
        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });  // in the second argument what we wanna insert is the photo, remember we have a photo field, then we wanna insert the file name.

        // and then simply send back our response.
        res.status(200).json({
            success: true,
            data: file.name
        });


    });  // mv() aik function hai jis se hum upload karatay hain files ko. now this takes a callback function in the second argument.


});
