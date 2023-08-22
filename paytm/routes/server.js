const express=require('express');
const app=express();

const https=require("https");
const qs=require("querystring");

const checksum_lib=require('./Paytm/checksum');
const config=require('./Paytm/config');

const parseUrl=express.urlencoded({extended:false});
const parseJson=express.json({extended:false});


app.get("/",(req,res)=>{
    res.render("index");
})

app.post("/paynow",[parseUrl,parseJson],(req,res)=>{
    var paymentDetails={
        amount:req.body.amount,
        coustomerId:req.body.name.replace(/\s/g,''),
        coustomerEmail:req.body.email,
        coustomerPhone:req.body.phone
    }

    if(!paymentDetails.amount || !paymentDetails.coustomerId ||!paymentDetails.coustomerPhone || !paymentDetails.coustomerEmail){
        res.status(400).send("paymentFailed");
    }else{
        var params={};
        params['MID']=config.PaytmConfig.mid;
        params['WEBSITE']=config.PaytmConfig.website;
        params['CHANNEL_ID']='WEB';
        params['INDUSTRY_TYPE_ID']="Retail";
        params['ORDER_ID']="TEST_"+new Date().getTime();
        params['CUST_ID']=paymentDetails.coustomerId;
        params['TXN_AMOUNT']=paymentDetails.amount;
        params['CALLBACK_URL']='http://localhost:1234/callback';
        params['EMAIL']=paymentDetails.coustomerEmail;
        params['MOBILE_NO']=paymentDetails.coustomerPhone
    }

    checksum_lib.genchecksum(params,config.PaytmConfig.key,function(err,checksum){
        var txn_url="https://securegw-stage.paytm.in/theia/processTransaction";
    })
})

app.post("/callback",(req,res)=>{
    var body='';

    req.on('data',function(data){
        body+=data;
    })

    req.on('end',function(){
        var html="";
        var post_data=qs.parse(body);

        // received parametre in call back
        console.log("callback response",post_data);

        // verify the check sum
        var checksumhash=post_data.CHECKSUMHASH;
        console.log(checksumhash);

        // delete post_data.CHECKSUM
        var result=checksum_lib.verifychecksum(post_data,config.PaytmConfig.key,checksumhash)
        console.log("checksum result=>",result);


        var params={"MID":config.PaytmConfig.mid,"ORDERID":post_data.ORDERID};

        checksum_lib.genchecksum(params,config.PaytmConfig.key,function(err,checksum){
            params.CHECKSUMHASH=checksum;
            post_data = JSON.stringify(params);


            var options={
                hostname: 'securegw-stage.paytm.in',
                port: 443,
                path: '/merchant-status/getTxnStatus',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': post_data.length
                }
            };

            // Set up the request
            var response = "";
            var post_req = https.request(options, function(post_res) {
                post_res.on('data', function (chunk) {
                    response += chunk;
                });

                post_res.on('end', function(){
                    console.log('Response: ', response);

                    var _result=JSON.parse(response);
                    if(_result.STATUS=='TXN_SUCCESS'){
                        res.send("sucess");
                    }else{
                        res.send("failed");
                    }
                });
            });

            post_req.write(post_data);
            post_req.end();
        })
    })
})

module.exports=app;