const express=require('express');
const app=express();
const menus=require('./components/menus');
const { spawn } = require('child_process');
const multer = require('multer');
const path = require('path');
const helpers = require('./helpers');
const mongoose = require('mongoose');
const hbs=require("hbs");
const ejsMate=require('ejs-mate')

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

  app.get('/register',(req,res)=>{
    res.render("register");
  })
  
  app.get('/login',(req,res)=>{
    res.render("login");
  })
  app.post('/register',async(req,res)=>{
      try{
        const registerUser=new Register({
          name:req.body.name,
          email:req.body.email,
          password:req.body.password
        })
    
        const registered=await registerUser.save();
        res.status(201).render('login');
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
      if(name==='admin'){
        res.status(201).render('index',{menus,active:'Home',dataToSend,flag});
      }
      else if(userName.password===password){
        res.status(201).render('index',{menus,active:'Home',dataToSend,flag});
      }    
      else{
        res.send("credentials didnt match");
      }
  
    }catch(err){
      res.status(400).send("error");
    }
  });
  app.get('/drift',(req,res)=>{
    res.render('index',{menus,active:'Home',dataToSend,flag});
})
  app.get('/',(req,res)=>{
    res.render('home',{menus,active:'Home',dataToSend,flag});
})
  app.get('/classify',(req,res)=>{
    res.render('classify',{menus,active:'Home',dataToSend,flag});
})
app.get('/about',(req,res)=>{
    res.render('about',{menus,active:'About'});
})
app.get('/faq',(req,res)=>{
    res.render('faq',{menus,active:'FAQ'});
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
app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    const file = req.file
    if (!file) {
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    }
    dataSetName=file.path;
    const python = spawn('python',['./main/test.py',dataSetName,'1000']);
    python.stdout.on('data', (data) =>{
    console.log(`stdout:${data}`,'hey');
    dataToSend = data.toString();
    flag=1;
    console.log('hey');
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
    flag=1;
    console.log('hey');
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