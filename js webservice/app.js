//
// Express js (and node.js) web service that interacts with 
// AWS S3 and RDS to provide clients data for building a 
// simple photo application for photo storage and viewing.
//
// Project 02 for CS 310, Spring 2023.
//
// Authors:
//  Steven Gu
//  Prof. Joe Hummel (initial template)
//  Northwestern University
//  Spring 2023
//
// References:
// Node.js: 
//   https://nodejs.org/
// Express: 
//   https://expressjs.com/
// MySQL: 
//   https://expressjs.com/en/guide/database-integration.html#mysql
//   https://github.com/mysqljs/mysql
// AWS SDK with JS:
//   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html
//   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/getting-started-nodejs.html
//   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
//   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
//

const express = require('express');
const app = express();
const config = require('./config.js');

const dbConnection = require('./database.js')
const { HeadBucketCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

app.use(express.json({strict: false, limit: "50mb"}));

var startTime;

app.listen(config.service_port, () => {
  startTime = Date.now();
  console.log('web service running...');
  //
  // Configure AWS to use our config file:
  //
  process.env.AWS_SHARED_CREDENTIALS_FILE = config.photoapp_config;
});

app.get('/', (req, res) => {

  var uptime = Math.round((Date.now() - startTime) / 1000);

  res.json({
    "status": "running",
    "uptime-in-secs": uptime,
    "dbConnection": dbConnection.state
  });
});

//
// service functions:
//
var stats = require('./api_stats.js');
var users = require('./api_users.js');
var assets = require('./api_assets.js');
var bucket = require('./api_bucket.js');
var download = require('./api_download.js');
var user = require('./api_user.js');
var image = require('./api_image.js');
var metadata = require('./api_metadata.js');
var search = require('./api_search.js');

app.get('/stats', stats.get_stats);  //app.get('/stats', (req, res) => {...});
app.get('/users', users.get_users);  //app.get('/users', (req, res) => {...});
app.get('/assets', assets.get_assets);  //app.get('/assets', (req, res) => {...});
app.get('/bucket', bucket.get_bucket);  //app.get('/bucket?startafter=bucketkey', (req, res) => {...});
app.get('/download/:assetid', download.get_download); //app.get('/download/:assetid', (req, res) => {...});
app.get('/search/:userid/:parameter/:value/:n', search.get_search); //app.get('/search/:userid/:parameter/:value/:n', (req, res) => {...});

app.put('/user', user.put_user); //app.put('/user', (req, res) => {...});
app.post('/image/:userid', image.post_image); //app.post('/image/:userid', (req, res) => {...}

// TODO: put fields in metadata
app.get('/metadata', metadata.get_metadata) //app.get ('/metadata', (req, res) => {...});