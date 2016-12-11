var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var express = require('express');
var path = require('path');

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
var ec2 = new AWS.EC2({apiVersion: '2016-09-15'});


var Command = require('ioredis').Command;


var ClientToken = require('./js/server-scripts/ClientToken.js');

//Store objects containing ec2 info, ioredis info and the corresponding socket
var clientStore = [];

server.listen(8080);

app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'aws-login.html'));
});

app.get('/index', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


//Add event listeners to new socket connections
io.on('connection', function (socket) {
  // User connects and wants to access with the tag given
  socket.on('init-tag', function(tag){

    clientStore.forEach(function(c){
      //TODO: Check for duplicates via tag ID
    });

    initClient(tag, socket, function(){
      // Client is initialized and added to clientStore
    });

  });

  //Initial forward of ec2 info to client
  socket.on('init app', function(clientID){
    //Find the associated client and emit the stored data without querying ec2
    //No ioredis info is known here
    clientStore.forEach(function(cl){
      if(cl.getClientID().val == clientID.val && cl.getClientID().key == clientID.key){
        socket.emit('topo init', cl.getEC2Data());
      }
    });
  });

  //Make calls to ec2, update cluster node states then forward data to client
  socket.on('update topo', function(clientID){
    updateClient(clientID, function(){

    });
  });
});

function initClient(tag, socket, callback){
  //Iterate through stored clients until a tag key/val is matched
  clientStore.forEach(function(cl){
    if(tag.key == cl.getClientID().key && tag.val == cl.getClientID().val){
      socket.emit('topo init', cl.ec2data); //Send the stored ec2 data
      return;//Don't init a new client token
    }
  });

  var newClient = new ClientToken(tag.key, tag.val, socket);

  //Make ec2 query call and update token info based on return of query
  newClient.queryEC2(function(d){
    newClient.setEC2Data(d);

    // newClient.parseNodes();   //Unimplemented - token storage of host/port map for nodes
    // newClient.initCommander(); //Unimplemented - token storage of ioredis object

    clientStore.push(newClient);

    newClient.socket.emit('tag-response', null); //Tell client to advance to index
  });
}


function updateClient(cid, callback){
  //Iterate through stored clients until a tag key/val is matched
  clientStore.forEach(function(cl){
    if(tag.key == cl.getClientID().key && tag.val == cl.getClientID().val){
      cl.queryEC2(function(d){
        cl.setEC2Data(d);
        // cl.parseNodes(); //Unimplemented
        cl.socket.emit('topo update', cl.getEC2Data());
      });
    }
  });
}


var debugMode = true;
function debug(s) {
  if (debug){
    console.log(s);
  }
}
