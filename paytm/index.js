const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');

const app=express();
app.use(express.static(__dirname + '/views'));
app.engine('html',require('ejs').renderFile);
app.set("view engine","html");
app.set("views",__dirname+"/views");
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use('/',require('./routes/server'));
const port=1234;

app.listen(port,()=>{
    console.log("server is started")
})