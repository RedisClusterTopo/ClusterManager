//Deoendencies
var express = require('express');
var fs = require('fs');
var app = express();
var Cluster = require('ioredis').Cluster;
var Command = require('ioredis').Command;

var debugMode = true;

//Deliver the root directory as index.html
app.get('/', function(req, res) {
    fs.readFile('index.html', 'utf8', function(err, data) {
        if (!err) res.send(data);
        else return console.log(err);
    });
});
app.get('/index', function(req, res) {
    fs.readFile('/frontend_example/index.html', 'utf8', function(err, data) {
        if (!err) res.send(data);
        else return console.log(err);
    });
});
//For setting up directory access:
//app.use('</directory>', express.static('<directory-name>'));
//
//  Ex: app.use('/js', express.static('js'));
        //This will serve files in the the 'js' folder

app.use('/js', express.static('js'));
app.use('/node_modules', express.static('node_modules'));

//==============================================================================
//==================Begin cluster functionality=================================
//==============================================================================

//The host address of the running Redis Cluster (assume 1 instance)
//Leave c_host empty if using a local cluster
//If using AWS instance, use the public IP and NOT THE PUBLIC DNS
var c_host;
var L_HOST = '127.0.0.1';

//Build array of startup nodes host address and running port
var START_NODES = [
  {
    host: c_host || L_HOST,
    port: 7000
  },
  {
    host: c_host || L_HOST,
    port: 7001
  },
  {
    host: c_host || L_HOST,
    port: 7002
  },
  {
    host: c_host || L_HOST,
    port: 7003
  },
  {
    host: c_host || L_HOST,
    port: 7004
  },
  {
    host: c_host || L_HOST,
    port: 7005
  },
];

var clusterOptions = {
  clusterRetryStrategy: function(){
    for(var i = 0; i < 6; i++){
      var node = START_NODES[i];

      debug("START_NODES node: " + node.host + "\t" + node.port);

      meetNode(node, function(err, res){
        if (err)
          debug("From meetNode()");
          debug(err);
        if (res){
          //debug(res.toString('utf8'));
          //Outputs 'OK' on success
        }
      });
    }
  },
  enableOfflineQueue: true,
  scaleReads:  "master",
  maxRedirections: 16,
  retryDelayOnFailover: 500,
  retryDelayOnClusterDown: 500,
  retryDelayOnTryAgain: 500
};

var cluster = new Cluster(START_NODES, clusterOptions);


//Run when cluster is initialized without error
cluster.on('ready', function () {
  debug("Cluster ready");
});

//Run if the cluster emits an error
//***HAVE NOT TRIGGERED THIS EVENT YET***
cluster.on('error', function(err){
  debug("cluster.on ERROR");
  if (err){
    debug(err);
  }
});
/*
//Catches errors thrown on attempting to connect to the startup cluster nodes
cluster.connect().catch(function (err) {
  //Log the error
  if(err){
    debug("Caught error on cluster.connect():");
    debug(err);
    debug("\n");
  }

  manualMeet();

  //Begin sending the CLUSTER INFO and CLUSTER NODES command to check status
  //on an interval given by timeout in ms
  var timeout = 2500;
  setInterval(
    function(){
      clusterInfo(function(error, response){
        if (error){
          debug(error);
        }
        if(response){
          debug("clusterInfo().response  in cluster.connect().catch");
          debug(response.toString('utf8'));
        }
      });
      nodesCmd(function(e, r){
        if(e)
          debug(e);
        if(r){
          debug("nodesCmd().response in cluster.connect().catch");
          debug(r.toString('utf8'));
        }
      });
    }
  , timeout);

});
*/

//Called upon clicking 'Get Cluster Info' button on index.html
app.post('/getInfoCommand', function(req, res) {
  clusterInfo(function(error, response){
    if (error)
      debug(error)
    if(response){
      debug(response.toString('utf8'));
      res.send(response.toString('utf8'));
    }
  });
});

//Called on clicking master/slave length button
app.post('/getMSLength', function(req, res) {
  var msg = [];
  msg.push("All length: " + cluster.nodes("all").length);
  msg.push("Slave length: " + cluster.nodes("slave").length);
  msg.push("Master length: " + cluster.nodes("master").length);

  res.send(msg);
});

//Issue meet commands to all nodes in the START_NODES array
function manualMeet(){
  for(var i = 0; i < 6; i++){
    var node = START_NODES[i];

    debug("START_NODES node: " + node.host + "\t" + node.port);

    meetNode(node, function(err, res){
      if (err)
        debug(err);
      if (res){
        //debug(res.toString('utf8'));
        //Outputs 'OK' on success
      }
    });
  }
}

//Builds and sends the CLUSTER SLOTS command
//A response object is passed to the supplied callback function
function nodesCmd(callback){
  debug("Sending CLUSTER NODES command");
  var args = ['slots'];
  var nodes = new Command('cluster', args, 'utf8', callback);

  cluster.sendCommand(nodes);
}


/*
Method for building and sending a 'cluster meet' command

Args:
  @param {object} node
    @param {string} node.host   The ip of the node to meet
    @param {string} node.port   The port on which the node is running

  @param {function} callback    Handles the data returned by meetNode

Returns:
  (error, response)   These parameters are handled by the callback provided
  on calling this function
*/
function meetNode(node, callback){
  debug("Meeting node: " + node.host + "\t" + node.port);

  if (!node.host || !node.port){
    debug("Host or port of node to meet is undefined");
    return;
  }

  var args = ['meet', node.host, node.port];
  var meet = new Command('cluster', args, 'utf8', callback);
  cluster.sendCommand(meet);
}

/*
Method for issuing the 'cluster info  command'
Args:
  @param {function} callback    Handles data returned by clusterInfo

Returns:
    (error, response)   These parameters are handled by the callback provided
    on calling this function
*/
function clusterInfo(callback){
  debug("Sending CLUSTER INFO command");
  var info = new Command('cluster', ['info'], 'utf8', callback);
  cluster.sendCommand(info);
}

function debug (s){
  if (debugMode)
    console.log(s);
}

var server = app.listen('8080', '0.0.0.0', function() {
    console.log("Listening on localhost:8080");
});
