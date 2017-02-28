'use strict'

var RedTop = require('./RedTop.js')
var AwsAvailabilityZone = require('./AwsAvailabilityZone.js')
var AwsSubnet = require('./AwsSubnet.js')
var Ec2Instance = require('./Ec2Instance.js')
var ClusterNode = require('./ClusterNode.js')

module.exports = class RedtopParser {

  parse (ec2info, redisInfo, local) {
    if (local) {
      return this._parseLocal(ec2info, redisInfo)
    }

    var returnVal = {
      redtop: null,
      stateErrors: null // A list of possible errors in the cluster and the associated nodes
    }

    this._parseRedtop(ec2info, redisInfo, function (rt) {
      returnVal.redtop = rt
    })

    this._evalClusterState(returnVal.redtop, redisInfo, function (flags) {
      returnVal.flags = flags
    })

    return returnVal
  }

  _evalClusterState (redtop, redisInfo, cb) {
    var flags = {}

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

// ########################################################################## //
      // TODO: parse redisInfo to build a list of nodes and their associated
      // information, then add to the correct Ec2Instance
// ########################################################################## //
    })

    return t
  }

  _parseLocal (redtop, redisInfo) {
    console.log(redisInfo)
    redisInfo.nodes.masters.forEach(function (master) {
      var newMaster = {}
      newMaster.ip = master.ip
      newMaster.port = master.port
      newMaster.hash = []
      newMaster.hash.push({lower: master.lowerHash, upper: master.upperHash})
      newMaster.slaves = []
      newMaster.type = 'Cluster Node'
      newMaster.role = 'Master'
      master.slaves.forEach(function (slave) {
        var newSlave = {}
        newSlave.ip = slave.ip
        newSlave.port = slave.port
        newSlave.id = slave.id
        newSlave.hash = []
        newSlave.role = 'Slave'
        newSlave.hash.push({lower: master.lowerHash, upper: master.upperHash})
        newSlave.replicates = newMaster
        master.slaves.push(newSlave)
        redtop.zones[0].subnets[0].instances[0].nodes.push(newSlave)
      })
      redtop.zones[0].subnets[0].instances[0].nodes.push(newMaster)
    })

    return redtop
  }
}
