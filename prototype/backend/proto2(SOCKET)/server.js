var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

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

server.listen(8080);

app.use('/js', express.static('js'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

/*
TODO: Add emit event handler for providing an update on a given client socket
*/

//Handles new connection to server
//TODO: Add a method of handling hard-coded response for dummy data
io.on('connection', function (socket) {

  //Emit an event 'init' to the new socket connection.
  //TODO: This should request the cluster information
  socket.emit('init', /*--{DATA: OBJECT}--*/);


  //Event emitted by the newly connected client
  //TODO: data in this case will contain the cluster information
  //TODO: design the data format if we want to use a login screen
  socket.on('socket response', function (data) {
    /*
    ===========================================================================
    Potential data info:
      -EC2 instance tag to search for
      -Region(s) to search on AWS
      -Assumes master and slave nodes are properly tagged to give port mapping
          else we need the ports that belong to a given instance
    ===========================================================================

    Make AWS call with the given tag key/value
        Return array of ec2 instance info objects
    Build TopoCluster and send to client or send raw data and build client-side
    Extract master/slave ports and build node objects w/ the associated host IP
    Build ioredis object from array of host/port mappings
    Push the newly created ioredis object to some array and associate it with
        the corresponding socket which created it.
    */


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
