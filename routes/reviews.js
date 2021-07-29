const express = require('express');
const { getReviews, getReview, addReview, updateReview, deleteReview } = require('../controllers/reviews');
const Review = require('../models/Review');
const router = express.Router({ mergeParams: true }); // because we are mergin the URL params.
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth'); // ab nichay jis jis route pe protect laga wa hai. wahan wahan user has to be logged in.

// using advancedResults middleware with getCourses method.
router.route('/').get(advancedResults(Review, {
    path: 'bootcamp',
    select: 'name description'
}), getReviews).post(protect, authorize('user', 'admin'), addReview); // The only people that should be able to write a review should be User or admins only, not publishers. jabhi authorize ke argument main user and admins pass kiya hai.


router.route('/:id').get(getReview).put(protect, authorize('user', 'admin'), updateReview).delete(protect, authorize('user', 'admin'), deleteReview);

module.exports = router;