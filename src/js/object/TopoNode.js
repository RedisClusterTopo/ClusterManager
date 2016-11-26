"use strict";

class TopoNode {

  constructor(){
    this.host = null;
    this.port = null;
    this.type = null;
    this.replicates = null;
    this.hash = []; //Array of objects with start and end hash slots to handle
                    //Nodes which serve a non-contiguous hash range
    this.slaves = [];
  }

  getHash(){
    return this.hash;
  }

  setHash(h){
    this.hash = h;
  }

  getType(){
    return this.type;
  }

  setType(t){
    this.type = t;
  }

  addSlave(s){
    if(this.type == 'master'){
      if(s){
        this.slaves.forEach(function(slave){
          if(slave != s){
            this.slaves.push(s);
          }
        });
      }
      else {
        return;
      }
    }
  }

  delSlave(s){
    if(this.type == 'master'){
      if(s){
        this.slaves.forEach(function(slave, i){
          this.slaves.splice(i, 1);
        });
      }
      else{
        return;
      }
    }
  }

  getSlaves(){
    if(this.type == 'master'){
      return this.slaves;
    }
  }

  getPort(){
    return this.port;
  }

  getReplicates(){
    if(this.type == 'slave'){
      return this.replicates;
    }
  }

  setHost(h){
    this.host = h;
  }

  setPort(p){
    this.port = p;
  }

  setReplicates(r){
    if(this.type == 'slave'){
      this.replicates = r;
    }
  }
}
