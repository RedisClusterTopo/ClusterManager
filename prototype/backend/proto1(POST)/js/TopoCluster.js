"use strict";

module.exports = class TopoCluster {
  constructor(){
    this.zones = [];
  }


  //Checks for unique AvailabilityZone name
  addAvailabilityZone(az) {
    this.zones.forEach(function(zone){
      if (zone.getName() == az.getName())
        return;
    });
    this.zones.push(az);
  }

  //Supports a string arg to remove by name or remove by index
  delAvailabilityZone(az) {
    if(typeof(az) == "string"){
      this.zones.forEach(function(z, i){
        if(z.getName() == az.getName())
          this.zones.slice(i, i+1);
      });
    }
    else if (typeof(az) == "number"){
      this.zones.slice(az, az+1);
    }
  }

  addSubnet(s, az){

  }

  delSubnet(s, az){

  }

  addInstance(i, s, az){

  }

  delInstance(i, s, az){

  }

  addNode(n, i, s, az){

  }

  delNode(n, i, s, az){

  }

  getAvailabilityZones(i){
    if(i){
      var val;
      this.zones.forEach(function(z, index){
        if(z.name == i.name){
          val = z;
        }
      });
      return val;
    }
    else {
      return this.zones;
    }
  }

  getSubnets(i){
    if (i){
      var val;
      this.zones.forEach(function(az){
        az.subnets.forEach(function(sn){
          if(sn.netid == i.netid)
            val = sn;
        });
      });
      return val;
    }
    else {
      var subnets = [];
      this.zones.forEach(function(az){
        az.subnets.forEach(function(net){
          //console.log(net);
          subnets.push(net);
        });
      });
      return subnets;
    }
  }

  getInstances(i){
    if(i){
      var val;
      var nets = this.getSubnets();
      nets.forEach(function(net){
        net.instances.forEach(function(inst){
          if(inst.id == i.id)
            val = inst;
        })
      });
      return val;
    }
    else {
      val = []
      var nets = this.getSubnets();
      nets.forEach(function(net){
        net.instances.forEach(function(inst){
          val.push(inst);
        })
      });
      return val;
    }
  }

  getNodes(){
    var nodes = [];
    var instances = this.getInstances();
    instances.forEach(function(inst){
      inst.getNodes().forEach(function(n){
        nodes.push(n);
      });
    });
    return nodes;
  }

  getNodes(i){
    var val;
    this.getNodes().forEach(function(n, index){
      if(i.host == n.host && i.port == n.port)
        val = n;
    });
    return val;
  }
};
