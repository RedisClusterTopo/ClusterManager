function RedisCluster(AvailabilityZones) {
    this.AvailabilityZones = AvailabilityZones;
}
function AvailabilityZone(Instances)
{
    this.Instances =Instances;
}
function Instance(Nodes)
{
    this.Nodes = Nodes;
}
function Node(ip,subnet,hashslotLower,hashslotUpper,port)
{
    this.ip = ip;
    this.subnet = subnet;
    this.hashslotLower = hashslotLower;
    this.hashslotUpper= hashslotUpper;
    this.port = port;
}
