//
// app.post('/image/:userid', async (req, res) => {...});
//
// Uploads an image to the bucket and updates the database + metadata DB,
// returning the asset id assigned to this image.
//
const dbConnection = require('./database.js')
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

const uuid = require('uuid');

exports.post_image = async (req, res) => {

  console.log("call to /image...");

  try {

    var data = req.body;  // data => JS object
    var rds_response = new Promise((resolve, reject) => {
      var sql = "Select * from metadata where userid = ?";
      var params = [req.params.userid];
      dbConnection.query(sql, params, (err, row) => {
        resolve(row);
      });
    });
    var result = await rds_response;
    if (result.length == 0) {
      res.status(200).json({
        "message": "no such user...",
        "assetid": -1
      });
      return;
    }

    // S is the image   
    var S = req.body.data;
    var bytes = Buffer.from(S, 'base64');
    var key = result[0].bucketfolder + '/' + uuid.v4() + '.jpg';
    const input = {
      Bucket: s3_bucket_name,
      Key: key,
      Body: bytes
    }
    const command = new PutObjectCommand(input);
    const response = await s3.send(command);

    var rds_response = new Promise((resolve, reject) => {
      var sql = "Insert into assets (userid, assetname, bucketkey) values (?, ?, ?);";
      var params = [req.params.userid, data.assetname, key];
      dbConnection.query(sql, params, (err, row) => {
        resolve(row);
      });
    });
    var result = await rds_response;
    console.log(result.insertId);
    var mdata = req.body.metadata;
    console.log(mdata);
    var sql = "Insert into metadata (assetid, userid, assetname, latitude, longitude, givendate, giventime) values (?, ?, ?, ?, ?, ?, ?);";
    // ACQUIRE METADATA AND ATTACH TO PARAMS
    var params = [result.insertId, mdata[4], data.assetname, mdata[2], mdata[3], mdata[0], mdata[1]];
      dbConnection.query(sql, params, (err, row) => {
        res.json({
          "message": "success",
          "metadataid": result.insertId
        });
      });

    //  }
  }//try
  catch (err) {
    res.status(400).json({
      "message": "some sort of error message",
      "assetid": -1
    });
  }//catch

}//post
