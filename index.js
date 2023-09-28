//Express imports
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');

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

//Creates new S3 client to pass to localstack
const s3Client = new S3Client({
  region: 'us-east-1',
  /* endpoint: 'ec2-3-84-49-24.compute-1.amazonaws.com',
  forcePathStyle: true, */
});

//used to pass our bucket name to functions
//my-cool-local-bucket
const listObjectsParams = {
  Bucket: 'careerf-tester',
};

//variable to hold our bucket
const bucketName = 'careerf-tester';

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

// app.get('/images/:key', (req, res) => {
/*This function needs to do the exact same as the above, then we need to see the format of the response before moving on, this will be a last step.
    We are going to filter the repsonses by the key which was passed in the request params, and then only return the S3 objects that 
    contain that key, that way we only return certain objects */
/*Check to see if there is a SDK function that would allow us to only search for certain objects by a request param, but not sure if there is */
//});

//upload files
/* Multer is going to take our file and run it through the single middleware, then populating our req
parameter with the processed upload file, which allows us to access certain keys within the object, such as path or file */
app.post('/images', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was chosen for upload' });
  }

  const file = req.file;
  const appliedKey = Date.now() + '_' + file.originalname;

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
