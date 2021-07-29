const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');


// first method we gonna create will be getCourses.this method gonna be use with 2 different routes, and its gonna do 2 different things. 1 is to get all courses, so will have specific route for that. and secondly will also have a specific route to get all courses for a specific bootcamp.

// @desc    Get courses.
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// @access  Public

exports.getCourses = asyncHandler(async (req, res, next) => {
    // phele hamain yeh dekhna hoga ke yeh bootcampId exist karti hai ya nhin. agar karti hai, toh we just gonna get the courses for the bootcamp. if not then we gonna get all of the courses.
    // agar URL main bootcampId hai toh.
    if (req.params.bootcampId) {
        const courses = await Course.find({ bootcamp: req.params.bootcampId }); // we wanna makesure that bootcamp matches the req.params.bootcampId
        // we not gonna use all the pagination and stuff if we just getting courses for the bootcamp. We only wanna use it when we getting all the courses. so this is gonna have a seperate response.
        return res.status(200).json({
            success: true,
            count: courses.length,
            data: courses
        });
    }
    // matlab agar yeh route hit hua hai GET /api/v1/courses. so we just wanna get all courses.
    else {
        res.status(200).json(res.advancedResults); // res.advancedResults ka access hai hamai kunke hum middleware use kar rhai hain. ab hum woh tamam cheezain use kar saktay hain pagination etc in courses too.
    }
});








// @desc    Get single course 
// @route   GET /api/v1/courses/:id
// @access  Public

exports.getCourse = asyncHandler(async (req, res, next) => {

    const course = await Course.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    }); // i also want to populate because i also want to show the bootcamp name and description associated with that.

    // now just make sure if its exist. 
    if (!course) {
        return next(new ErrorResponse(`No course with the id of ${req.params.id}`), 404);
    }

    res.status(200).json({
        success: true,
        data: course
    });
});












// @desc    Add a course
// @route   POST /api/v1/bootcamps/:bootcampId/courses route thora different hoga kunke remember a course is associated with a bootcamp, so we need s way to get that bootcampId
// @access  Private

exports.addCourse = asyncHandler(async (req, res, next) => {

    // so this req.body.bootcamp yeh bootcamp refer ka rha hai to the courses model main jo bootcamp hai. because we wanna submit that.
    req.body.bootcamp = req.params.bootcampId; // now we wanna submit this as a body field, because in our courses model bootcamp is an actual field. so i am gonna manually assigned req.body.bootcamp to the id which is in the url


    // just like we got bootcamp id from the params and put it in the body. Now we wanna get from the req.user.id and put that in the body.
    req.body.user = req.user.id;


    const bootcamp = await Bootcamp.findById(req.params.bootcampId);


    if (!bootcamp) {
        return next(new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`), 404);
    }


    // Now before creating a course, we wanna make sure that Bootcamp owner is the user that logged in. because remember that course is associated with the bootcamp. So you want the owner of the bootcamp to be able to add the course. Na ke yeh ke har koi add karay course ko.
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to add a course to this bootcamp ${bootcamp._id} !!!`, 401));
    }


    // create a new course.
    const course = await Course.create(req.body);


    res.status(200).json({
        success: true,
        data: course
    });
});










// @desc    Update course
// @route   PUT /api/v1/courses/:id
// @access  Private

exports.updateCourse = asyncHandler(async (req, res, next) => {

    // ab kunke hum simply update kar rhai hain course ko, toh hamain zaroorat nhin hai bootcamp ke related jannay ki.
    let course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`No course with the id of ${req.params.id}`), 404);
    }

    //Make sure that user is a course owner
    // Now before updating a course, we wanna make sure that Bootcamp owner is the user that logged in. because remember that course is associated with the bootcamp. So you want the owner of the bootcamp to be able to add the course. Na ke yeh ke har koi add karay course ko.
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this course ${course._id} !!!`, 401));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    }); // findByIdAndUpdate yeh method id lega, aur second parameter hamain kiya update karna hai, woh. which is gonna be the req.body. and third parameter main options atay hain. new ko true karaingain. kunke woh return karaiga new version of the course

    res.status(200).json({
        success: true,
        data: course
    });
});










// @desc    Delete course
// @route   Delete /api/v1/courses/:id
// @access  Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {

    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(new ErrorResponse(`No course with the id of ${req.params.id}`), 404);
    }

    //Make sure that user is a course owner
    // Now before updating a course, we wanna make sure that Bootcamp owner is the user that logged in. because remember that course is associated with the bootcamp. So you want the owner of the bootcamp to be able to add the course. Na ke yeh ke har koi add karay course ko.
    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this course ${course._id} !!!`, 401));
    }


    await course.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});