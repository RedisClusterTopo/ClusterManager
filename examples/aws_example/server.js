/*
***NOTE***
This implementation requires credentials to be given in some form to the
AWS-sdk so that it can access your AWS resources securely.

Please find more info on this here:
http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials.html
*/



//Deoendencies
var express = require('express');
var fs = require('fs');
var app = express();
var AWS = require('aws-sdk');

//SERVER START
var server = app.listen('8080', '0.0.0.0', function() {
    console.log("Listening on localhost:8080");
    init();
});


 //It is necessary to specify a region in which to operate. In this case, Oregon
AWS.config.update({region: 'us-west-2'});

//Specify an API version to use
var ec2 = new AWS.EC2({apiVersion: '2016-09-15'});




//Query ec2 for instances with matching filters given

//http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeTags-property
function getInstancesByTag(){

  //Static list of filters defined to represent instances within our cluster
  var params = {
    Filters: [
      {
        Name: "key",
        Values: [
          "stack"
        ]
      },
      {
        Name: "value",
        Values:[
          "cmpsc484cluster"
        ]
      }
    ]
  };

  //Issue a request useing the AWS-sdk for a list of EC2 instances matching the
  //parameters passed above
  ec2.describeTags(params, function(err, data){
    if (err)
      debug(err, err.stack);
    else{
      var instances = [];

      for(i = 0;i < data.Tags.length; i++){
        instances.push(data.Tags[i].ResourceId);
      }

      getInfoByNodeId(instances);
    }
  });
}

//Takes an Array<string> nodes argument which contains the EC2 instance IDs of
//our AWS cluster. This array is then used to construct the params for a call
//using the AWS-sdk to query instance information based off instance ID

//http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeInstances-property
function getInfoByNodeId(instances){

  var params = {
    InstanceIds: instances
  };

  ec2.describeInstances(params, function(err, data) {
    if (err)
      console.log(err, err.stack); // an error occurred
    else{
      var instanceInfo = [];
      for(i=0; i<data.Reservations[0].Instances.length; i++){
        instanceInfo.push(data.Reservations[0].Instances[0]);
      }

      //Should contain an array of info returns representing each instance from
      //the tag query
      debug(instanceInfo);
    }
  });
}


var debugMode = true;
function debug (s){
  if (debugMode)
    console.log(s);
}


function init(){
  debug("In init");
  getInstancesByTag();
};
