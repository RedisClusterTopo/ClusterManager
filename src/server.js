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


//Store objects containing ec2 info, ioredis info and the corresponding socket
var clientStore = [];

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
  socket.on('init-tag', function(tag){

    //Check clientStore to prevent duplicates
    clientStore.forEach(function(c){
      if(c.id.key == tag.key && c.id.val == tag.val){
        return;
      }
    });

    //client_data contains ec2 instance array and ioredis object
    initClient(tag, function(client_data){
      socket.emit('tag-response', null); //Tell client to advance to index

      var newClient = {};
      newClient.id = {
        key : tag.key,
        val : tag.val
      };
      newClient.info = client_data;
      newClient.nodes = client_data.nodes;

      clientStore.push(newClient);
    });

  });

  //Forward topology data without making call to ec2
  //App is initialized without info of cluster nodes
  socket.on('init app', function(clientID){
      var found = false;
      //Iterate through stored clients until a tag key/val is matched
      clientStore.forEach(function(cl){
        if(clientID.key == cl.id.key && clientID.val == cl.id.val){
          var d = {
            ec2info: cl.info.ec2info,
            nodes: cl.info.nodes
          };
          socket.emit('topo init', d);
          found = true;
        }
      });

      if(found == false){
        socket.emit('err', "Client ID not found");
      }
  });

  //Make calls to ec2, update cluster node states then forward data to client
  socket.on('update topo', function(clientID){

    clientStore.forEach(function(cl){
      if(clientID.key == cl.id.key && clientID.val == cl.id.val){
        updateClient(clientID, function(topo_data){
          socket.emit('topo update', topo_data);
        });
      }
    });

  });

});


function initClient(tag, callback){
  var clientData = {};

  clientStore.forEach(function(c){
    if(tag.key == c.id.key && tag.val == c.id.val)
      return;
  });

  getInstancesByTag(tag, function(ec2info){
    clientData.ec2info = ec2info; //Array of ec2 instance infos

    var clusterNodes = [];  //contains host/port for connecting ioredis
    //Check for instances tagged as master/slave cluster nodes
    ec2info.forEach(function(inst){
      inst.Tags.forEach(function(t){
        if(t.Key == "master" || t.Key == "slave"){
          var node = {};
          node.ip = inst.PrivateIpAddress;
          node.port = t.Value;
          clusterNodes.push(node);
        }
      });
    });

    clientData.nodes = clusterNodes;

    //TODO: Build an ioredis object interfacing with clientData.nodes
    //var cluster = new Cluster(clusterNodes);
    //clientData.ioredis = cluster;


    // ***Must mimic ports described in AWS tags***
    var local_cluster = false;   //Toggle on to use a local cluster
    var c_nodes = [];
    clientData.nodes.forEach(function(n){
      var node = {};
      node.host = n.ip;
      if(local_cluster)   node.host = '127.0.0.1';
      node.port = n.port;
      c_nodes.push(node);
    });

    var client_cluster = new Cluster(c_nodes);


    client_cluster.on('ready', function(){
      var nodesCmd = new Command('cluster', ['nodes'], 'utf8', function(err, res){
        if(err)   console.log(err);
        if(res)   console.log(res.toString('utf8'));
      });

      client_cluster.sendCommand(nodesCmd);
    });

    callback(clientData);
  });
}

function updateClient(cid, callback){
  var clientData = {};
  getInstancesByTag(cid, function(ec2info){
    clientData.ec2info = ec2info; //Array of ec2 instance infos

    //The client should have an existing ioredis object

    //TODO: Append the following values to clientData (structure tbd)
        //Issue  'slaves' commands to each master node and compare results
              //Build associations, both
              //master -> slave
              //slave -> master
        //Mapping of hash slots served by each node

    clientStore.forEach(function(client, i){
      if(cid.key == client.id.key && cid.val == client.id.val){
        clientData.nodes = client.nodes;
      }
    })

    callback(clientData);
  });
}

//Query EC2 for a list of instance IDs which have a tag matching
//the key and value provided by data
//Chains to getInfoByInstID() which returns instance info for each ID supplied
function getInstancesByTag(tag, callback){
  var instance_ids = [];

  var params = {
    Filters: [
      {
        Name: "key",
        Values: [
          tag.key
        ]
      },
      {
        Name: "value",
        Values:[
          tag.val
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
