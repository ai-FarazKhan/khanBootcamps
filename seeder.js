// is file ka maqsad yeh hai ke, jab bhi agar hum chahain, toh easily poora data import karlain apnay database main.

const fs = require('fs'); // dealing with fs module is because, we gonna dealing with json files, jo kay _data folder main hain.
const mongoose =require('mongoose');
const dotenv = require('dotenv'); // because we want access to the mongoURI.

// now lets load our environment variables.
dotenv.config({ path: './config/config.env' });

// now we wanna load our models, and the only model we are dealing right now is bootcamp.
const Bootcamp = require('./models/Bootcamp');
const Course = require('./models/Course');
const User = require('./models/User');
const Review = require('./models/Review');


// lets connect to DB.
mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});


// now reading the json file.
// we need to parse the json so we gonna run json.parse();
// __dirname gives us the current directory name, and then from there we wanna go to
const bootcamps = JSON.parse(fs.readFileSync(`${__dirname}/_data/bootcamps.json`,'utf-8'));
const courses = JSON.parse(fs.readFileSync(`${__dirname}/_data/courses.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/_data/users.json`,'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/_data/reviews.json`,'utf-8'));


// now in the last we want to import this data into our database.
// Import into DB
const importData = async () => {
    try {
        await Bootcamp.create(bootcamps);
        await Course.create(courses);
        await User.create(users);
        await Review.create(reviews);
        console.log('Data Imported ..');
        process.exit();
    } catch (err) {
        console.error(err);
    }
}



// i also want to delete the data or we can also say destroy the data.
const deleteData = async () => {
    try {
        await Bootcamp.deleteMany(); // and if we dont pass anything in the argument, then its gonna delete all data.
        await Course.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data Destroyed/Deleted ! ..');
        process.exit();
    } catch (err) {
        console.error(err);
    }
}





// jaisa ke hamain pata hai ke hamaray pass two different functions hain is file main. toh jab hum call karaingain node seeder or node seeder.js, that will run the file. i wanna able to add the argument on to it, that will let it know. if we either want to import or delete.
// so we can do that by.
// process.argv[2] ka matlab yeh hai ke jab yeh command run karaingain, node seeder -i Toh basically hum yeh dekh rhai hain. -i means import. hum kuch bhi rakh saktay hain.

if(process.argv[2] === '-i'){
    // if thats true then we want to impor the data.
    importData();
} else if(process.argv[2] === '-d'){
    deleteData();
}