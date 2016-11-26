"use strict";

class TopoCluster {
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
    console.log(this.getAvailabilityZones(az));
  }

  delSubnet(s, az){
    this.getAvailabilityZones(az).delSubnet(s);
  }

  addInstance(i, s, az){
    this.getAvailabilityZones(az).getSubnets(s).addInstance(i);
  }

  delInstance(i, s, az){
    this.getAvailabilityZones(az).getSubnets(s).delInstance(i);
  }

  addNode(n, i, s, az){
    this.getAvailabilityZones(az).getSubnets(s).getInstance(i).addNode(n);
  }

  delNode(n, i, s, az){
    this.getAvailabilityZones(az).getSubnets(s).getInstance(i).delNode(n);
  }

  getAvailabilityZones(i){
    if(i){
      this.zones.forEach(function(z, index){
        if(z.name == i.name){
          return this.zones.at(index);
        }
      });
    }
    else {
      return this.zones;
    }
  }

  getSubnets(i){
    if (i){
      var val;
      this.zones.forEach(function(az){
        az.getSubnets.forEach(function(sn, index){
          if(sn.netid == i.netid)
            return az.subnets.at(index);
        });
      });
    }
    else {
      var subnets = [];
      this.zones.forEach(function(az){
        az.getSubnets().forEach(function(net){
          subnets.push(net);
        });
      });
      return subnets;
    }
  }

  getInstances(i){
    if(i){
      var nets = this.getSubnets();
      nets.forEach(function(net){
        net.getInstance().forEach(function(inst, index){
          if(inst.id == i.id)
            return net.instances.at(index);
        });
      });
    }
    else {
      var instances = []
      var nets = this.getSubnets();
      nets.forEach(function(net){
        net.instances.forEach(function(inst){
          val.push(inst);
        })
      });
      return instances;
    }
  }

  getNodes(i){
    if(i){

    }
    else{
      var inst = this.getInstances();
      inst.forEach(function(instance){

      });
    }
    this.getNodes().forEach(function(n, index){
      if(i.host == n.host && i.port == n.port)
        val = n;
    });
  }
};
