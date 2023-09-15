//
// app.get('/download/:assetid', async (req, res) => {...});
//
// downloads an asset from S3 bucket and sends it back to the
// client as a base64-encoded string.
//
const dbConnection = require('./database.js')
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

exports.get_download = async (req, res) => {

  console.log("call to /download...");

  try {

    const assetid = req.params.assetid;
    var rds_response = new Promise((resolve, reject) => {
      var sql = "Select * from assets where assetid = ?";
      var params = [assetid];
      dbConnection.query(sql, params, (err, row) => {
        resolve(row);
      });
    });
    var result = await rds_response;
    if (result.length == 0) {
      res.status(200).json({
        "message": "no such asset...",
        "user_id": -1,
        "asset_name": "?",
        "bucket_key": "?",
        "data": []
      });
      return;
    }
    const bucketkey = result[0].bucketkey;
    const input = {
      Bucket: s3_bucket_name,
      Key: bucketkey
    }
    const command = new GetObjectCommand(input);
    const response = await s3.send(command);
    var datastr = await response.Body.transformToString("base64");
    res.json({
      "message": "success",
      "user_id": result[0].userid,
      "asset_name": result[0].assetname,
      "bucket_key": result[0].bucketkey,
      "data": datastr
    });
    // throw new Error("TODO: /download/:assetid");

    //
    // TODO
    //
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
    //


  }//try
  catch (err) {
    //
    // generally we end up here if we made a 
    // programming error, like undefined variable
    // or function:
    //
    res.status(400).json({
      "message": err.message,
      "user_id": -1,
      "asset_name": "?",
      "bucket_key": "?",
      "data": []
    });
  }//catch

}//get