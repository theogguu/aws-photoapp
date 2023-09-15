--- IK it seems bad to include a script that just WIPES the database that is so easily accessible, but we were never planning on hosting large amounts of particularly sensitive/valuable data.
--- Assumes photoapp is already created!

USE photoapp;

DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS metadata;

CREATE TABLE users
(
    userid       int not null AUTO_INCREMENT,
    email        varchar(128) not null,
    lastname     varchar(64) not null,
    firstname    varchar(64) not null,
    bucketfolder varchar(48) not null,  -- random, unique name (UUID)
    PRIMARY KEY (userid),
    UNIQUE      (email),
    UNIQUE      (bucketfolder)
);

ALTER TABLE users AUTO_INCREMENT = 80001;  -- starting value

CREATE TABLE assets
(
    assetid      int not null AUTO_INCREMENT,
    userid       int not null,
    assetname    varchar(128) not null,  -- original name from user
    bucketkey    varchar(128) not null,  -- random, unique name in bucket
    PRIMARY KEY (assetid),
    FOREIGN KEY (userid) REFERENCES users(userid),
    UNIQUE      (bucketkey)
);

ALTER TABLE assets AUTO_INCREMENT = 1001;  -- starting value

CREATE TABLE metadata
(
    metaid	 int not null AUTO_INCREMENT,
    assetid      int not null,
    userid       int not null,
    assetname    varchar(128) not null,  -- original name from user
    latitude     varchar(128) not null,
    longitude    varchar(128) not null,
    givendate    varchar(128) not null,
    giventime    varchar(128) not null,
    PRIMARY KEY (metaid),
    FOREIGN KEY (assetid) REFERENCES assets(assetid),
    FOREIGN KEY (userid) REFERENCES users(userid)
);

ALTER TABLE metadata AUTO_INCREMENT = 1001;  

--
-- DONE
--
