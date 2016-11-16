"use strict";

module.exports = class TopoInstance {

  constructor(){
    this.id = null;
    this.ip = null;
    this.nodes = [];
  }

  addNode(n){
    this.nodes.forEach(function(node){
      if(node.getHost() == n.getHost() && node.getPort() == n.getPort()){
        return;
      }
    });
    this.nodes.add(n);
  }

  delNode(n){
    if(typeof(n) == "string"){
      this.nodes.forEach(function(node, i){
        if(node.getHost() == n.getHost())
          this.nodes.slice(i, i+1);
      });
    }
    else if (typeof(n) == "number"){
      this.nodes.slice(n, n+1);
    }
  }

  setId(i){
    this.id = i;
  }

  getId(){
    return this.id;
  }

  setIp(ip){
    this.ip = ip;
  }

  getIp(){
    return this.ip;
  }

  getNodes(){
    return this.nodes;
  }
}
