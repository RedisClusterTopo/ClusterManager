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


// MAIN GRAPHICS FUNCTION CALL
function generate_topo(data){
	//Clear the html body
	$('body').empty();

	// transform data into acceptable object format for d3
	data.name = "Cluster root";

	data.children = data.getAvailabilityZones();
	delete data.zones;

	data.children.forEach(function(z){
		z.children = z.getSubnets();
		delete z.subnets;
		z.children.forEach(function(net){
			net.name = net.netid;
			delete net.netid;

			net.children = net.getInstances();
			delete net.instances;

			net.children.forEach(function(inst){
				inst.name = inst.ip;
				delete inst.ip;
				inst.children = inst.getNodes();
				delete inst.nodes;

				inst.children.forEach(function(n){
					n.name = n.port;
					n.children = null;
				});
			});
		});
	});

	// console.log('data');
	// console.log(data);

		// set the dimensions and margins of the diagram
	var margin = {top: 40, right: 90, bottom: 50, left: 90},
	    width = 660 - margin.left - margin.right,
	    height = 500 - margin.top - margin.bottom;

	// declares a tree layout and assigns the size
	var treemap = d3.tree()
	    .size([width, height]);

	//  assigns the data to a hierarchy using parent-child relationships
	var nodes = d3.hierarchy(data);

	// maps the node data to the tree layout
	nodes = treemap(nodes);

	// append the svg obgect to the body of the page
	// appends a 'group' element to 'svg'
	// moves the 'group' element to the top left margin
	var svg = d3.select("body").append("svg")
	      .attr("width", width + margin.left + margin.right)
	      .attr("height", height + margin.top + margin.bottom),
	    g = svg.append("g")
	      .attr("transform",
	            "translate(" + margin.left + "," + margin.top + ")");

	// adds the links between the nodes
	var link = g.selectAll(".link")
	    .data( nodes.descendants().slice(1))
	  .enter().append("path")
	    .attr("class", "link")
	    .attr("d", function(d) {
	       return "M" + d.x + "," + d.y
	         + "C" + d.x + "," + (d.y + d.parent.y) / 2
	         + " " + d.parent.x + "," +  (d.y + d.parent.y) / 2
	         + " " + d.parent.x + "," + d.parent.y;
	       });

	// adds each node as a group
	var node = g.selectAll(".node")
	    .data(nodes.descendants())
	  .enter().append("g")
	    .attr("class", function(d) {
	      return "node" +
	        (d.children ? " node--internal" : " node--leaf"); })
	    .attr("transform", function(d) {
	      return "translate(" + d.x + "," + d.y + ")"; });

	// adds the circle to the node
	node.append("circle")
	  .attr("r", 10);

	// adds the text to the node
	node.append("text")
	  .attr("dy", ".35em")
	  .attr("y", function(d) { return d.children ? -20 : 20; })
	  .style("text-anchor", "middle")
	  .text(function(d) { return d.data.name; });
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
