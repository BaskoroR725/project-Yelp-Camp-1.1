const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const {campgroundSchema} = require('./schema.js');
const catchAsynch = require('./utils/catchAsynch');
const ExpressError = require('./utils/expressError');
const methodOverride = require('method-override');
const Campground = require('./models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () =>{
    console.log("Database Connected")
})

app.engine('ejs', ejsMate);
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

app.set("views", path.join(__dirname, 'views'))
app.set('view engine', 'ejs');


const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

app.get('/', (req,res) =>{
    res.render("home");
});

app.get('/campgrounds', catchAsynch(async(req,res) =>{
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index", {campgrounds});
}));

app.get('/campgrounds/new', (req,res) => {
    res.render('campgrounds/new');
});

app.post('/campgrounds', validateCampground, catchAsynch(async(req,res, next) =>{ 
        /* if (!req.body.campground) throw new ExpressError('Invalid Campground Data', 400); */
        const campground= new Campground(req.body.campground);
        await campground.save();
        res.redirect(`/campgrounds/${campground._id}`)
}));

app.get('/campgrounds/:id', validateCampground, catchAsynch(async(req,res) =>{
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/show', {campground});
}));

app.get('/campgrounds/:id/edit', catchAsynch(async(req,res) =>{
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', {campground});
}));

app.put('/campgrounds/:id', catchAsynch(async(req,res) =>{
    const {id} = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground})
    res.redirect(`/campgrounds/${campground._id}`)
}));

app.delete('/campgrounds/:id', catchAsynch(async(req,res) =>{
    const {id} = req.params
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

app.all('*', (req,res,next) =>{
    next(new ExpressError('Page Not Found', 404));
});

app.use((err,req,res,next) =>{
    const{ statusCode = 500} = err;
    if (!err.message) err.message = "Oh no, Something went wrong"
    res.status(statusCode).render('error', {err})});

app.listen(3000, () =>{
    console.log('Listening on port 3000');
});