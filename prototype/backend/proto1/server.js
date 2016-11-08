"use strict";
var express = require('express');
var app = express();
var fs = require('fs');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
var ec2 = new AWS.EC2({apiVersion: '2016-09-15'});

var Cluster = require('ioredis').Cluster;
var Command = require('ioredis').Command;

var TopoNode = require('./js/TopoNode.js');
var TopoInstance = require('./js/TopoInstance.js');
var Subnet = require('./js/Subnet.js');
var AvailabilityZone = require('./js/AvailabilityZone.js');
var TopoCluster = require('./js/TopoCluster.js');


app.use('/js', express.static('js'));
app.use('/node_modules', express.static('node_modules'));



//Deliver the root directory as index.html
app.get('/', function(req, res) {
    fs.readFile('index.html', 'utf8', function(err, data) {
        if (  !err) res.send(data);
        else return console.log(err);
    });
});



function init() {
  var master = new TopoCluster();

  //Initiates aws calls to tagged instances for cluster parsing
  getInstancesByTag(function(instances){
    //Iterate through tagged instances to build the Topology object
    instances.forEach(function(i){
      var d = new AvailabilityZone();
      d.setName(i.Placement.AvailabilityZone);
      master.addAvailabilityZone(d);

      var sn = new Subnet();
      sn.setNetId(i.SubnetId);
      master.getAvailabilityZones(d).addSubnet(sn);

      var inst = new TopoInstance();
      inst.setId(i.InstanceId);
      inst.setIp(i.PublicIpAddress);
      master.getSubnets(sn).addInstance(inst);
    });

    // All AWS related data is gathered at this point
    var data = JSON.stringify(master);

    getClusterNodes(master, function(nodes){
      // var clusterOptions = {
      //   clusterRetryStrategy: function(){
      //     for(var i = 0; i < 6; i++){
      //       var node = nodes[i];
      //       debug(node);
      //       debug("START_NODES node: " + node.host + "\t" + node.port);
      //
      //       meetNode(node, function(err, res){
      //         if (err)
      //           debug("From meetNode()");
      //           debug(err);
      //         if (res){
      //           //debug(res.toString('utf8'));
      //           //Outputs 'OK' on success
      //         }
      //       });
      //     }
      //   },
      //   enableOfflineQueue: true,
      //   scaleReads:  "master",
      //   maxRedirections: 16,
      //   retryDelayOnFailover: 500,
      //   retryDelayOnClusterDown: 500,
      //   retryDelayOnTryAgain: 500
      // };

      var cluster = new Cluster(nodes);

      cluster.on('connect', function() {
        debug("cluster.on CONNECT");
      });

      cluster.on('ready', function() {
        debug("cluster.on READY");
      });

      cluster.on('error', function(err) {
        debug("cluster.on ERROR");
      });

    });

  });
}




function getClusterNodes(master, callback){

  //Build the aws ids to query
  var ids = [];
  master.getInstances().forEach(function(inst, index){
    ids.push( String(inst.getId()) );
  });


  //Define params to request only the list of instance IDs built
  var params = {
    InstanceIds : ids
  };


  //Build a list of node containing public/private host addresses and ports
  //for ioredis connection to be built (can also be sent client-side for info parsing)
  var nodes = [];
  var basic_nodes = [];
  ec2.describeInstances(params, function(err, data){

    if (err) debug(err, err.stack); // an error occurred

    else{
      data.Reservations.forEach(function(res){
        res.Instances.forEach(function(inst){
          inst.Tags.forEach(function(tag){
            var pub_ip = inst.PublicIpAddress;
            var priv_ip = inst.PrivateIpAddress;
            var type;
            if(tag.Key == 'master'){
              type = 'master';
              var node_port = tag.Value;
              var n = {
                public_ip : pub_ip,
                private_ip : priv_ip,
                port : node_port,
                type : type
              }
              var n1 = {
                host : pub_ip,
                port : node_port
              }
              nodes.push(n);
              basic_nodes.push(n1);
            }
            else if (tag.Key == 'slave'){
              type = 'slave';
              var node_port = tag.Value;
              var n = {
                public_ip : pub_ip,
                private_ip : priv_ip,
                port : node_port,
                type: type
              }
              var n1 = {
                host : pub_ip,
                port : node_port
              }
              nodes.push(n);
              basic_nodes.push(n1);
            }
          });
        });
      });
      callback(basic_nodes);
    }
  });
}

//Query ec2 for instances with matching filters given
//http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeTags-property
function getInstancesByTag(callback){
  debug("getInstanceByTag()");
  var instance_ids = [];
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

  ec2.describeTags(params, function(err, data){
    if (err)
      debug(err, err.stack);
    else{
      var i;
      for(i = 0;i < data.Tags.length; i++){
        instance_ids.push(data.Tags[i].ResourceId);
      }

      getInfoByNodeId(instance_ids, callback);
    }
  });
}


//Takes an Array<string> nodes argument which contains the EC2 instance IDs of
//our AWS cluster. This array is then used to construct the params for a call
//using the AWS-sdk to query instance information based off instance ID

//http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeInstances-property
function getInfoByNodeId(instance_ids, callback){
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

      if(callback)
        callback(instances);
    }
  });
}

var debugMode = true;
function debug(s) {
  if (debug){
    console.log(s);
  }
}

//SERVER START
var server = app.listen('8080', '0.0.0.0', function() {
    debug("Listening on localhost:8080");
    init();
});
