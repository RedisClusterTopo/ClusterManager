"use strict";

module.exports = class TopoNode {

  constructor(){
    this.priv_host = null;
    this.pub_host = null;
    this.port = null;
    this.type = null;
    this.replicates = null;
  }

  getPublicHost(){
    return this.pub_host;
  }

  getPrivateHost(){
    return this.priv_host;
  }

  getPort(){
    return this.port;
  }

  getReplicates(){
    return this.replicates;
  }

  setHost(h){
    this.host = h;
  }

  setPort(p){
    this.port = p;
  }

  setReplicates(r){
    this.replicates = r;
  }
}
