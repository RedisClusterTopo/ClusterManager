$(document).ready(function () {
  //request a socket
  var socket = io('http://localhost:8080');
  //when the server says we can have a socket pass the cluster info to the server
  //cluster data is a hardcoded value that will be changed later
  //we will take the login information from the user and create this object to connect to a cluster
  var clusterData = ["stack","cmpsc484cluster"]
  socket.on('init', function (data) {
    console.log(data);
    socket.emit('socket response',clusterData);
  });
  //wait for the server to get our data from the cluster
  socket.on('clusterDataReady' function(clusterObject){
    console.log(clusterObject);
    //TODO parse object emit repsonse pass or fail based on parse findings.
  })

function myFunction() {
    document.getElementById("myDropdown").classList.toggle("show");
}
