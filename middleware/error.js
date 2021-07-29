// toh yeh hum apna custom error handle bana rhai hain. its gonna take four parameters.

const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {

    // we dont wanna send a seprate response in every if statement. toh hum error ke name aik variable banaingain, aur err jo argument main hai, uski sari propert ko copy karlaingain using spread operator.
    let error = { ...err }

    error.message = err.message;

    // log to the console for the developer.
    // console.log(err.stack); // err.stack gives us all the errors and the file info stuff like that.

    // err main sab kuch log kar rhai hain. 
    console.log(err);

    // lets console Log err.name. jab url main id ka format sahi nhin dalaingain. is case main error ki type CastError hogi, its a inproper id error.
    // console.log(err.name);

    // Mongoose bad object id. handling error for our bad oject id 
    if(err.name === 'CastError'){
        // end user ko yeh matter nhin karta ke, URL main jo id daal rhai hain woh bad formatted id hai ya woh aik aisi id hai jo formatted toh sahi hai but database main nhin hai.
        // const message = `Resource not found with id of ${err.value}`;
        const message = `Resource not found`;
        error = new ErrorResponse(message,404);  // Toh hum instead of sending the error response there in the catch statement of bootcamp.js file  which is in the controller folder, Hum woh cheez yahan handle kar rhai hain. we are doing it right here in the error handler.
    }
    

    // Mongoose Duplicate key, agar koi bootcamp add kiya, aur phir wohi bootcamp same name ke saath add kardiya, toh is error ko handle kar rhai hain.
    if(err.code === 11000) { // agar code ki key 11000 hai toh matlab ke yeh duplicate key error hai.
        const message = 'Cannot Add duplicate value records/fields ';
        error = new ErrorResponse(message,400); // so its a duplicate field, and its a bad request from client, so status will be 400 which is bad request.
    }



    // Mongoose Vlidation error, ab hum validation ka error ata hai usko handle kar rhai hain. achay style main.
    if(err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message); // extracting the messages from err.errors, because this is the array of objects that has a bunch of different fields of each object. we just want the message from it. 
        error = new ErrorResponse(message,400);
    }




    // instead of doing hardCoding we will do error.statusCode. and if for some reason if its not their 500 will be our default.
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server error'
    });
}

module.exports = errorHandler;


// since its middleware, toh isko run karnay liye app.use() lagana hoga server.js main