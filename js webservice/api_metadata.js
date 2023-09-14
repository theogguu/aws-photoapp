//
// app.get('/assets', async (req, res) => {...});
//
// Return all the assets from the database:
//
const dbConnection = require('./database.js')

exports.get_metadata = async (req, res) => {

  console.log("call to /metadata...");

  try {
    var sql = "Select * from metadata order by metaid";
    var params = [];
    dbConnection.query(sql, params, (err, rows) => {
      res.json({
        "message": "success",
        "data": rows
      });
    });


    //
    // TODO: remember we did an example similar to this in class with
    // movielens database (lecture 05 on Thursday 04-13)
    //
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    //


  }//try
  catch (err) {
    res.status(400).json({
      "message": err.message,
      "data": []
    });
  }//catch

}//get
