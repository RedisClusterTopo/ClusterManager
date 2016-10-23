var express = require('express');
var fs = require('fs');
var app = express();
var Cluster = require('ioredis').Cluster;
var Command = require('ioredis').Command;

//Deliver the root directory as index.html
app.get('/', function(req, res) {

    fs.readFile('index.html', 'utf8', function(err, data) {
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

var cluster = new Cluster([
  { host: '127.0.0.1', port: '7000' },
  { host: '127.0.0.1', port: '7001' },
  { host: '127.0.0.1', port: '7002' },
  { host: '127.0.0.1', port: '7003' },
  { host: '127.0.0.1', port: '7004' },
  { host: '127.0.0.1', port: '7005' }
]);

//Run when cluster is initialized
cluster.on('ready', function () {
  var node1 = {
    host: '127.0.0.1',
    port: '7006'
  };

  //Tell the cluster to 'meet' the node represented by node1
  meetNode(node1, function (error, response){
    if(error){}
      console.log(error);

    if(response){
      //response object is utf8 encoded and must be printed using the toString
      //method
      console.log(response.toString('utf8'));
    }

  });
});


//Called upon clicking 'Get Cluster Info' button on index.html
app.post('/getInfoCommand', function(req, res) {
  clusterInfo(function(error, response){
    if (error)
      console.log(error);
    if(response)
      console.log(response.toString('utf8'));
      res.send(response.toString('utf8'));
  })
});

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

  if (!node.host || !node.port)
    //Throw error
    ;

  var args = ['meet', node.host, node.port];
  var meet = new Command('cluster', args, 'utf8', cb);
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
function clusterInfo(cb){
  var info = new Command('cluster', ['info'], 'utf8', cb);
  cluster.sendCommand(info);
}


var server = app.listen('8080', '0.0.0.0', function() {
    console.log("Listening on localhost:8080");
});
