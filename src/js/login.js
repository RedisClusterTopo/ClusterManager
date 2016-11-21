//Define socket connection to server
var socket = io('http://localhost:8080');

socket.on('tag-response', function (data) {
  //data contains raw ec2 instance data with tag matching the given key/val
  console.log(data);
});



$(document).ready(function(){
  var keyBox = $('#keyTextBox');
  var valBox = $('#valTextBox');
  var submitBtn = $('#submitBtn');


  //Collect textbox data and send to server on submit clicks
  submitBtn.click(function(){
    var tagData = {};

    tagData.key = keyBox.val();
    tagData.val = valBox.val();

    //Send key/val to server for aws query
    socket.emit('init-tag', tagData);
  });
});
