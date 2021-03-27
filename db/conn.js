const mongoose=require("mongoose");

mongoose.connect('mongodb://Laz5r:mnbvmnbv@cluster0-shard-00-00.xar8w.mongodb.net:27017,cluster0-shard-00-01.xar8w.mongodb.net:27017,cluster0-shard-00-02.xar8w.mongodb.net:27017/users?ssl=true&replicaSet=atlas-a66wrv-shard-0&authSource=admin&retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).then(()=>{
  console.log('successs');
}).catch((e)=>{
  console.log('connection failed');
})
