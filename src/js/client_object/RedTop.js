"use strict";

class RedTop {
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
    this.zones.forEach(function(zone){
      if(zone.getName() == az.getName()){
        zone.addSubnet(s);
      }
    });
  }

  delSubnet(s, az){
    this.zones.forEach(function(zone){
      if(zone.getName() == az.getName()){
        zone.delSubnet(s);
      }
    });
  }

  addInstance(i, s, az){
    this.zones.forEach(function(zone){
      if(zone.getName() == az.getName()){
        zone.subnets.forEach(function(net){
          if(net.getNetId() == s.getNetId()){
            net.addInstance(i);
          }
        });
      }
    });
  }

  delInstance(i, s, az){
    this.zones.forEach(function(zone){
      if(zone.getName() == az.getName()){
        zone.subnets.forEach(function(net){
          if(net.getNetId() == s.getNetId()){
            net.delInstance(i);
          }
        });
      }
    });
  }

  addNode(n, i, s, az){
    this.zones.forEach(function(zone){
      if(zone.getName() == az.getName()){
        zone.subnets.forEach(function(net){
          if(net.getNetId() == s.getNetId()){
            net.instances.forEach(function(inst){
              if(inst.getId() == i.getId()){
                inst.addNode(n);
              }
            });
          }
        });
      }
    });
  }

  delNode(n, i, s, az){
    this.zones.forEach(function(zone){
      if(zone.getName() == az.getName()){
        zone.subnets.forEach(function(net){
          if(net.getNetId() == s.getNetId()){
            net.instances.forEach(function(inst){
              if(inst.getId() == i.getId()){
                inst.delNode(n);
              }
            });
          }
        });
      }
    });
  }

  getAvailabilityZones(){
    return this.zones;
  }

  getSubnets(az){
    if (az){
      this.zones.forEach(function(zone){
        if(zone.getName() == az.getName()){
          return zone.getSubnets();
        }
      });
    }
    else {
      var subnets = [];
      this.zones.forEach(function(zone){
        zone.getSubnets().forEach(function(net){
          subnets.push(net);
        });
      });
      return subnets;
    }
  }

  getInstances(s, az){

    //Only az is given
    if(arguments.length == 1){
      var instances = [];
      this.zones.forEach(function(zone){
        if(zone.getName() == az.getName()){
          zone.getSubnets().forEach(function(net){
            net.getInstances().forEach(function(inst){
              instances.push(inst);
            });
          });
        }
      });
      return instances;
    }
    else if (arguments.length == 2){
      this.zones.forEach(function(zone){
        if(zone.getName() == az.getName()){
          zone.getSubnets().forEach(function(net){
            if(net.getId() == s.getId()){
              return net.getInstances();
            }
          });
        }
      });
    }
    else{
      var instances = [];
      var nets = this.getSubnets();
      nets.forEach(function(net){
        net.getInstances().forEach(function(inst){
          val.push(inst);
        })
      });
      return instances;
    }
  }

  getNodes(i, sn, az){
    if(arguments.length == 3){
      this.getInstances().forEach(function(inst){
        if(inst.getId() == i.getId()){
          return inst.get
        }
      });
    }
    else if (arguments.length == 2){

    }
    else if (arguments.length == 1){

    }
    else{
      var nodes = [];
      var inst = this.getInstances();
      inst.forEach(function(instance){
        instance.getNodes().forEach(function(n){
          nodes.push(n);
        });
      });
    }
  }
};
