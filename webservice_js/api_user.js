//
// app.put('/user', async (req, res) => {...});
//
// Inserts a new user into the database, or if the
// user already exists (based on email) then the
// user's data is updated (name and bucket folder).
// Returns the user's userid in the database.
//
const dbConnection = require('./database.js')

exports.put_user = async (req, res) => {

  console.log("call to /user...");

  try {
    var data = req.body;  // data => JS object

    console.log(data);

    var rds_response = new Promise((resolve, reject) => {
      var sql = "Select * from users where email = ?";
      var params = [data.email];
      dbConnection.query(sql, params, (err, row) => {
        resolve(row);
      });
    });
    var checkuser = await rds_response;

    if (checkuser.length == 0) {
      //not in user table
      var sql = "INSERT INTO users(email, lastname, firstname, bucketfolder) VALUES (?, ?, ?, ?)";
      var params = [data.email, data.lastname, data.firstname, data.bucketfolder];
      dbConnection.query(sql, params, (err, result) => {
        res.json({
          "message": "inserted",
          "userid": result.insertId
        });
      });
    }
    else {
      var sql = "Update users set email = ?, lastname = ?, firstname = ?, bucketfolder = ? where email = ?";
      var params = [data.email, data.lastname, data.firstname, data.bucketfolder, data.email];
      dbConnection.query(sql, params, (err, result) => {
        res.json({
          "message": "updated",
          "userid": checkuser[0].userid
        });
      });
    }


  }//try
  catch (err) {
    res.status(400).json({
      "message": "some sort of error message",
      "userid": -1
    });
  }//catch

}//put
