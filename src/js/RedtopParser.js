'use strict'

var RedTop = require('./RedTop.js')
var AwsAvailabilityZone = require('./AwsAvailabilityZone.js')
var AwsSubnet = require('./AwsSubnet.js')
var Ec2Instance = require('./Ec2Instance.js')
var ClusterNode = require('./ClusterNode.js')

module.exports = class RedtopParser {

  parse (ec2info, redisInfo, local) {
    var clusterState = {
      redtop: null,
      stateErrors: null // A list of possible errors in the cluster and the associated nodes
    }

    if (local) {
      clusterState.redtop = this._parseLocal(ec2info, redisInfo)

      this._evalClusterState(ec2info, clusterState.redtop, function (errors) {
        clusterState.stateErrors = errors
      })

      return clusterState
    }

    this._parseRedtop(ec2info, redisInfo, function (rt) {
      clusterState.redtop = rt
    })

    this._evalClusterState(ec2info, clusterState.redtop, function (flags) {
      clusterState.flags = flags
    })

    return clusterState
  }

  _evalClusterState (ec2info, redtop, cb) {
    var flags = {}

    // Check for replication outside az
    // console.log(redtop)

    cb(flags)
  }

  _parseRedtop (ec2info, redisInfo) {
    // Object to parse data into
    var t = new RedTop()

    ec2info.forEach(function (inst, i) {
      var az = new AwsAvailabilityZone()
      az.setName(inst.Placement.AvailabilityZone)
      t.addAvailabilityZone(az)

      var sn = new AwsSubnet()
      sn.setNetID(inst.SubnetId)
      t.addSubnet(sn, az)

      var ec2inst = new Ec2Instance()
      ec2inst.setId(inst.InstanceId)
      ec2inst.setIp(inst.PrivateIpAddress)
      t.addInstance(ec2inst, sn, az)
    })

    return t
  }

  _parseLocal (redtop, redisInfo) {
    var t = new RedTop()
    var az = new AwsAvailabilityZone()
    var sn = new AwsSubnet()
    var inst = new Ec2Instance()
    az.setName(redtop.zones[0].name)
    sn.setNetID(redtop.zones[0].subnets[0].netid)
    inst.setId(redtop.zones[0].subnets[0].instances[0].id)

    redisInfo.nodes.masters.forEach(function (master, index) {
      var newMaster = new ClusterNode()
      var slavers = []
      newMaster.setHost(master.ip)
      newMaster.setPort(master.port)
      newMaster.setID(master.id)
      newMaster.addHash({lower: master.lowerHash, upper: master.upperHash})
      newMaster.setRole('Master')
      master.slaves.forEach(function (slave) {
        var newSlave = new ClusterNode()
        newSlave.setHost(slave.ip)
        newSlave.setPort(slave.port)
        newSlave.setRole('Slave')
        newSlave.setID(slave.id)
        newSlave.addHash({lower: master.lowerHash, upper: master.upperHash})
        // TODO: set the .replicates field of newSlave by finding its master in
        // the redtop object
        newMaster.addSlave(slave.id)
        newSlave.setReplicates(master.id)
        inst.addNode(newSlave)
      })
      inst.addNode(newMaster)
    })
    sn.addInstance(inst)
    az.addSubnet(sn)
    t.addAvailabilityZone(az)
    return t
  }
}
