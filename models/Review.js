const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a title for the review'],
        maxlength: 100
    },
    text: {
        type: String,
        required: [true, 'Please add some text'],
    },
    rating: {
        type: Number,
        min: 1,
        max: 10,
        required: [true, 'Please add a rating between 1 and 10'],
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    bootcamp: {
        type: mongoose.Schema.ObjectId,
        ref: 'Bootcamp',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

// The reviews are gonna be associated with the bootcamp, they also gonna be associated with the user, Jabhi bootcamp aur user ke model ko reference kiya hai schema main


// Prevent user from submitting more than one review per bootcamp.
// Ab mujhey yeh karna hai ke user sirf aik hi review likh pain for 1 bootcamp.
// And we can do this easily by adding an index, if you go to Review model, we can just add an index. on the review shcema.
// index() function object pass karaingain, with bootcamp 1and then user 1. Aur phir second parameter of options main hum Unique ko true kardain gain.
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true })




// Static method to get the average rating and save.
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
    const obj = await this.aggregate([
        {
            $match: { bootcamp: bootcampId }
        },
        {
            $group: {
                _id: '$bootcamp',
                averageRating: { $avg: '$rating' }
            }
        }
    ]);


    try {
        // Basically update the database and add that as field, so we are dealing with the bootcamp model, because thats where this average rating is gonna go.
        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageRating: obj[0].averageRating
        });
    } catch (err) {
        console.log(err);
    }
}

// Call gerAverageRating after save.
ReviewSchema.post('save', function () {
    this.constructor.getAverageRating(this.bootcamp);
});

// Call gerAverageRating before save.
ReviewSchema.pre('remove', function () {
    this.constructor.getAverageRating(this.bootcamp);
});





module.exports = mongoose.model('Review', ReviewSchema);