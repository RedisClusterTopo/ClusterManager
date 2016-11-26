var clientID;

$(document).ready(function () {
  //Request a socket
  var socket = io('http://localhost:8080');

  //Pass the key/value pair submitted to identify the client
  clientID = JSON.parse(sessionStorage.id);
  socket.emit('init app', clientID);


  //Server response to app initalization
  socket.on('topo init', function(in_topo){

    console.log(in_topo); //The initial topology data supplied to the client

    //Parse -> draw graphics for the initial data
    parse(in_topo, function(parsed_topo){
      generate_topo(parsed_topo); //Pass the parsed topology to graphics
    });


    //Refresh topology data on a 30sec interval
    setInterval(function(){

      //Request an update to the topology data
      socket.emit('update topo', clientID);

    }, 15000);

  });


  //Update to topology state is received
  socket.on('topo update', function(topo_data){

    console.log(topo_data); //Updated client topology info

    //Parse -> draw for updates to the topology
    parse(topo_data, function(parsed_topo){
      generate_topo(parsed_topo); //Pass the parsed topology to graphics
    });

  });



  //Error is received from the server
  socket.on('err', function(e){
    console.log(e);
  });

});
