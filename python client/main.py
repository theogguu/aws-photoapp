#
# Client-side python app for photoapp, this time working with
# web service, which in turn uses AWS S3 and RDS to implement
# a simple photo application for photo storage and viewing.
#
# Project 02 for CS 310, Spring 2023.
#
# Authors:
#   Steven Gu
#   Prof. Joe Hummel (initial template)
#   Northwestern University
#   Spring 2023
#

import requests  # calling web service
import jsons  # relational-object mapping

import re  # string format checking
import uuid
import pathlib
import logging
import sys
import os
import base64
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from configparser import ConfigParser
from exif import Image

import matplotlib.pyplot as plt
import matplotlib.image as img


###################################################################
#
# classes
#
class User:
  userid: int  # these must match columns from DB table
  email: str
  lastname: str
  firstname: str
  bucketfolder: str


class Asset:
  assetid: int  # these must match columns from DB table
  userid: int
  assetname: str
  bucketkey: str


class Metadata:
  metaid: int
  assetid: int  # these must match columns from DB table
  userid: int
  assetname: str
  latitude: str
  longitude: str
  givendate: str
  giventime: str


class BucketItem:
  Key: str  # these must match columns from DB table
  LastModified: str
  ETag: str
  Size: int
  StorageClass: str


###################################################################
#
# prompt
#
def prompt():
  """
  Prompts the user and returns the command number
  
  Parameters
  ----------
  None
  
  Returns
  -------
  Command number entered by user (0, 1, 2, ...)
  """
  print()
  print(">> Enter a command:")
  print("   0 => end")
  print("   1 => stats")
  print("   2 => users")
  print("   3 => assets")
  print("   4 => download")
  print("   5 => download and display")
  print("   6 => bucket contents")
  print("   7 => upload image")
  print("   8 => image metadata")
  print("   9 => search by metadata")

  cmd = int(input())
  return cmd


###################################################################
#
# stats
#
def stats(baseurl):
  """
  Prints out S3 and RDS info: bucket status, # of users and 
  assets in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/stats'
    url = baseurl + api

    res = requests.get(url)
    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract stats:
    #
    body = res.json()
    #
    print("bucket status:", body["message"])
    print("# of users:", body["db_numUsers"])
    print("# of assets:", body["db_numAssets"])

  except Exception as e:
    logging.error("stats() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


###################################################################
#
# users
#
def users(baseurl):
  """
  Prints out all the users in the database
  
  Parameters
  ----------
  baseurl: baseurl for web service
  
  Returns
  -------
  nothing
  """

  try:
    #
    # call the web service:
    #
    api = '/users'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract users:
    #
    body = res.json()
    #
    # let's map each dictionary into a User object:
    #
    users = []
    for row in body["data"]:
      user = jsons.load(row, User)
      users.append(user)
    #
    # Now we can think OOP:
    #
    for user in users:
      print(user.userid)
      print(" ", user.email)
      print(" ", user.lastname, ",", user.firstname)
      print(" ", user.bucketfolder)

  except Exception as e:
    logging.error("users() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


#assets
def assets(baseurl):
  try:
    api = '/assets'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract assets:
    #
    body = res.json()

    # let's map each dictionary into a Asset object:
    #
    assets = []
    for row in body["data"]:
      asset = jsons.load(row, Asset)
      assets.append(asset)
    #
    # Now we can think OOP:
    #
    for asset in assets:
      print(asset.assetid)
      print(" ", asset.userid)
      print(" ", asset.assetname)
      print(" ", asset.bucketkey)
  except Exception as e:
    logging.error("assets() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


def download(baseurl, display=False):
  try:
    api = '/download'
    print("Enter asset id>")
    assetId = input()
    url = baseurl + api + '/' + assetId

    res = requests.get(url)
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      return

    body = res.json()
    if body["message"] != "success":
      print("no such asset...")
      return
    else:
      imageb = base64.b64decode(body["data"])
      outfile = open(body["asset_name"], "wb")
      outfile.write(imageb)
      outfile.close()
      print("userid:", body["user_id"])
      print("asset name:", body["asset_name"])
      print("bucket key:", body["bucket_key"])
      print("Downloaded from S3 and saved as '", body["asset_name"], "'")
      if display:
        #if cmd = 5 show the image
        image = img.imread(body["asset_name"])
        plt.imshow(image)
        plt.show()
  except Exception as e:
    logging.error("download() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


def bucket(baseurl):
  try:
    api = '/bucket'
    url = baseurl + api

    def showlist(startAfter=""):
      if startAfter == "":
        url = baseurl + api
      else:
        url = baseurl + api + "?startafter=" + startAfter
      res = requests.get(url)

      #
      # let's look at what we got back:
      #
      if res.status_code != 200:
        # failed:
        print("Failed with status code:", res.status_code)
        print("url: " + url)
        if res.status_code == 400:  # we'll have an error message
          body = res.json()
          print("Error message:", body["message"])
        #
        return

      #
      # deserialize and extract bucket:
      #
      body = res.json()

      # let's map each dictionary into a Bucket object:
      #
      buckets = []
      for row in body["data"]:
        bucket = jsons.load(row, BucketItem)
        buckets.append(bucket)
      #
      # Now we can think OOP:
      #
      for bucket in buckets:
        print(bucket.Key)
        print(" ", bucket.LastModified)
        print(" ", bucket.Size)
      return buckets

    buckets = showlist()
    while (len(buckets) != 0):
      print("another page? [y/n]")
      response = input()
      if response != "y":
        return
      else:
        buckets = showlist(buckets[-1].Key)
  except Exception as e:
    logging.error("bucket() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


def decimal_coords(coords, ref):
  decimal_degrees = coords[0] + coords[1] / 60 + coords[2] / 3600
  if ref == 'S' or ref == 'W':
    decimal_degrees = -decimal_degrees
  return decimal_degrees


def image_coordinates(image_path):
  with open(image_path, 'rb') as src:
    img = Image(src)
  if img.has_exif:
    try:
      img.gps_longitude
      coords = (decimal_coords(img.gps_latitude, img.gps_latitude_ref),
                decimal_coords(img.gps_longitude, img.gps_longitude_ref))
    except AttributeError:
      print('No Coordinates')
  else:
    print('no Exif info')
    return
  return [img.datetime_original, coords[0], coords[1]]


def image(baseurl):
  try:
    api = 'image'

    userId = input("user ID: ")
    # userId = '80002'
    url = baseurl + api + '/' + userId
    name = input("image name: ")
    # file = open(prompt("Path of image: "), "rb")
    file = open(name, "rb")
    # TODO: needs exception check for no such file

    # image -> binary
    b = file.read()
    file.close()
    e = base64.b64encode(b)
    s = e.decode()

    # metadata: coords
    mdata = ""
    results = image_coordinates(name)
    date, time = results[0].split(' ')
    mdata = [date, time, results[1], results[2], userId]
    print(mdata)

    # final json
    data = {"assetname": name, "data": s, "metadata": mdata}

    # send json / receive res
    res = requests.post(url, json=data)

    print("status code:", res.status_code)
    body = res.json()
    print("message:", body["message"])

    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      return

  except Exception as e:
    logging.error("image() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


#
# Code author for is_valid_date_format(input) and is_valid_location(input): OpenAI
# code snippet begins
#

# helper function to test if string is a valid date time
def is_valid_date_format(input):
  print(input)
  pattern = r'\b\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}\b'
  return re.match(pattern, input) is not None


# helper function to test if string is a valid coords
def is_valid_location(input):
  pattern = r'\b^\s*-?\d+(\.\d+)?\s* \s*-?\d+(\.\d+)?\s*$\b'
  return re.match(pattern, input) is not None


#
# code snippet ends
#

# search(baseurl)
# search user's folders for images on/near a certain date


def search(baseurl):
  try:
    api = '/search'
    userid = input("Enter userid>").strip()
    param = input("Enter parameter (location, datetime)>").strip()

    if param == 'datetime':
      value = input(
        "Enter datetime value (format: YYYY/MM/DD HH:MM:SS)>").strip()

      # date is internally represented as YYYY:MM:DD so
      # we need to manipulate the string on the front
      value = value.replace("/", ":", 2)
      if not is_valid_date_format(value):
        print("Invalid datetime format, please try again.")
        return
    elif param == 'location':
      value = input("Enter location value (format: lat long)>").strip()
      if not is_valid_location(value):
        print("Invalid location format, please try again.")
        return

    else:
      print("Invalid parameter format, please try again.")
      return

    n = input("Enter the desired number of results>").strip()
    if not n.isdigit():
      print("Invalid number, please use natural numbers.")
      return

    # URL cannot have whitespaces
    # if we use hyphen may confuse with negative numbers
    value = value.replace(" ", "&")

    # construct url
    url = baseurl + api + '/' + userid + "/" + param + "/" + value + '/' + n

    res = requests.get(url)
    body = res.json()

    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        print("Error message:", body["message"])
      return

    if body["message"] != "success":
      print("no such assets...")
      return

    print("\nResults: ")
    if param == "datetime":
      for entry in body["data"]:
        print("Asset ID:", entry["assetid"])
        print("Asset Name:", entry["assetname"])
        print("\tDate:", entry["givendate"].replace(":", "/"))
        print("\tTime:", entry["giventime"])
        print()

    elif param == "location":
      for entry in body["data"]:
        print("Asset ID:", entry["assetid"])
        print("\tAsset Name:", entry["assetname"])
        print("\tCoordinates: (", entry["longitude"], ",", entry["latitude"],
              ")")
        print()

  except Exception as e:
    logging.error("download() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


def metadata(baseurl):
  try:
    api = '/metadata'
    url = baseurl + api

    res = requests.get(url)

    #
    # let's look at what we got back:
    #
    if res.status_code != 200:
      # failed:
      print("Failed with status code:", res.status_code)
      print("url: " + url)
      if res.status_code == 400:  # we'll have an error message
        body = res.json()
        print("Error message:", body["message"])
      #
      return

    #
    # deserialize and extract assets:
    #
    body = res.json()

    # let's map each dictionary into a Asset object:
    #
    metadata = []
    for row in body["data"]:
      data = jsons.load(row, Metadata)
      metadata.append(data)
    #
    # Now we can think OOP:
    #
    for data in metadata:
      print(data.metaid)
      print(" ", data.assetid)
      print(" ", data.userid)
      print(" ", data.assetname)
      print(" ", data.latitude)
      print(" ", data.longitude)
      print(" ", data.givendate)
      print(" ", data.giventime)

  except Exception as e:
    logging.error("assets() failed:")
    logging.error("url: " + url)
    logging.error(e)
    return


#########################################################################
# main
#
print('** Welcome to PhotoApp v2 **')
print()

# eliminate traceback so we just get error message:
sys.tracebacklimit = 0

#
# what config file should we use for this session?
#
config_file = 'photoapp-client-config'

print("What config file to use for this session?")
print("Press ENTER to use default (photoapp-config),")
print("otherwise enter name of config file>")
s = input()

if s == "":  # use default
  pass  # already set
else:
  config_file = s

#
# does config file exist?
#
if not pathlib.Path(config_file).is_file():
  print("**ERROR: config file '", config_file, "' does not exist, exiting")
  sys.exit(0)

#
# setup base URL to web service:
#
configur = ConfigParser()
configur.read(config_file)
baseurl = configur.get('client', 'webservice')

# print(baseurl)

#
# main processing loop:
#
cmd = prompt()

while cmd != 0:
  #
  if cmd == 1:
    stats(baseurl)
  elif cmd == 2:
    users(baseurl)
  elif cmd == 3:
    assets(baseurl)
  elif cmd == 4:
    download(baseurl)
  elif cmd == 5:
    download(baseurl, True)
  elif cmd == 6:
    bucket(baseurl)
  elif cmd == 7:
    image(baseurl)
  elif cmd == 8:
    metadata(baseurl)
  elif cmd == 9:
    search(baseurl)
  else:
    print("** Unknown command, try again...")
  #
  cmd = prompt()

#
# done
#
print()
print('** done **')
