$(document).ready( function() {
  $('#getNodesBtn').click(
    function(){
      $.post("/getNodes", null,
          function(data){
            console.log(data);
          });
    }
  );
});
