
function parse(topo_data, done){
  //Object to parse data into
  var t = new RedTop();

  topo_data.ec2info.forEach(function(inst, i){
    console.log(inst);

    var az = new AWS_AvailabilityZone();
    az.setName(inst.Placement.AvailabilityZone);
    t.addAvailabilityZone(az);

    var sn = new AWS_Subnet();
    sn.setNetId(inst.SubnetId);
    t.addSubnet(sn, az);

    var i = new EC2Instance();
    i.setId(inst.InstanceId);
    i.setIp(inst.PrivateIpAddress);
    t.addInstance(i, sn, az);

    //TODO: Build and add node objects
    inst.Tags.forEach(function(ta){
      if(ta.Key == "master" || ta.Key == "slave"){
        var n = new ClusterNode();
        n.setType(ta.Key);
        n.setHost(i.getIp());
        n.setPort(ta.Value);
        t.addNode(n, i, sn, az);
      }
    });
  });

  done(t);

}
