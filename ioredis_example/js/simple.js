$(document).ready( function() {
  $('#getInfoButton').click(
    function(){
      $.post("/getInfoCommand", null,
          function(data){
            console.log(data);
            $('#info').text(data);
          });
    }
  );
});
