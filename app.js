const express=require('express');
const app=express();
const menus=require('./components/menus');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const helpers = require('./helpers');
const mongoose = require('mongoose');
const hbs=require("hbs");
const ejsMate=require('ejs-mate');
const bcrypt=require('bcrypt');
const session=require('express-session')
var nodemailer = require('nodemailer');

require("./db/conn");

const Register=require("./models/register");
const { RSA_NO_PADDING } = require('constants');
const { CLIENT_RENEG_LIMIT } = require('tls');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const static_path=path.join(__dirname,"/public");
const partials_path=path.join(__dirname,"/templates");

app.use(express.json());
app.use(express.urlencoded({extended:false}));
//app.use(session({secret:'notagoodone'}))

// app.use(express.session({
//   secret: 'notagoodone',
//   path:'/',
//   proxy: true,
//   resave: true,
//   cookie: {
//     httpOnly: true,
//     expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
//     maxAge: 1000 * 60 * 60 * 24 * 7
//   },
//   saveUninitialized: true
// }));

const sessionConfig = {
  secret: 'thisshouldbeabettersecret!',
  resave: false,
  saveUninitialized: true,
  cookie: {
      httpOnly: true,
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
      maxAge: 1000 * 60 * 60 * 24 * 7
  }
}
app.use(session(sessionConfig));


app.use(express.static(static_path));
app.engine('ejs',ejsMate)
app.set('view engine','ejs');
app.set('views','./templates');
hbs.registerPartials(partials_path); 


// app.set('view engine','ejs');
// app.set('views','./templates');
var dataToSend='';
var flag=0;

app.use(express.static(__dirname));

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'main/');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
   
  var upload = multer({ storage: storage })

  const requireLogin=(req,res,next)=>{
    if(!req.session.user_id){
      return res.redirect('/login')
    }
    next();
  }


  app.use((req, res, next) => {
    //console.log(req.session)
    res.locals.currentUser = req.user;
    next();
  })

  app.get('/register',(req,res)=>{
    res.render("register");
  })
  
  app.get('/login',(req,res)=>{
    flag=3;
    res.render("login");
  })

  let usermail='';
  app.post('/register', async(req,res)=>{
      try{
        const registerUser=new Register({
          name:req.body.name,
          email:req.body.email,
          //password:req.body.password
         // usermail=req.body.email,
          password:await bcrypt.hash(req.body.password,10)
        })
        //await user.save();
        //req.session.user_id=userName._id;
       // req.session.user_id=userName._id;
        const registered=await registerUser.save();
        usermail=registerUser.email;
        console.log(registerUser.email);
        //res.status(201).render("index");
        //console.log(usermail);
        req.session.user_id=registerUser.name;
        res.status(201).render('home',{menus,active:'Home',dataToSend,flag});
        //res.send("hey fool");
       // console.log(usermail._id);   

      }
      catch(err){
        res.status(400).send(err);
      }
    })
  app.post("/login",async(req,res)=>{
    try{
      const name=req.body.name;
      const password=req.body.password;
      const userName=await Register.findOne({name});
      //const usermail=await Register.findOne({email});
      usermail=userName.email;
      console.log(userName);
      if(name==='admin'){
        res.status(201).render('index',{menus,active:'Home',dataToSend,flag});
      }
      // else if(userName.password===password){
      //   res.status(201).render('index',{menus,active:'Home',dataToSend,flag});
      // }   
      const validPassword=await bcrypt.compare(password,userName.password)
      if(validPassword){
        req.session.user_id=userName._id;
        res.status(201).render('home',{menus,active:'Home',dataToSend,flag});        
        //req.session.user_id=1;
      }
      else{
        res.send("credentials didnt match");
      }
  
    }catch(err){
      res.status(400).send("error");
    }
  });

  app.get('/logout',(req,res)=>{
    flag=0;
    req.session.user_id=null;
    res.redirect('/');
  })

  app.get('/drift',requireLogin, (req,res)=>{
    if(!req.session.user_id) res.render('login')
    res.render('index',{menus,active:'Home',dataToSend,flag});
})
  app.get('/', (req,res)=>{
    res.render('home',{menus,active:'Home',dataToSend,flag});
})
  app.get('/classify',requireLogin,(req,res)=>{
    if(!req.session.user_id) res.render('login')

    res.render('classify',{menus,active:'Home',dataToSend,flag});
})
app.get('/about', (req,res)=>{
    res.render('about',{menus,active:'About',flag});
})
app.get('/faq', (req,res)=>{
    res.render('faq',{menus,active:'FAQ',dataToSend,flag});
})

// app.get('/graph',(req,res)=>{
//     //res.render('graph',{menus,active:'Home'});
//     const python = spawn('python',['./main/D3.py','./main/myFile-1615908396914.csv','100','0.1','0.7']);
//     python.stdout.on('data', (data) =>{
//     console.log(`stdout:${data}`);
//     dataToSend = data.toString();
//     flag=1;
//     res.redirect('/');
//     });
//     python.on('close', (code) => {
//     console.log(`child process exited with the code ${code}`);
//     //res.render('graph',{menus,active:'Home'});
//     });
//     //res.render('graph',{menus,active:'Home'});
// })
let dataSetName;
//let WindowSize=1000;
app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }
    dataSetName=file.path;
   // WindowSize=document.getElementById('WindowLengthInput').value;
    var WindowSize=req.body.windowlen;
    console.log(WindowSize);
    const python = spawn('python',['./main/test.py',dataSetName,WindowSize]);
    //console.log(WindowSize);
    python.stdout.on('data', (data) =>{
    console.log(`stdout:${data}`,'hey');
    dataToSend = data.toString();
    flag=1;
    //console.log('hey');
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'miningport.dataanalyser@gmail.com',
        pass: 'nahibatana'
      }
    });
    const output = `
    <h3>${dataToSend}</h3>`;

    var mailOptions = {
      from: 'miningport.dataanalyser@gmail.com',
      to: usermail,
      subject: 'Drift detection report',
      html:output,
      attachments:[
        {
          filename:'plot.png',path:'./plot.png'
        }
      ]
    };
  
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    res.redirect('/drift');
    });
    python.on('close', (code) => {
    console.log(`child process exited with the code ${code}`);
    //res.render('graph',{menus,active:'Home'});
    });
    
  });
app.post('/uploadfile2', upload.single('myFile'), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }
    dataSetName=file.path;
    const python = spawn('python',['./main/classify.py',dataSetName]);
    python.stdout.on('data', (data) =>{
    console.log(`stdout:${data}`,'hey');
    dataToSend = data.toString();
    flag=2;
    //console.log('hey');
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'miningport.dataanalyser@gmail.com',
        pass: 'nahibatana'
      }
    });
    const output = `
    <h3>${dataToSend}</h3>`;

    var mailOptions = {
      from: 'miningport.dataanalyser@gmail.com',
      to: usermail,
      subject: 'Dataset classification report',
      html:output,
      attachments:[
        {
          filename:'class.png',path:'./class.png'
        }
      ]
    };
  
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    res.redirect('/classify');
    });
    python.on('close', (code) => {
    console.log(`child process exited with the code ${code}`);
    //res.render('graph',{menus,active:'Home'});
    });
    
  });





const PORT=process.env.PORT||3000
app.listen(PORT,()=>{
    console.log(`Running at https://localhost:${PORT}`);
})