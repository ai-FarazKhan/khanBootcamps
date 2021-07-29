const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    weeks: {
        type: String,
        required: [true, 'Please add number od weeks'],
    },
    tuition: {
        type: Number,
        required: [true, 'Please add a tuition cost'],
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    scholarshipsAvailable: {
        type: Boolean,
        default: false
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

// toh ab hum relationship bana rhai hain. courses are related to bootcamps. so we need to actually add a Bootcamp as a field in our shcema. aur bootcamp ki type jo hogi woh speacial type hogi from mongoose called a objectID. phir type ke baad hamain yeh specify karna hoga ke konsay models se reference hai. in this case hamain bootcamp model se reference karna hai. aur phir akhir main required karna hai, kunke every course need to have a bootcamp.


// Creating statics method to get an average of course of tuitions
// in mongoose you have something call statics, jo kay static method hota, toh statics ko hum call kartay hain actual model pe. its defines directly on the model. yani agar hum jabhi is method ko call karaingain, toh direct dot karke call karaingain. like this. Course.goFish()
// so lets define the statics or we can se statics method. statics ko call karnay ke baad hamain jo function ka name likhna hai woh likhain gain, in this case its getAverageCost
// and this function take in the bootcampID, because its need to know, that which bootcamp we are dealing with 
courseSchema.statics.getAverageCost = async function (bootcampId) {
    // here we need to do aggregation, so we create an aggregated object, and we gonna call a method called aggregate, which return a promise, so we have to use await. we can call this right on the model so we use this.aggregate();
    const obj = await this.aggregate([
        {
            $match: { bootcamp: bootcampId }
        },
        {
            $group: {
                _id: '$bootcamp',
                averageCost: { $avg: '$tuition' }
            }
        }
    ]); // this takes in some brackets. Aur in brackets ko jo yeh argument main leta hai aggregate function, inko hum pipeline kehtay hain. so we have different steps to the pipeline. i just wanna match the bootcamp, matlab jo uper model main field hai woh, usko hum match karna chatay hain whatever the bootcamp thats passed in, means bootcampId. Phir bari ati hai group ki. So basically the object that we wanna create, the calculated object, which is gonna include the id, and the id is gonna be the bootcamp Id which is $bootcamp.  And then i also want the average cost, and the way we can get that, is by using average operator, jo kay mongoose main money sign ke saath ata ha. $avg and phir woh field jiski average coust chahiye, in this its tuition, so $avg: '$tuition'
    // after this is is done we should get an object, that has the id of the bootcamp and the average cost of the tuition

    // console.log(obj);

    // now here ab database main put karna hai average cost ko.

    try {
        // so basically we need to call the findbyIdandUpdate, because we need to update the bootcamp.
        // we need to use the bootcamp, right now we are in course now. but we can say this.model()

        await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
            averageCost: Math.ceil(obj[0].averageCost / 10) * 10
        }); // aur second main yeh leta hai ke what we wanna update. in this case its averageCost: obj, ab obj array main hai, so we gonna say obj[0].averageCost. first index and the averageCost. divide aur multiply kardaingain 10 se ta kay even number or i can say integer miljain.
    } catch (err) {
        console.log(err);
    }


}


// now we are going to calculate the course tuition for each course in the bootcamp, and then we gonna insert that as a field in the bootcamp model.
// calculate the average cost of all courses for a bootcamp.
// so we basically gonna have a few pieces of middleware thats gonna run a static function, that gonna use aggregation to be able to calculate the average cost.
// Call getAverageCost method after save.

courseSchema.post('save', function () {

    this.constructor.getAverageCost(this.bootcamp); // now on save, we actually this bootcamp field, which is the id of the bootcamp, so we just wanna pass that. with this.bootcamp

}); // hum post aur save laga rhai hain, because we wanna run this after save.



// and we also wanna call this before remove, because if we add a course or remove a course, then we want to recalculate that average cost. so it will be pre remove middleware.
courseSchema.pre('remove', function () {
    this.constructor.getAverageCost(this.bootcamp);
});





module.exports = mongoose.model('Course', courseSchema);