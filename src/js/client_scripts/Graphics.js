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


//===========================Graphics statics================================//

// set the dimensions and margins of the diagram
var margin = {top: 40, right: 90, bottom: 50, left: 90},
	width = 660 - margin.left - margin.right,
	height = 500 - margin.top - margin.bottom;

// declares a tree layout and assigns the size
var treemap = d3.tree()
	.size([width, height]);

var x = d3.scaleLinear()
  .domain([-1, width + 1])
  .range([-1, width + 1]);

var y = d3.scaleLinear()
    .domain([-1, height + 1])
    .range([-1, height + 1]);

var svg;
var g;

// MAIN GRAPHICS FUNCTION CALL
function generate_topo(data){

	svg = null;
	g = null;

	//Clear the html body
	$('p').empty();

	//Re-parse the data into d3-acceptable format
	reformat(data, function(d3_data){
		//  assigns the data to a hierarchy using parent-child relationships
		var nodes = d3.hierarchy(d3_data);

		// maps the node data to the tree layout
		nodes = treemap(nodes);

		// append the svg obgect to the body of the page
		// appends a 'group' element to 'svg'
		// moves the 'group' element to the top left margin
		svg = d3.select("p").append("svg")
		      .attr("width", width + margin.left + margin.right)
		      .attr("height", height + margin.top + margin.bottom);
	  g = svg.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

		// Uncomment the following to enable basic zoom/pan logic
		/*
			var zoom = d3.zoom()
					.scaleExtent([1, 40])
					.translateExtent([[-100, -100], [width + 90, height + 100]])
					.on("zoom", function(){
						g.attr("transform", d3.event.transform);
						g.call(d3.event.transform.rescaleX(x));
						g.call(d3.event.transform.rescaleY(y));
					});

			svg.call(zoom);
		*/

	});
}

// transform data into acceptable object format for d3
function reformat(data, callback){

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

	callback(data);
}
