//code to allow the svg elements to be draggable
var selectedElement = 0;
var currentX = 0;
var currentY = 0;
var currentMatrix = 0;

$(document).ready(function(){
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
});


//MAIN GRAPHICS FUNCTION CALL
//Pulled from http://www.d3noob.org/2014/01/tree-diagrams-in-d3js_11.html
function generate_topo(data){
	var margin = {top: 20, right: 120, bottom: 20, left: 120},
	 width = 960 - margin.right - margin.left,
	 height = 500 - margin.top - margin.bottom;

	 var i = 0;

 var tree = d3.layout.tree()
  .size([height, width]);

 var diagonal = d3.svg.diagonal()
  .projection(function(d) { return [d.y, d.x]; });

 var svg = d3.select("body").append("svg")
  .attr("width", width + margin.right + margin.left)
  .attr("height", height + margin.top + margin.bottom)
   .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

 root = treeData[0];

 update(root);
}

function update(source) {

	// Compute the new tree layout.
	var nodes = tree.nodes(root).reverse(),
	 links = tree.links(nodes);

	// Normalize for fixed-depth.
	nodes.forEach(function(d) { d.y = d.depth * 180; });

	// Declare the nodesâ€¦
	var node = svg.selectAll("g.node")
	 .data(nodes, function(d) { return d.id || (d.id = ++i); });

	// Enter the nodes.
	var nodeEnter = node.enter().append("g")
	 .attr("class", "node")
	 .attr("transform", function(d) {
		return "translate(" + d.y + "," + d.x + ")"; });

	nodeEnter.append("circle")
	 .attr("r", 10)
	 .style("fill", "#fff");

	nodeEnter.append("text")
	 .attr("x", function(d) {
			return d.children || d._children ? -13 : 13; })
	 .attr("dy", ".35em")
	 .attr("text-anchor", function(d) {
			return d.children || d._children ? "end" : "start"; })
	 .text(function(d) {
		 //Determine what type of object is being passed
		 //Return the appropriate variable
	 })
	 .style("fill-opacity", 1);

	// Declare the links¦
	var link = svg.selectAll("path.link")
	 .data(links, function(d) { return d.target.id; });

	// Enter the links.
	link.enter().insert("path", "g")
	 .attr("class", "link")
	 .attr("d", diagonal);

}


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
