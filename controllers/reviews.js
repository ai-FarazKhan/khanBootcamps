const Review = require('../models/Review');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Bootcamp = require('../models/Bootcamp');



// @desc    Get reviews.
// @route   GET /api/v1/reviews
// @route   GET /api/v1/bootcamps/:bootcampId/reviews
// @access  Public

exports.getReviews = asyncHandler(async (req, res, next) => {
    if (req.params.bootcampId) {
        const reviews = await Review.find({ bootcamp: req.params.bootcampId });
        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    }
    else {
        res.status(200).json(res.advancedResults);
    }
});












// @desc    Get single review.
// @route   GET /api/v1/reviews/:id
// @access  Public

exports.getReview = asyncHandler(async (req, res, next) => {
    const review = await Review.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    }); // mujhey bootcamp ka name aur description bhi chahiye jabhi populate kar rha hoon is result ke saath.

    if (!review) {
        return next(new ErrorResponse(`No review found with the id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: review
    });
});









// @desc    Add review.
// @route   POST /api/v1/bootcamps/:bootcampId/reviews
// @access  Private     Offcourse you have to be logged in, in order to add a review. And you also have to be a user, so we gonna need to add the authorized middleware for this.

exports.addReview = asyncHandler(async (req, res, next) => {

    // So sab se phele hamain bootcamp id dalna hogi, ke apko kis bootcamp ka review karna hai, uskay liye bootcamp ki ID chahiye hogi.
    // We need to add the ID, the bootcamp id, thats in the URL to  the data where we are submitting.
    req.body.bootcamp = req.params.bootcampId;

    // We also need the users. we gonna get the logged in user from the req.user.id
    req.body.user = req.user.id;

    const bootcamp = await Bootcamp.findById(req.params.bootcampId);

    if (!bootcamp) {
        return next(new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`, 404));
    }

    const review = await Review.create(req.body);

    res.status(201).json({
        success: true,
        data: review
    });
});










// @desc    Update review.
// @route   PUT /api/v1//reviews/:id
// @access  Private

exports.updateReview = asyncHandler(async (req, res, next) => {

    let review = await Review.findById(req.params.id);

    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.id}`, 404));
    }

    // Before updating the review, we need to make sure that the review belongs to the user. or user is an admin. Admin can edit anything on the site/API.
    // now we wanna check the user. now remember this is gonna be an object id, and we wanna change this to string so that we do comparasion. if its not equal to the logged in user id. and role is not equal to an admin.
    if (review.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update review.`, 401));
    }

    review = await Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        data: review
    });
});










// @desc    Delete review.
// @route   DELETE /api/v1//reviews/:id
// @access  Private

exports.deleteReview = asyncHandler(async (req, res, next) => {

    const review = await Review.findById(req.params.id);

    if (!review) {
        return next(new ErrorResponse(`No review with the id of ${req.params.id}`, 404));
    }

    // Before deleting the review, we need to make sure that the review belongs to the user. or user is an admin. Admin can edit anything on the site/API.
    // now we wanna check the user. now remember this is gonna be an object id, and we wanna change this to string so that we do comparasion. if its not equal to the logged in user id. and role is not equal to an admin.
    if (review.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(new ErrorResponse(`Not authorized to update review.`, 401));
    }

    await review.remove();

    res.status(200).json({
        success: true,
        data: {}
    });
});