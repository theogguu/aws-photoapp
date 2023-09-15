# PhotoApp
Developed by Steven Gu, Bill Wang, Alex Chen

This was a multi-tier PhotoApp built with Python, JavaScript and Node/Express.js, and AWS services (EC2, S3 and RDS). A user can use the provided Python client to connect with our JS webservice that then access the AWS services and returns the appropriate data. 
This is now deprecated (because AWS keeps charging us :( ) but I documented our project for proof of concept.

## How it works

A user connects to our webservice with the provided Python client (or not). By using the webservice API, they can create users, upload or download images, search for certain stats (like images associated with a user), and more.
A user has to use a *userid* to upload a photo and their photos are uploaded into their own bucket.

We had a MySQL instance running in RDS which had 3 tables: users, assets, and metadata. Honestly, I think just [showing you the SQL script we ran](https://github.com/theogguu/aws-photoapp/blob/main/init_script.sql) will give you the easiest understanding of the data relationships. 
But in summary:
- **users** stored userids and important info attached to a user
- **assets** stored assetids and info attached to an asset (who uploaded it, the name of the file, and the bucketfile it should go to)
- **metadata** stored the given metadata of an image (lat/lon, date/time) and the user/asset it's attached to. Our Python client handles extracting metadata using the [Python Imaging Library (PIL)](https://pillow.readthedocs.io/en/stable/), but if the user chooses not to use the client, they will have to supply their own fields in their PUT request.

Here is a schema demonstrating the tiers:
![schema](https://github.com/theogguu/aws-photoapp/blob/main/schema.png?raw=true)


## Web service API endpoints
These web service API endpoints are built with Node/Express.js. 

Here they are in summary if you want to quickly skim past this:
```
app.get('/stats', stats.get_stats);  //app.get('/stats', (req, res) => {...});
app.get('/users', users.get_users);  //app.get('/users', (req, res) => {...});
app.get('/assets', assets.get_assets);  //app.get('/assets', (req, res) => {...});
app.get('/bucket', bucket.get_bucket);  //app.get('/bucket?startafter=bucketkey', (req, res) => {...});
app.get('/download/:assetid', download.get_download); //app.get('/download/:assetid', (req, res) => {...});
app.get('/search/:userid/:parameter/:value/:n', search.get_search); //app.get('/search/:userid/:parameter/:value/:n', (req, res) => {...});
app.get('/metadata', metadata.get_metadata) //app.get ('/metadata', (req, res) => {...});
app.put('/user', user.put_user); //app.put('/user', (req, res) => {...});
app.post('/image/:userid', image.post_image); //app.post('/image/:userid', (req, res) => {...}
```

And here they are in more detail:

### /stats
- Method: GET
- Description: Return stats about current S3 bucket status and total users and assets in our RDS database.
- Example Response:
  ```
  {
    "message": "success",
    "s3_status": 200,
    "db_numUsers": 2,
    "db_numAssets": 11
  }
  ```

### /users
- Method: GET
- Description: Return all the users present in the database.
- Example Response:
  ```
  {
    "message": "success",
    "data": ["steven gu", "ALEX CHEN", "Bill Wang!!"]
  }
  ```

### /assets
- Method: GET
- Description: Return all the assets (and their fields) in the database.
- Example Response:
 ```
  {
    "message": "success",
    "data":
      [
        {
          "assetid": 1001,
          "userid": 8001,
          "assetname": taco.png
          "bucketkey": *some uuid4*
        },
        {
          "assetid": 1002,
          "userid": 8001,
          "assetname": hotdog.png
          "bucketkey": *some uuid4*
        }
      ]
  }
 ```
### /bucket
- URL: **/bucket?startafter=bucketkey**
- Method: GET
- Description: Retrieves the contents of the S3 bucket and returns the information about each asset to the client. Note that it returns 12 at a time, use startafter query parameter to pass
the last returned bucketkey and get the next set of 12, and so on.
- Example Response:
```
{
  "message": "success",
  "data":
    [
      {
        "Key": *some-bucket-uuid4*/*some-asset-uuid4.jpg*
        "LastModified": *some-timeformat*
        "ETag": *some etag*
        "Size": 4230
        "StorageClass": "STANDARD
      },
        ... *and so on*
      ]
}
```
### /download
- URL: **/download/:assetid**
- Method: GET
- Description: downloads an asset from S3 bucket and sends it back to the client as a base64-encoded string. The python client converts the b64 string to an image and uses matplot to display it.
- Example Response:
```
{
  "message": "success",
  "user_id": 8001,
  "asset_name": "hamburger.jpg",
  "bucket_key": *some-uuid4*,
  "data": *some-b64-encoded-str*
}
```
### /user
Method: PUT
Description: Inserts a new user entry into the database with all the fields, or if the user already exists (based on email) then the user's data is updated (name and bucket folder). Returns the user's userid in the database.

Example Request:
`PUT example.com/8002`

Example Body:
```
{
  "email": "test@123.com",
  "lastname": "Gu",
  "firstname": "Steven"
  "bucketfolder": *some-uuid4*
}
```
Example Response:
```
{
  "message": "inserted",
  "userid": 8002
}
```
### /image
- URL: **/image/:userid**
- Method: POST
- Description: Uploads an image to the bucket as a b64-encoded string and its metadata and updates the database and metadata DB, returning the asset id assigned to this image
(the Python client handles this so the user only has to list the relative path of a file).
Example Request: 
`PUT example.com/image/8002`
Example Body:
```
{
  "assetname": "hi.jpg",
  "data": *some-b64-string*,
  "metadata": [date, time, lat, lon, userid]
}
```
Example Response:
```
{
  "message": "success",
  "metadataid": 1001
}
```

### /search
- URL: **/search/:userid/:parameter/:value/:n**
- Method: GET
- Description: Searches a userid's folder and returns up to n images closest to the value. A parameter is either "location" or "datetime", and acceptable values depend on the parameter:
  - Location value: lat&lon (lat, lon are floats)
  - Datetime value: YYYY:MM:DD:HH:MM:SS

Example Request:
`GET example.com/8001/location/40.000&40.000/5`
`GET example.com/8001/datetime/2020:12:31:11:59:59/2`

Example Response:
```
{
  "message": "success",
  "user_id": 8001,
  "data": [
    {
      "assetid": *some-uuid4*,
      "assetname": "pizza.jpg",
      "givendate": "2021:01:01",
      "giventime": "00:00:01"  
    },
    ...up to 4 more entries
  ]
}
```

```
{
  "message": "success",
  "user_id": 8001,
  "data": [
    {
      "assetid": *some-uuid4*,
      "assetname": "pizza.jpg",
      "longitude": 50.01,
      "latitude": 20.20
    },
    ...up to 1 more entry
  ]
}
```

### /metadata
- Method: GET
- Description: Returns all the assets from the metadata database.
- Example Response:
  ```
  {
    "message": "success",
    "data": [
      {
        "metaid": 1001
        "assetid": 1002
        "userid": 8002
        "assetname": asdf.jpg
        "latitude": 30.000
        "longitude": 45.01
        "givendate": 2020:02:20
        "giventime": 01:01:01
      }, etc...
    ]
  }
  ```

## How to use the PhotoApp
If you run the Python client, it will prompt you for a config file, which is just a file that follows the format: 
```
[client]
webservice=http://*project-URL*.us-east-2.elasticbeanstalk.com
```
Obviously, the webservice needs to be running for the client to connect. 
The client is pretty self-explanatory and features a very simple text-based UI that should be easy to follow.

However, to run the webservice, you'll need to modify the js_webservice/photoapp-config file, which follows this format:
```
[s3]
bucket_name = photoapp-steven-gu

[rds]
endpoint = mysql-steven-gu.c5jfsprgxzbl.us-east-2.rds.amazonaws.com
port_number = 3306
region_name = us-east-2
user_name = REDACTED
user_pwd = REDACTED
db_name = photoapp

[s3readonly]
region_name = us-east-2
aws_access_key_id = REDACTED
aws_secret_access_key = REDACTED

[s3readwrite]
region_name = us-east-2
aws_access_key_id = REDACTED
aws_secret_access_key = REDACTED
```

Fill it in with your own endpoint, region, a user with read-write access, access keys, etc. 
