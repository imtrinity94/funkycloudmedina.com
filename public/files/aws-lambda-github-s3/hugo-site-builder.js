// Update these variables before upload
// var targetBucket = "{bucket-name}";

// Lambda-provided environment variables
var githubAccount = process.env.GITHUB_ACCOUNT;
var githubRepo = process.env.GITHUB_REPO;
var targetBucket = process.env.TARGET_BUCKET;

// Declare required modules
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var http = require('request');
var fs = require('fs');
var localPath = require('path').join(__dirname,"tmp")
var exec = require('child_process').exec;
var mime = require('mime');

// Define the upload function used later
var upload_directory = function( dirName, baseDir ) {
  // For the initial run grab the baseDir
  if ( ! baseDir ) {
    baseDir = dirName + "/";
  }
  fs.readdir( dirName, function( err, files ) {
    if ( err ) {
      console.error( "Error reading directory:" + err );
      process.exit( 1 );
    }
    files.forEach( function ( baseFile, index ) {
      var file = dirName + "/" + baseFile;
      fs.stat( file , function ( err, fileStats ) {
        if ( fileStats.isDirectory() ) {
          upload_directory ( file, baseDir );
        } else {
          fs.readFile( file, function ( err, data ) {
            //Remove first part of dirname
            keyName = file.replace( baseDir, "" )
            console.log( keyName );
            s3.putObject({
              Bucket: targetBucket,
              Key: keyName,
              Body: data,
              ContentType: mime.getType(file),
            },function(err, resp) {
              if (err) console.log(err, err.stack);
              else     console.log(resp);
            });
          });
        }
      });
    });
  });
}

exports.handler = function(event, context, callback) {
  var stream = fs.createWriteStream("/tmp/master.zip");
  http
    .get("https://github.com/" + githubAccount + "/" + githubRepo + "/archive/master.zip")
    .pipe(stream);
  stream.on('finish',function(){
    exec("cd /tmp; unzip master.zip",function(resp){
      console.log(resp);
      exec("cd /tmp; cd " + githubRepo + "-master;/var/task/hugo",function(resp){
        console.log(resp);
        upload_directory("/tmp/" + githubRepo + "-master/public");
      });
    });
  });



callback(null,"Complete");
}