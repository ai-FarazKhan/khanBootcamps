// this is gonna be a middleware function, which offcourse needs request,response and next. but it also gonna take in the Model because we dont always wanna use Bootcamp.find(), Humko reuseable bana na hai, it might bhi like review.find(), course.find() etc. Also when we want to populate it with something, those are the two things we wanna pass to this middleware function 

// take all the advance result features we have for bootcamps such as the filtering, pagination, select, limit all these kind of stuff, I want that to be availble for any resource we create. So instead of hardcoding it in the controller, lets move this to the piece of middleware, so that we can use it in any resource.

// short tariqa hai ke putting a function inside function.
const advancedResults = (model, populate) => async (req, res, next) => {

    // basically whatever we wanna do, we will gonna put here.

    // console.log(req.query);

    // koi bhi banda agar url pe koi bhi query dalay ga like this ?location.state=MA&housing=true, aur hum agar chahtay hain usko uska search milay toh, toh simply find() ke argument main req.query likhdaingain.
    // const bootcamps = await Bootcamp.find(req.query);

    // ab agar main chahoon ke koi asa course ajai jo less then or equal(lte) ho 10000 ke ya etc.
    let query;

    // {{URL}}/api/v1/bootcamps?select=name,description 
    // agar hum simply bagair kuch logic implement kiye yeh run karaingain, toh ouput kuch nhin aiga, yeh aiga ouput
    // {
    //     "success": true,
    //     "count": 0,
    //     "data": []
    // }
    // because whats its doing is that its looking at select as an actual field to match, because thats how we set it up, like we can do housing equal true. location.state = whatever.
    // so now its looking for a field called select.
    // so now we need to do is basically to create our own version of req.query and pull select out from that so that it doesn't try to match it, and then we can move on and do what we want with it.

    // so now lets make the copy of req.query. by usin spread operator. 
    //Copying req.query usin spread operator
    const reqQuery = { ...req.query };
    // now since we have our copied version of req.query in reqQuery variable toh nichay bhi isko use karaingain req.query ki jagah

    // console.log(reqQuery);

    // ab main jis fields ko nhin chahta ke jo match hoon. fields to exclude. for filtering. We dont want these to match as a fields.
    const removeFields = ['select', 'sort', 'page', 'limit']; // now anything that we dont want to match will put it in here [''] and select is one them.
    // now we want to loop ove removeFields and also we want to delete them from reqQuery.
    removeFields.forEach(param => delete reqQuery[param]); // which in this case is select, abhi filhal hum select ko remove kar rhai hain.
    // ab zara aisay hi apni reqQuery ko dekhtay hai console log karke, ke ismain hai kiya. toh empty object aiga. {} kunke humnay select ko remove kardiya hai. 

    // yahan query string banaya hai.
    let queryStr = JSON.stringify(reqQuery); // json.stringify isi liye use kiya humnay because we need it as a string to manipulate it.
    // lte wagera basically yeh sab mongoose ke operators hain. aur inko money sign matlab $ ka sign require hota hain. in order to use these kind of operators we need to put money sign $ infront of it. so basically we need to pull it out from the req.query, create our own query string basically copy it, then use the replace method  so that we can search gt/gte/lt/lte/in etc. and then put a money sign in front of it.
    // creating operators like ($gt, $lte, $gte  etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`); // replace regular expression leta hai. yeh gt wagera means greater then or equal etc. aur akhir main inkay baad jo in hai uska matlab hai which will search a list. phir end main /g lagadaingain for the globel kunke yeh na sirf first one ko dekhai balkay agar woh na milay toh next condition pe ajai. Second argument main what we wanna return is one of these jo bhi match karjain. but with money with it.

    // console.log(queryStr); // ab agar {{URL}}/api/v1/bootcamps?averageCost[lte]=10000 yeh input URL main likhaingain toh yeh output agaiga. ab money sign agaya hai. {"averageCost":{"$lte":"10000"}}

    // finding resource
    query = model.find(JSON.parse(queryStr));
    // const bootcamps = await Bootcamp.find(); // find() which will just find all bootcamps
    // now instead of awaiting Bootcamp.find() we will now simply do this.

    // console.log(req.query);

    // now we are free to use select as we want.
    // select fields.
    // so now we only wanna do this, agar select include kiya gaya hai URL main. 
    if (req.query.select) {
        // ab mongoose main koi bhi cheez apko select karni ho toh aisay kartay hain. query.select('name occupation'); Ab is main name ke baad space di gai hai, phir occupation likha hai. Jabke hum URL main name ke baad , coma use kar rhai hai. toh basically hamain name,description ko trun karna hai name descprition main. yani coma ki jagah space deni hai.

        // now data will be inside of req.query.select
        const fields = req.query.select.split(',').join(' '); // ab hamain name,description main se jo hum URL main likhaingain, ismain se , hata kar space deni hai. so thats why we use split method to turn it to array. so we are saying that jahan bhi  , ho toh split its into an array. toh ab hum yeh milay ga [ 'name', 'description' ]. Now to trun it back to string. we will add .join() to split. aur join(' ') main space dedaingain. ab yeh aisa hojaiga. name description.
        // ab simply take our qeury variable  and set it to query.select() and put fields in that.
        query = query.select(fields);

        // now we can easily select specific fields as well {{URL}}/api/v1/bootcamps?select=name,description,housing&housing=true
        console.log(fields);
    }


    // Now Sorting
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' '); // split hum isi liye kar rhai hain because we wanna it to be sort by multiple fields. and they gonna be coma seperated value.
        query = query.sort(sortBy);
    } else {
        // doing default sort
        // i want created at field to be default.for descending we use -createdAt
        query = query.sort('-createdAt');
    }

    // Pagination
    // we gonna get this from req.qeury.page but its comes in as a string, but i wanna it as a enter a number. so we gonna use parseInt. which is just a javascript function to turn it to a number.

    const page = parseInt(req.query.page, 10) || 1; // aur second parameter main parsInt radix leta hai, jokay 10 hai. and then we gonna have the default we can say 1. Toh page 1 will always gonna be the default. otherwise specify.
    const limit = parseInt(req.query.limit, 10) || 1; // || or default will gonna 100 per page. yani 100 bootcamps show hoongain aik page par. Now lets say for test purposes 100 ki jagah 1 kardete hain. 1 par page.
    //ab aik aur cheez add kar rhai hain ke. ke next page aur previous ki bhi fields show hoon. so by that way you can add next page and previous page to your frontend. phir ta kay hum easily links ko bhi add kardain. so that all stuff will be available to frontend.
    const startIndex = (page - 1) * limit; // thats where we gonna start. we can do query.skip. and we can startIndex certain amount of resources in this case bootcamps. and that will gives us correct amount of startIndex.
    const endIndex = page * limit // endIndex will actually gonna be just the page * limit.
    const total = await model.countDocuments(); // with mongoose we can await Bootcamps.countDocuments. this is the method which we use to count all the documents.

    query = query.skip(startIndex).limit(limit);

    // if something is passed into popuplate
    if(populate){
        query = query.populate(populate);
    }

    // executing our query
    const results = await query;


    // pagination result
    const pagination = {};

    // if we dont have a previous page. then i dont wanna show the previous page. and also if we dont have the next page, then also i dont wanna show the next page.
    // total is the all the bootscamps in the database.
    if (endIndex < total) {
        pagination.next = {
            page: page + 1, // current page + 1 because that will be the next page.
            limit
        };
    }
    // samething for the previous page.
    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1, // setting the page value to the page before it.
            limit
        };
    }
    // ab hum kisi bhi tarha ki search karsaktay hain like {{URL}}/api/v1/bootcamps?averageCost[gte]=10000&location.city=Boston    Or  kunke humnay in bhi dala hai regular expression main toh hum within array/list bhi search karsktay hain. like this {{URL}}/api/v1/bootcamps?careers[in]=Business     careers ke andar jo values hain woh array main hain.


    // i am now actually gonna create an object on the response object, that we can use within any routes that uses this middleware
    res.advancedResults = {
        success: true,
        count: results.length,
        pagination,
        data: results
    }


    next();

};



module.exports = advancedResults;