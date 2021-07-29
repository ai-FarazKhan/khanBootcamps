const express = require('express');
const { getUser, getUsers, updateUser, createUser, deleteUser } = require('../controllers/users');
const User = require('../models/User');
const router = express.Router({ mergeParams: true }); 
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');


// We wanna use protect and authorize for all our routes. so bajai iskay ke har route pe lagain. we can actually put right above the router. Like this.
router.use(protect); //  So any thing below this, is gonna use protect. And we wanna use same with authorize.
router.use(authorize('admin')); //  So any thing below this, is gonna use authorize.


router.route('/').get(advancedResults(User),getUsers).post(createUser);
router.route('/:id').get(getUser).put(updateUser).delete(deleteUser);



module.exports = router;