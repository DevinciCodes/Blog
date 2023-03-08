//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ =require('lodash');
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');
const session = require('express-session');
const passport = require('passport');
passportLocalMongoose = require('passport-local-mongoose')
const methodOverride = require('method-override');
const { stringify } = require("querystring");
mongoose.Types.ObjectId.isValid('postId');
var moment = require('moment');

const app = express();


app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}))

mongoose.connect("mongodb://localhost:27017/blogDB", {useNewUrlParser: true});


const userSchema = new mongoose.Schema ({
    email: String,
    password: String,

});

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
})

const Post = mongoose.model("Post", postSchema);


const aboutSchema = new mongoose.Schema({
  title: String,
  content: String,

})
const About = mongoose.model("About", aboutSchema);
const homeStartingContent = "";
const aboutContent = " about zach";
const contactContent = "contact zach";


let posts = [];

//redirect home if not logged in

app.get('/', function (req,res){
  if(req.isAuthenticated()){
    res.redirect('/adminhome')

  }else{

    res.redirect('/home')
  }

})

//get home route
app.get("/home", function(req,res){


  Post.find({}, function(err,posts){
    res.render('home', {
      startingContent: homeStartingContent,
      posts: posts,
    moment: moment})
  });

});

//get about route based on authentication
app.get("/about", function(req,res){
  if(req.isAuthenticated()){
    res.render('adminabout', {about: aboutContent});

  } else{

    res.render('about', {about: aboutContent});
  }


});

//get contact route based on authentication
app.get("/contact", function(req,res){
  if(req.isAuthenticated()){
    res.render('admincontact', {contact: contactContent});

  } else{
    res.render('contact', {contact: contactContent});
  }



});

//get compose route only if authenticated

app.get("/compose", function(req,res){

  if(req.isAuthenticated()){
    res.render('admincompose',{
    })

  } else{
    res.redirect('/home')
  }

})

//post composition and redirect home

app.post("/compose", function(req,res){

  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,

  });

  post.save(function(err){
    if(!err){
      res.redirect("/adminhome");
    }
  });

});

//get read more
app.get("/posts/:postId", function(req,res){
  if(req.isAuthenticated()){


 const requestedPostId = req.params.postId;
    Post.findOne({_id: requestedPostId}, function(err, post){
      res.render("adminpost", {
        title: post.title,
        content: post.content,
        id: post._id,
        moment: moment

      })

    });

  } else{

    const requestedPostId = req.params.postId;

    Post.findOne({_id: requestedPostId}, function(err, post){
      res.render("post", {
        title: post.title,
        content: post.content,
        moment: moment
      })

    });
  }

});


//Delete post

app.delete('/posts/:postId', async function (req, res){

  try {

    await Post.findOneAndRemove({ _id: req.params.postId})
    res.redirect('/adminhome')
} catch (err) {
    console.error(err)

}

})

//Edit Post


app.get('/posts/edit/:postId', async function(req,res){
 let post = await Post.findOne({
    _id: req.params.postId
  }).lean()

  if(post){
    res.render('edit',{
      post,



    })
  }
})

//Update post

app.put('/posts/:postId', async function(req,res){



const updatedPostTitle = req.body.postTitle;
const updatedPostBody = req.body.postBody

Post.findById(req.params.postId, function(err, post){
  if(err){
    console.log(err)
  }else{
    if(post){
      post.title = updatedPostTitle;
      post.content = updatedPostBody
      post.save()
    }
  }
})
res.redirect('/adminhome')

})


//get secret login page

app.get('/login', function (req,res){

    res.render('login')
})


//get admin home if logged in
app.get('/adminhome', function(req,res){
  if(req.isAuthenticated()){

    Post.find({}, function(err,posts){
      res.render('adminhome', {
        startingContent: homeStartingContent,
        posts: posts,
        moment: moment
      })
    });

  }else{
    res.redirect('/home');
  }


})

//get register page... not in deployment

/////////Register//////////////

// app.get('/register', function(req,res){
//     res.render("register")
// });

// app.post('/register', function(req,res){

//     User.register({username: req.body.username}, req.body.password, function(err, user){
//       if(err){
//         console.log(err);
//         res.redirect('/register')
//       } else{

//         passport.authenticate('local')(req, res, function(){
//           res.redirect('/login')
//         });
//       }
//     });


//     });


//post login page redirect admin home
app.post('/login', function(req,res){

const user = new User({
  username: req.body.username,
  password: req.body.password
})

  req.login(user, function(err){
    if(err){
      console.log(err)
    } else{
      passport.authenticate('local')(req,res, function(){
        res.redirect('/adminhome')
      })
    }
  })
})




app.listen(3000, function() {
  console.log("Server started on port 3000");
});
