'use strict'

var RedTop = require('./RedTop.js')
var AwsAvailabilityZone = require('./AwsAvailabilityZone.js')
var AwsSubnet = require('./AwsSubnet.js')
var Ec2Instance = require('./Ec2Instance.js')
var ClusterNode = require('./ClusterNode.js')

module.exports = class RedtopParser {

  parse (ec2info, redisInfo, local, cb) {
    var _this = this

    var clusterState = {
      redtop: null,
      stateErrors: null // A list of possible errors in the cluster and the associated nodes
    }

    this.invertClusterNodes(redisInfo, function (invertedNodeView) {
      if (local) {
        clusterState.redtop = _this._parseLocal(ec2info, invertedNodeView) // Translate JSON -> redtop

        _this._evalClusterState(clusterState.redtop, function (errors) {
          clusterState.stateErrors = errors
        })
      } else {
        _this._parseRedtop(ec2info, redisInfo, function (rt) {
          clusterState.redtop = rt
        })

        _this._evalClusterState(clusterState.redtop, function (flags) {
          clusterState.stateErrors = flags
        })
      }

      cb(clusterState)
    })
  }

  // Take the aggregation of responses to 'cluster nodes' commands for each node in the
  // cluster and invert to return an object which reports what every other node in the cluster sees
  // for a given node (rather than what each node thinks about every other node)
  invertClusterNodes (redisInfo, cb) {
    /*
    objects in the outLookingIn array follow this form:
      {
        id: the ID of the node being reported on
        host: the node's host address
        port: the port over which this node is running
        normal: a list of IDs which report this node as functioning normally
        pfail: a list of IDs which report this node as 'fail?'
        fail: a list of IDs which report this node as 'fail'
        connecting: a list of IDs which report this node as in 'handshake'
      }
    */
    var outLookingIn = []

    redisInfo.masters.forEach(function (nodeResponse) {
      nodeResponse.clusterNodes.split('\n').forEach(function (line) {
        var lineArray = line.split(' ')
        var curNodeId = lineArray[0] // the current node ID being inspected

        if (curNodeId.length > 0) {
          var curNodeHost = lineArray[1].split(':')[0]
          var curNodePort = lineArray[1].split(':')[1].split('@')[0]

          // Add an entry if needed
          if (outLookingIn.filter(function (e) { return e.host === curNodeHost && e.port === curNodePort }).length === 0) {
            outLookingIn.push({
              id: curNodeId,
              host: curNodeHost,
              port: curNodePort,
              normal: [],
              pfail: [],
              fail: [],
              connecting: []
            })
          }

          var curReportedNode = outLookingIn.find(function (e) { return e.host === curNodeHost && e.port === curNodePort })
          if (curNodeId === curReportedNode.id) console.log('UH OH UH OH UH OH UH OH UH OH UH OH UH OH UH OH UH OH ')
          // console.log(curNodeId === curReportedNode.id)

          if (curReportedNode != null) {
            if (line.includes('handshake')) {
              curReportedNode.connecting.push(nodeResponse.id)
            } if (line.includes('myself')) {
              curReportedNode.normal.push(nodeResponse.id)
            } else if (line.includes('fail?')) {
              curReportedNode.pfail.push(nodeResponse.id)
            } else if (line.includes('fail')) {
              curReportedNode.fail.push(nodeResponse.id)
            } else {
              curReportedNode.normal.push(nodeResponse.id)
            }
          }
        }
      })
    })
    redisInfo.slaves.forEach(function (nodeResponse) {
      nodeResponse.clusterNodes.split('\n').forEach(function (line) {
        var lineArray = line.split(' ')
        var curNodeId = lineArray[0] // the current node ID being inspected

        if (curNodeId.length > 0) {
          var curNodeHost = lineArray[1].split(':')[0]
          var curNodePort = lineArray[1].split(':')[1].split('@')[0]

          // Add an entry if needed
          if (outLookingIn.filter(function (e) { return e.host === curNodeHost && e.port === curNodePort }).length === 0) {
            outLookingIn.push({
              id: curNodeId,
              host: curNodeHost,
              port: curNodePort,
              normal: [],
              pfail: [],
              fail: [],
              connecting: []
            })
          }

          var curReportedNode = outLookingIn.find(function (e) { return e.host === curNodeHost && e.port === curNodePort })
          // console.log(curNodeId === curReportedNode.id)

          if (curReportedNode != null) {
            if (line.includes('handshake')) {
              curReportedNode.connecting.push(nodeResponse.id)
            } if (line.includes('myself')) {
              curReportedNode.normal.push(nodeResponse.id)
            } else if (line.includes('fail?')) {
              curReportedNode.pfail.push(nodeResponse.id)
            } else if (line.includes('fail')) {
              curReportedNode.fail.push(nodeResponse.id)
            } else {
              curReportedNode.normal.push(nodeResponse.id)
            }
          }
        }
      })
    })

    cb(outLookingIn)
  }

  // Used to collect ip/port info for cluster nodes from instance tags
  // Input: an array of ec2info
  parseNodesByInstanceInfo (ec2info, cb) {
    var nodeInfo = []
    ec2info.forEach(function (instance) {
      instance.Tags.forEach(function (tag) {
        if (tag.Key.toUpperCase() === 'MASTER' || tag.Key.toUpperCase() === 'SLAVE') {
          var node = {}
          node.host = instance.PrivateIpAddress
          node.port = tag.Value
          nodeInfo.push(node)
        }
      })
    })
    cb(nodeInfo)
  }

  _evalClusterState (redtop, cb) {
    if (!redtop) cb()

    var flags = {
      noExternalReplication: [] // List of masters not replicated outside AZ
    }

    redtop.getMasters().forEach(function (node) {
      var replicated = false
      redtop.getSlaves().forEach(function (slave) {
        // check each slaves' replicates field against the master's id
        if (slave.replicates === node.id) {
          // check that the master and slave who replicates it are in different AZ
          if (redtop.getAvailabilityZoneByNodeID(slave.replicates) !== redtop.getAvailabilityZoneByNodeID(node.id)) {
            replicated = true
          }
        }
      })

      if (!replicated) {
        flags.noExternalReplication.push(node.id)
      }
    })

    cb(flags)
  }

  _parseRedtop (ec2info, redisInfo, cb) {
    // Object to parse data into
    var t = new RedTop()
    var _this = this

    // use ec2info to add AZ, Subnet, Instances
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

    // append cluster nodes
    redisInfo.nodes.masters.forEach(function (master, index) {
      var newMaster = new ClusterNode()

      newMaster.setHost(master.ip)
      newMaster.setPort(master.port)
      newMaster.setID(master.id)
      newMaster.addHash({lower: master.lowerHash, upper: master.upperHash})
      newMaster.setRole('Master')
      // create slaves for given master
      master.slaves.forEach(function (slave) {
        var newSlave = new ClusterNode()
        newSlave.setHost(slave.ip)
        newSlave.setPort(slave.port)
        newSlave.setID(slave.id)
        newSlave.setRole('Slave')
        newSlave.addHash({lower: master.lowerHash, upper: master.upperHash})
        newMaster.addSlave(slave.id)
        newSlave.setReplicates(master.id)
        t.getInstances().forEach(function (instance) {
          if (instance.ip === slave.ip) instance.addNode(newSlave) // add slave to correct instance
        })
      })

      t.getInstances().forEach(function (instance) {
        if (instance.ip === master.ip) {
          instance.addNode(newMaster) // add master to correct instance
        }
      })
    })

    // remove empty non-leaf nodes from topology (bottom up)
    _this._cleanInstances(t, function (redtop) {
      _this._cleanSubnets(redtop, function (redtop) {
        _this._cleanAvailabilityZones(redtop, function (redtop) {
          t = redtop
        })
      })
    })

    cb(t)
  }

  _cleanInstances (redtop, cb) {
    redtop.getAvailabilityZones().forEach(function (az, i) {
      az.getSubnets().forEach(function (sn, j) {
        sn.getInstances().forEach(function (inst, k) {
          if (inst.getNodes().length === 0) redtop.delInstance(inst, sn, az)
        })
      })
    })

    cb(redtop)
  }

  _cleanSubnets (redtop, cb) {
    redtop.getAvailabilityZones().forEach(function (az, i) {
      az.getSubnets().forEach(function (sn, j) {
        if (sn.getInstances().length === 0) redtop.delSubnet(sn, az)
      })
    })
    cb(redtop)
  }

  _cleanAvailabilityZones (redtop, cb) {
    redtop.getAvailabilityZones().forEach(function (az, i) {
      if (az.getSubnets().length === 0) redtop.delAvailabilityZone(az)
    })
    cb(redtop)
  }

  _parseLocal (redtop, invertedNodeView) {
    var t = new RedTop()
    var az = new AwsAvailabilityZone()
    var sn = new AwsSubnet()
    var inst = new Ec2Instance()
    az.setName(redtop.zones[0].name)
    sn.setNetID(redtop.zones[0].subnets[0].netid)
    inst.setId(redtop.zones[0].subnets[0].instances[0].id)

    sn.addInstance(inst)
    az.addSubnet(sn)
    t.addAvailabilityZone(az)
    return t
  }
}
