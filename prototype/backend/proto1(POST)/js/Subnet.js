"use strict";

module.exports = class Subnet{
  constructor(){
    this.netid = null
    this.instances = [];
  }

/*
  constructor(netid, instances){
    this.netid = netid;
    this.instances = instances;
  }
*/
  addInstance(i){
    this.instances.forEach(function(inst){
      if(i.getId() == inst.getId()){
        return;
      }
    });
    this.instances.push(i);
  }

  delInstance(i){
    if(typeof(i) == "string"){
      this.instances.forEach(function(inst, index){
        if(inst.getId() == i.getId()){
          this.instances.slice(index, index+1);
        }
      });
    }
    else if (typeof(i) == "number"){
      this.instances.slice(index, index+1);
    }
  }

  setNetId(i){
    this.netid = i;
  }

  getNetId() {
    return this.netid;
  }

  getInstances() {
    return this.instances;
  }
}
