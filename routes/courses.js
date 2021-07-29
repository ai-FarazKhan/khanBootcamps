const express = require('express');
const { getCourses, getCourse, addCourse, updateCourse, deleteCourse } = require('../controllers/courses');
const Course = require('../models/Course');
const router = express.Router({ mergeParams: true }); // because we are mergin the URL params.
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth'); // ab nichay jis jis route pe protect laga wa hai. wahan wahan user has to be logged in.

// using advancedResults middleware with getCourses method.
router.route('/').get(advancedResults(Course, {
    path: 'bootcamp',
    select: 'name description'
}), getCourses).post(protect, authorize('publisher', 'admin'), addCourse);
router.route('/:id').get(getCourse).put(protect, authorize('publisher', 'admin'), updateCourse).delete(protect, authorize('publisher', 'admin'), deleteCourse);



module.exports = router;