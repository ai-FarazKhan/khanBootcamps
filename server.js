const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const fileupload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const path = require('path');
// loading env variables here.
dotenv.config({ path: './config/config.env' });

// connecting to database.
connectDB();
// const logger = require('./middleware/logger') // custom logger ki jagah hum Morgan use kar rhai, thats why i commented this.
const bootcamps = require('./routes/bootcamps') // bringing route file
const courses = require('./routes/courses') // bringing route file
const users = require('./routes/users') // bringing route file
const auth = require('./routes/auth') // bringing route file
const reviews = require('./routes/reviews') // bringing route file
const morgan = require('morgan');


const app = express();

// req.body main jo cheezain hain usko access karnay ke liye a piece of middleware bana na hoga. Body Parser.
app.use(express.json()); // toh yeh add karnay se hum server ko jaisai hi req.body karaingain toh hamain access ko body main jo cheezain hain unka.


// Cookie parser
app.use(cookieParser());


// ab jaisi hi hum koi si bhi request karaingain toh yeh middleware fucnction chalay ga. aur console par yeh likha wa aiga. middleware ran.
// any request we made, this function gonna run.
// app.use(logger);  // ab main use nhin kar apna custom logger, ab Morgan third party use kar rha hoon.


// Dev logging middleware
// ab main chata hoon ke yeh jab hi run ho jab main development environment main hoon. Toh yeh condition lagay gi.

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}



// File uploading. adding line for the middleware.
app.use(fileupload());


// Sanitizing the data, using Express Mongoose Sanitize.
app.use(mongoSanitize());


// Set security headers.
// app.use(helmet({ contentSecurityPolicy: { policy: "style-src 'self' https: 'unsafe-inline';" } }));

app.use(helmet());


// app.use(helmet.contentSecurityPolicy({
//     directives:{
//       defaultSrc:["'self'"]}}));


// app.use(
//     helmet({
//       contentSecurityPolicy: {
//         directives: {
//           ...helmet.contentSecurityPolicy.getDefaultDirectives(),
//           "script-src": ["'self'", "'unsafe-inline'", "example.com"],
//         },
//       },
//     })
//   );

// app.use(helmet.contentSecurityPolicy({
//     directives:{
//       defaultSrc:["'self'",'unsafe-inline'],
//       scriptSrc:["'self'",'code.jquery.com','maxcdn.bootstrapcdn.com'],
//       styleSrc:["'self'",'maxcdn.bootstrapcdn.com'],
//       fontSrc:["'self'",'maxcdn.bootstrapcdn.com']}}));


// app.use(
//     helmet({
//       contentSecurityPolicy: false,
//     })
//   );

// app.use(
//     helmet.contentSecurityPolicy({
//       useDefaults: false,
//       directives: {
//         "default-src": helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
//         "script-src": ["'self'","'unsafe-inline'"],
//       },
//     })
//   );



// Prevent XSS attacks.
app.use(xss());


// Rate limitting of requests
const limitter = rateLimit({
    windowMs: 10 * 60 * 1000,    // 10 mins
    max: 100
});
app.use(limitter);


// Prevent htpp param pollution
app.use(hpp());


// Enable CORS
app.use(cors()); // so now by enabling it, once we upload to a domain, and then if we create a frontend application thats runs on a different domain, then it will now be able to communicate with our API


// Set static folder.
// setting that public folder to static folder. in the express all we have to do is this
app.use(express.static(path.join(__dirname, 'public')));



// Mount routers, matlab hum /api/v1/bootcamps isko baar baar bootcamps.js ki file repeat nhin karna chahtay. bas aik baar yahan likh diya kafi hai. bootcamp.js ki file main jahan jahan yeh likha wa hai hum hata daingain.
app.use('/api/v1/bootcamps', bootcamps); // second arguments main hum /api/v1/bootcamps isko connect karna chahtay hain bootcamps.js ki file se, isiliye humnay yeh bootcamps ka variable pass kiya hai. In short we no longer need to include /api/v1/bootcamps this in bootcamps.js file. it will know automatically that, thats the routes for all of these.
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);



// agar hum errorHandler ko use karna chatay hain apnay controller methods main, toh humko isko after this use karna hoga. because middleware is executed in a linear order. if we put it before, its not gonnae catch it.
app.use(errorHandler);


const PORT = process.env.PORT || 5000;




// creating globle handler for handling unhandled promise rejection. Kunke agar testing ke liye main apna MONGO_URI main password galat dal deta hoon toh exception create hojai gi. main try/catch se solve karsata hoon db.js main, but yeh tariqa zaida effect hai.
const server = app.listen(PORT, console.log(`Server is running in ${process.env.NODE_ENV} mode on PORT ${PORT}`));
// jaisay hi unhandled rejection hogi toh main server ko close kardoonga, and just stop the application. if we get this unhandled rejection.
// handling the unhandled promise rejections.
// yahan we are listening a unhandledRejection.
process.on('unhandledRejection', (error, promise) => {
    console.log(`Error: ${error.message}`);
    // closing the server and exiting the process
    // close() takes in callback function
    server.close(() => process.exit(1)); // we wanna exit with failure thats why 1 lagaya hai. 1 means jaisa ke pata hai fail. 0 means success.
})
// so is tarhan db.js ki file neet and clean rhai gi, wahan hamain try cath use karnay ki zaroorat nhin.