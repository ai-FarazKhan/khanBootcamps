const mongoose = require('mongoose');

const connectDb = async() => {
    // jab hum mongoose method use kartay hain toh yeh aik promise return karta hai.
    const conn = await mongoose.connect(process.env.MONGO_URI,{
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    }); // .then() syntax bhi use karsaktay hain hum, lekin async/await use kar rhai hain which returns a promise.
    // first parameter main connection string dal diya, jo kay hamnay .env file main save kiya tha. second parameter we gonna put is gonna be some options. hum yahan bohat cheezain karsaktay hain in order to stop some warning to happening.
    // agar hum inko add nhin kartay toh hamain console main kuch warnings dikhai geen.

    // i just now wanna put in the console that we are connected. aur connection host bata rhai hain.
    console.log(`MongoDb Connected: ${conn.connection.host}`);
}

module.exports = connectDb;