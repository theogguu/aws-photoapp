//
// app.get('/users', async (req, res) => {...});
//
// Return all the users from the database:
//
const dbConnection = require('./database.js')

exports.get_users = async (req, res) => {

  console.log("call to /users...");

  try {
    var sql = "Select * from users order by userid ";
    var params = [];
    dbConnection.query(sql, params, (err, rows) => {
      res.json({
        "message": "success",
        "data": rows
      });
    });

    // throw new Error("TODO: /users");

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
