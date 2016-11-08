var RedisCluster = class {
  constructor(AvailabilityZones) {
    var AvailabilityZones = Array.prototype.pop.apply(AvailabilityZones);
  }
}
var AvailabilityZone = class{
  constructor(Instances) {
    var Instances = Array.prototype.pop.apply(Instances);
  }
}
var Instance = class{
  constructor(Nodes){
    var Nodes = Array.prototype.pop.apply(Nodes);
  }
}
var Node = class{
  var ip;
  var subnet;
  var hashslotLower;
  var hashslotUpper;
  var port;
  constructor(ip,subnet,hashslotLower,hashslotUpper,port){
    this.ip = ip;
    this.subnet = subnet;
    this.hashslotLower = hashslotLower;
    this.hashslotUpper= hashslotUpper;
    this.port = port;
  }
}
var Master extends Node = class{
  constructor(){

  }
}
var Slave extends Node = class{
  constructor(){

  }
}
