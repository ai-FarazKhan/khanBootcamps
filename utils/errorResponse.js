class ErrorResponse extends Error {
    // just run the method thats run when we instantiate an object from the class.
    constructor(message,statusCode){
        // the error class that we are extending, we want to call that contructor, so that we can do that with super(). and that actually has its own message property, toh hum apna message paas kardaingain ismain. 
        super(message);
        // and then we gonna create our custom property on this class called statusCode
        this.statusCode = statusCode;
    }
}

module.exports = ErrorResponse;