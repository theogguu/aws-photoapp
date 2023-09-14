//
// app.get('/search/:userid/:parameter/:value/:n', (req, res) => {...});
//
// Searches a userid's folder and returns up to n images closest to the value 
// under the specified parameter
//
const dbConnection = require('./database.js')
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { s3, s3_bucket_name, s3_region_name } = require('./aws.js');

exports.get_search = async (req, res) => {

  console.log("call to /search...");

  try {

    // const to avoid errors (these are common var names!)
    const userid = req.params.userid;
    const parameter = req.params.parameter;
    const value = req.params.value;
    const n = req.params.n;
    
    var rds_response = new Promise((resolve, reject) => {
      var sql = "Select * from metadata where userid = ?";
      // if the param is proximity, then we apply euclidean distance and return the first n photo(s)
      // if the param is time, then we convert the upload time to datetime and return the closest n photo(s)
      // parameter can either be an int -> datetime or a tuple/list/smth -> location

      // if we want first n instead of 1:
      // first calculate all the metrics (either TimeDelta or eucDistance)
      // append metric to end of the result 
      // sort results on metric 
      // return first n rows of result 
      var params = [userid];
      dbConnection.query(sql, params, (err, row) => {
        resolve(row);
      });
    });
    
    var result = await rds_response;
    if(result.length == 0)
    {
      res.status(200).json({
      "message": "error: no results found for this user",
      "data": []
      });
      return;
    }
    
    if (parameter == "datetime") //  time
    {
      let param_val = value.split('&');
      let date = param_val[0].split(':');
      let time = param_val[1].split(':');
      //new Date (year, month(idx 0), day, hour, minute, second)
      dateobj = new Date(date[0], date[1]-1, date[2], time[0], time[1], time[2])
      unixTime = dateobj.getTime();
      result.sort(function(a, b) {
        let dateA = a.givendate.split(':');
        let timeA = a.giventime.split(':');
        let dateobjA = new Date(dateA[0], dateA[1]-1, dateA[2], timeA[0], timeA[1], timeA[2]);
        let dateB = b.givendate.split(':');
        let timeB = b.giventime.split(':');
        let dateobjB = new Date(dateB[0], dateB[1]-1, dateB[2], timeB[0], timeB[1], timeB[2]);
        var diffA = Math.abs(dateobjA - unixTime);
        var diffB = Math.abs(dateobjB - unixTime);
        return diffA - diffB;
      });
      var closestObjects = result;
      if(n < result.length)
      {
        var closestObjects = result.slice(0, n);
      }
      // return statement equivalent
      res.status(200).json({
      "message": "success",
      "user_id": result[0].userid,
      "asset_name": result[0].assetname,
      "data": closestObjects
      });
      return;
    }
    else //location
    {
      let targetcoords = value.split("&");
      let targetLat = targetcoords[0];
      let targetLong = targetcoords[1];
      result.sort(function(a, b) {
        let LatA = a.latitude;
        let LongA = a.longitude;
        let EucA = Math.sqrt((LatA - targetLat) ** 2 + (LongA - targetLong) ** 2);
        let LatB = b.latitude;
        let LongB = b.longitude;
        let EucB = Math.sqrt((LatB - targetLat) ** 2 + (LongB - targetLong) ** 2);
        return EucA - EucB;
      });

      var closestObjects = result;
      if(n < result.length)
      {
        closestObjects = result.slice(0, n);
      }
      
      // return statement equivalent 
      res.status(200).json({
      "message": "success",
      "user_id": result[0].userid,
      "asset_name": result[0].assetname,
      "data": closestObjects
      });
      return;
    }
    
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
    return;
  }//catch

}//get