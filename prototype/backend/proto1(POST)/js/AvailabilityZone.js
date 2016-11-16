"use strict";

module.exports = class AvailabilityZone {
  constructor(){
    this.name = null;
    this.subnets = [];
  }

  addSubnet(s){
    this.subnets.forEach(function(sn){
      if(sn.getNetId() == s.getNetId())
        return;
    });
    this.subnets.push(s);
  }

  delSubnet(s){
    if(typeof(s) == "string"){
      this.subnets.forEach(function(sn, i){
        if(s.getNetId() == sn.getNetId()){
          this.subnets.slice(i, i+1);
        }
      });
    }
    else if (typeof(s) == "number"){
      this.subnets.slice(s, s+1);
    }
  }

  setName(n){
    this.name = n;
  }

  getName(){
    return this.name;
  }

  getSubnets(s){
    var val;
    this.subnets.forEach(function(sn, index){
      if(s.netid == sn.netid)
        return this.subnets.at(index);
    });
  }

  getSubnets(){
    return this.subnets;
  }
}
