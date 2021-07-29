const mongoose = require('mongoose');
const slugify = require('slugify');
const geocoder = require('../utils/geocoder');

// we need to create schema for fields.

// mongoose.Schema({}) takes all the fields that we want, along with validation etc like that stuff.
// unique main jo bhi bhi bootcamp ka ho woh sab unique hoo.

const BootcampSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxLength: [50, 'Name cannot be more than 50 characters']
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxLength: [500, 'Description cannot be more than 500 characters']
  },
  website: {
    type: String,
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  phone: {
    type: String,
    maxlength: [20, 'Phone number can not be longer than 20 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point'],
      // required: true
    },
    coordinates: {
      type: [Number],
      // required: true,
      index: '2dsphere'
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String
  },

  careers: {
    // Array of strings
    type: [String],
    required: true,
    enum: [
      'Web Development',
      'Mobile Development',
      'UI/UX',
      'Data Science',
      'Business',
      'Other'
    ]
  },
  averageRating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating must can not be more than 10']
  },
  averageCost: Number,
  photo: {
    type: String,
    default: 'no-photo.jpg'
  },
  housing: {
    type: Boolean,
    default: false
  },
  jobAssistance: {
    type: Boolean,
    default: false
  },
  jobGuarantee: {
    type: Boolean,
    default: false
  },
  acceptGi: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
}); // now i wanna do a reverse populate, where we get all bootcamps, in each bootcamp i wanna show an array of courses. for this we have to use something called virtuals, we basically have to create a virtual attribute, thats not really in the collection in our database , its virtual, its basically like a mock field. But we do wanna show the courses.
// so we need to go to the Bootcamp model. and set toJSON virtuals to true and toObject virtuals to true. because what we are doing basically add a course field. but its are virtual field, or we can say virtual attribute.



// adding middleware, creating bootcamp slug from the name.
// pre() gonna run before the operation. thats what jo hamain chahiye. we want this before the document is save.

BootcampSchema.pre('save', function (next) {
  // console.log('Slugify ran', this.name); // jaisai hi hum koi new bootcamp add karaingain. console main uska name ajaiga, ke konsa bootcamp add kiya hai humnay. toh hum kisi bhi field ko access karsaktay hain.

  // so now i like to create a slug field, all we have to do is this.slug, we are refering to the slug field jo uper hai schema main, jokay string hai.
  // and i want to create that from the name field. toh slugify jo humnay install kiya tha woh use kartay hoye usmain this.name likhdaingain.

  this.slug = slugify(this.name, { lower: true }); // kunke main lower case main chata hoon sab. aur options bhi hain lke _ etc, slugify ki documentation main dekhna hoongee.

  next();
});



// GeoCode and creating location field. 
// lets create a middleware to do this.
// jaisa ke uper slugify ki tarhan hai waisa hi karaingain. pre('save').
// .geocode method is asynchronous, we not gonna use .then syntax, we gonna use async/await.
BootcampSchema.pre('save', async function (next) {

  // loc for location.
  const loc = await geocoder.geocode(this.address); // so we gonna call tha on the address. jabhi this.address.

  // this.location which refers to the location field jaisa ke pata hai. we wanna construct that as a jeojson object.
  // it has to have type and co-ordinates, kunke yeh do fields required hain. uper schema banatay waqt required kiya wa hai.
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  }


  // for the address field, the client is sending the address, and we are taking that address disecting it, geocoding it, putting this into the location field, and we have the formattedAdresss now. so we dont really need that address save in our database.
  // Do not save address in Database. we can do this simply by using this.
  this.address = undefined; // set it to undefined because that way it wont get added to the database.

  next();
});


// Cascade delete courses when a bootcamp is deleted. now i wanna do that, if we delete our bootcamp. then all of the courses associated with that bootcamp should also be deleted. So we gonna add a piece of mongoose middleware to do that. we do that in the bootcamp model.
BootcampSchema.pre('remove', async function (next) {
  console.log(`Courses being removed from bootcamp ${this._id}`);
  // we wanna call the delete many method on the course model. now we dont have to bring in the course model.
  await this.model('Course').deleteMany({ bootcamp: this._id }); // now we wanna make sure that we only delete courses that are part of the bootcamp thats beem removed. so we can specify in deleteMany parameter, we can specify bootcamp as this._id. and the reason we are accessing the field even though we are removing them is because we doing the pre.
  next();
}); // in order for this to run. this pre remove middleware, its not gonna work if we use findById and delete, which is what we actually used in our delete route in bootcamp.js file in controllers. toh ab hamain controllers main jakar bootcamp.js ki file main. and go down where we have our delete method. ab wahan Bootcamp.findByIdAndDelete use kiya hai humnay, now this is not gonna trigger our middleware. so the way we can fix this is just to simply call Bootcamp.findById,  which will get the bootcamp.and after the if statement we can just type, bootcamp.remove.


// so now we wanna create the virtual on the schema.
// This is a reverse populate with virtuals.
BootcampSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'bootcamp',
  justOne: false
}); // its takes two parameter. first ke kosni field add karni hai as a virtual, which is gonna be courses. you can call whatever you want, but courses make sense. In the second argument, hamain reference pass karna hai model ka. in this case model Course hai.

module.exports = mongoose.model('Bootcamp', BootcampSchema);