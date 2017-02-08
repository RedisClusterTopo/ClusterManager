var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var express = require('express');
var path = require('path');

var ClientManager = require('./js/ClientManager.js');


var test = false; //Toggle whether to use json data stored in the test directory

process.argv.forEach(function (val, index, array) {
    if(index == 2 && val == "test"){
        test = true;
    }
});

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



var client_manager = new ClientManager();

//Add event listeners to new socket connections
io.on('connection', function (socket) {

    if(test){
        socket.emit('tag-response', null);
    }

    // User connects and wants to access with the tag given
    socket.on('init-tag', function(tag){
        client_manager.addClient(tag, socket, function(newClient){
            newClient.queryEC2(function(){
                newClient.socket.emit('tag-response', null);
            });
        });
    });

    //Initial forward of ec2 info to client
    socket.on('init app', function(clientID){
        if(test){
            socket.emit('topo init test', null);
            return;
        }

        if(client_manager.getClient(clientID) != null){
            client_manager.getClient(clientID).initCommander();
            socket.emit('topo init', client_manager.getClient(clientID).getEC2Data());
          }
        else{
            socket.emit('client not found', null)   //Move client back to login
        }

    });

    //Make calls to ec2, update cluster node states then forward data to client
    socket.on('update topo', function(clientID){
        client_manager.update(clientID, function(c){
            c.socket.emit('topo update', c.getEC2Data());
        });
    });
});


var debugMode = true;
function debug(s) {
    if (debug){
        console.log(s);
    }
}
