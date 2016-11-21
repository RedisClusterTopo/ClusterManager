var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var express = require('express');
var path = require('path');


var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
var ec2 = new AWS.EC2({apiVersion: '2016-09-15'});

var Cluster = require('ioredis').Cluster;
var Command = require('ioredis').Command;

var TopoNode = require("./js/object/TopoNode.js");
var TopoInstance = require('./js/object/TopoInstance.js');
var Subnet = require('./js/object/Subnet.js');
var AvailabilityZone = require('./js/object/AvailabilityZone.js');
var TopoCluster = require('./js/object/TopoCluster.js');

server.listen(8080);

app.use('/js', express.static('js'));
app.use('../public', express.static('public'));
app.use('/css', express.static('css'));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'aws-login.html'));
});

app.get('/index', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


//Add event listeners to new socket connections
io.on('connection', function (socket) {

  //data contains tag key/val
  socket.on('init-tag', function(data){
    //Query EC2 for instance information
    getInstancesByTag(data, function(ec2info){

      var clusterNodes = [];  //contains host/port for connecting ioredis
      ec2info.forEach(function(inst){
        inst.Tags.forEach(function(t){
          var node = {};
          if(t.Key == "master" || t.Key == "slave"){
            node.ip = inst.PrivateIpAddress;
            node.port = t.Value;
            clusterNodes.push(node);
          }
        });
      });

      debug(clusterNodes);

      //Need to store ec2info globally in order to forward it to the
      //client @ index.html (only able to forward it to aws-login.html w/ current scope)
      socket.emit('tag-response', ec2info); //Send ec2info to client
    });
  });
});

//Query EC2 for a list of instance IDs which have a tag matching
//the key and value provided by data
//Chains to getInfoByInstID() which returns instance info for each ID supplied
function getInstancesByTag(data, callback){
  debug("enter getInstanceByTag()");
  var instance_ids = [];

  var params = {
    Filters: [
      {
        Name: "key",
        Values: [
          data.key
        ]
      },
      {
        Name: "value",
        Values:[
          data.val
        ]
      }
    ]
  };

  ec2.describeTags(params, function(err, data){
    if (err)
      debug(err, err.stack);
    else{
      var i;
      for(i = 0;i < data.Tags.length; i++){
        instance_ids.push(data.Tags[i].ResourceId);
      }

      getInfoByInstID(instance_ids, function(ec2info){
        callback(ec2info)
      });
    }
  });
}

//Query EC2 for instance information from a list of instance IDs
//Returns info objects for each instance
function getInfoByInstID(instance_ids, callback){
  var instances = [];
  var params = {
    InstanceIds: instance_ids
  };

  ec2.describeInstances(params, function(err, data) {
    if (err)
      console.log(err, err.stack); // an error occurred
    else{
      data.Reservations.forEach(function(set){
        set.Instances.forEach(function(inst){
          instances.push(inst);
        });
      });

      callback(instances); //to getInstancesByTag()
    }
  });
}

var debugMode = true;
function debug(s) {
  if (debug){
    console.log(s);
  }
}
