require("dotenv").config();
const express =require('express');
const app = express();

const port = process.env.PORT || 3002

app.listen(port,console.log(`rinning at ${port}`));

const aws = require("aws-sdk");

const multer = require("multer");
const multerS3 = require("multer-s3");

aws.config.update({
    secretAccessKey:process.env.ACCESS_SECRET,
    accessKeyId:process.env.ACCESS_KEY,
    region:process.env.REGION
})

const BUCKET = process.env.BUCKET;
const s3 = new aws.S3();

const upload = multer({
    stoarge :multerS3({
        bucket:BUCKET,
        s3:s3,
        acl:"public-read",
        key:(req,file,cb)=>{

            cb(null,file.originalname);
        }

    })
})

app.post("/upload",upload.single("file"),(req,res)=>{
    console.log("hirint the api")
    console.log(req.file)
    const file = req.file;
    const key = file.originalname;
    s3.putObject({
       Bucket: BUCKET,
       Key: key,
       Body: file.buffer
    }).promise()
    .then(()=>{
        res.send('successfully upload'+ key + ' location')
    })
    .catch((err)=>{
        console.log(err);
        res.send('error uploading file');
    })
})

app.get("/list",async(req,res)=>{
    let r= await s3.listObjectsV2({Bucket:BUCKET}).promise()
    let x= r.Contents.map(item => item.Key);
    res.send(x)
})

app.get("/download/:filename",async(req,res)=>{
    const filename = req.params.filename
    let x=await s3.getObject({Bucket:BUCKET,Key:filename}).promise();
    res.send(x.Body);
})

app.delete("/delete/:filename",async(req,res)=>{
    const filename = req.params.filename
   await s3.deleteObject({Bucket:BUCKET,Key:filename}).promise();
   res.send("File DEleted Successfully")
})