//Express imports
const express = require('express');
const fileUpload = require('express-fileupload');
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
  endpoint: 'http://localhost:4566',
  forcePathStyle: true,
});
//instantiates listObjectsParams, giving the bucket as our parameter
const listObjectsParams = {
  Bucket: 'my-cool-local-bucket',
};

listObjectsCmd = new ListObjectsV2Command(listObjectsParams);

//passes the listObjectsCmd to our s3Client object
s3Client.send(listObjectsCmd);

const PORT = 8080;
app.listen(8080, (err) => {
  if (err) console.error(`There was an error in booting up the server: ${err}`);
  console.log(`listening on port ${PORT}`);
});
