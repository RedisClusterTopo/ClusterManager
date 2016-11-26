
function parse(topo_data, done){
  //Object to parse data into
  var t = new TopoCluster();

  topo_data.ec2info.forEach(function(inst, i){

    //TODO: Rework data structure to have all method calls coming from the
        //TopoCluster object
    //Build a parsed object to be forwarded to graphics generation

  });

  done(t);

}
