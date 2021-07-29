// using express router.

const express = require('express');
const { getBootcamp, getBootcamps, createBootcamp, deleteBootcamp, updateBootcamp, getBootcampsInRadius, bootcampPhotoUpload } = require('../controllers/bootcamps')
const Bootcamp = require('../models/Bootcamp');

// Include other resource routers
const courseRouter = require('./courses');
const reviewRouter = require('./reviews');

const router = express.Router();

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth'); // ab nichay jis jis route pe protect laga wa hai. wahan wahan user has to be logged in.

// Re-route into other resource router.
router.use('/:bootcampId/courses', courseRouter); // anything that gonna have /:bootcampId if that parameter included and then courses, then we going to mount that into that  courseRouter
router.use('/:bootcampId/reviews', reviewRouter); // anything that goes to bootcampId/reviews is basically gonna be forwaded to the reviewRouter.

router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);

// remember only publisher and admin can upload photo, so we gonna put authorize here. and in the parameter we gonna pass those roles who can take these actions. Jo kay photo upload karsakain. in this case they are publishers and admin.
router.route('/:id/photo').put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

// implementing advancedResults middleware for getBootcamps method.
router.route('/').get(advancedResults(Bootcamp, 'courses'), getBootcamps).post(protect, authorize('publisher', 'admin'), createBootcamp);  // same url par get and post kar rhai hain.

router.route('/:id').get(getBootcamp).put(protect, authorize('publisher', 'admin'), updateBootcamp).delete(protect, authorize('publisher', 'admin'), deleteBootcamp);   // same url pe update and delete kar rhai hain.

module.exports = router;