//Express imports
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const cors = require('cors');

//super secret configuration
require('dotenv').config();

//multer, for file processing
const multer = require('multer');

//AWS SDK import
const {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');

//Creates app
const app = express();
app.use(cors());

//Variables required for s3 client
const region = 'us-east-1';
const bucketName = 'careerf-tester';
const accessKey = process.env.ACCESS_KEY;
const secret = process.env.SECRET_ACCESS_KEY;

//Creates new S3 client to pass to localstack
const s3Client = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secret,
  },
  region: 'us-east-1',
});

//used to pass our bucket name to functions
//my-cool-local-bucket
const listObjectsParams = {
  Bucket: bucketName,
};

//declares a variable to hold our command which then lists the objects from our bucket given by params
listObjectsCmd = new ListObjectsV2Command(listObjectsParams);

// Multer middleware for handling file uploads
const upload = multer({ dest: 'uploads/' });

//passes the listObjectsCmd to our s3Client object
s3Client.send(listObjectsCmd);

//endpoints
app.get('/images', (req, res) => {
  s3Client
    .send(new ListObjectsV2Command(listObjectsParams))
    .then((listObjectsResponse) => {
      res.send(listObjectsResponse);
    });
});

//upload files
/* Multer is going to take our file and run it through the single middleware, then populating our req
parameter with the processed upload file, which allows us to access certain keys within the object, such as path or file */
app.post('/images', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was chosen for upload' });
  }

  const file = req.file;
  const appliedKey = 'original-image/' + file.originalname;

  //debugging catches just in case
  console.log(file);
  console.log(file.path);

  try {
    //creates temporary read path to the file
    const stream = fs.createReadStream(file.path);

    const params = {
      Bucket: bucketName,
      Key: appliedKey,
      Body: stream,
    };

    await s3Client.send(new PutObjectCommand(params));
    //if successful
    return res.status(200).json({ message: 'File successfully uploaded' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Upload Failed' });
  } finally {
    fs.unlinkSync(file.path);
  }
});

const PORT = 8080;
app.listen(PORT, (err) => {
  if (err) console.error(`There was an error in booting up the server: ${err}`);
  console.log(`listening on port ${PORT}`);
});
