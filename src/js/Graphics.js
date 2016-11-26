//code to allow the svg elements to be draggable
	  var selectedElement = 0;
	  var currentX = 0;
	  var currentY = 0;
	  var currentMatrix = 0;
	  function selectElement(evt) {
	    selectedElement = evt.target;
	    currentX = evt.clientX;
	    currentY = evt.clientY;
	    currentMatrix = selectedElement.getAttributeNS(null, "transform").slice(7,-1).split(' ');
      selectedElement.setAttributeNS(null, "onmouseout", "deselectElement(evt)");
      selectedElement.setAttributeNS(null, "onmouseup", "deselectElement(evt)");
	      for(var i=0; i<currentMatrix.length; i++) {
	        currentMatrix[i] = parseFloat(currentMatrix[i]);
	      }
	    selectedElement.setAttributeNS(null, "onmousemove", "moveElement(evt)");
	  }
    function moveElement(evt){
	  dx = evt.clientX - currentX;
	  dy = evt.clientY - currentY;
	  currentMatrix[4] += dx;
	  currentMatrix[5] += dy;
	  newMatrix = "matrix(" + currentMatrix.join(' ') + ")";
	  selectedElement.setAttributeNS(null, "transform", newMatrix);
	  currentX = evt.clientX;
	  currentY = evt.clientY;
	}
  function deselectElement(evt){
	  if(selectedElement != 0){
	    selectedElement.removeAttributeNS(null, "onmousemove");
	    selectedElement.removeAttributeNS(null, "onmouseout");
	    selectedElement.removeAttributeNS(null, "onmouseup");
	    selectedElement = 0;
	  }
	}
// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {

    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

//MAIN GRAPHICS FUNCTION CALL
function generate_topo(){

}
