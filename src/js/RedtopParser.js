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

    this.invertClusterNodes(redisInfo, function (invertedNodeView, discrepancies) {
      if (local) {
        _this._parseLocal(ec2info, invertedNodeView, discrepancies, function (rt) {
          clusterState.redtop = rt
          _this._evalClusterState(clusterState.redtop, function (errors) {
            clusterState.stateErrors = errors
            clusterState.stateErrors.discrepancies = discrepancies

            cb(clusterState)
          })
        })
      } else {
        _this._parseRedtop(ec2info, invertedNodeView, discrepancies, function (rt) {
          clusterState.redtop = rt
          _this._evalClusterState(clusterState.redtop, function (flags) {
            clusterState.stateErrors = flags
            clusterState.stateErrors.discrepancies = discrepancies
          })
          cb(clusterState)
        })
      }
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

    var discrepancies = []

    redisInfo.active.forEach(function (nodeResponse) {
      discrepancies.push({
        id: nodeResponse.id,
        noAddrList: [], // list of IDs which have no address associated
        differentID: [] // { whatTheNodeShouldSee: ID, whatTheNodeSees: ID }
      })

      nodeResponse.clusterNodes.split('\n').forEach(function (line) {
        var lineArray = line.split(' ')
        var curNodeId = lineArray[0] // the current node ID being inspected
        // prevent reading blank lines
        if (curNodeId.length > 0) {
          var curNodeHost = lineArray[1].split(':')[0]
          var curNodePort = lineArray[1].split(':')[1]
          if (curNodePort.includes('@')) curNodePort = curNodePort.split('@')[0]
          var lowerHash = null
          var upperHash = null
          var masterNode = null
          // no host found in the line
          if (curNodeHost.length === 0) {
            // add the current line node to the reporting nodes' list of noAddr IDs
            discrepancies.find(function (e) { return e.id === nodeResponse.id })
                  .noAddrList.push(curNodeId)

            return
          }

          if (lineArray[2].includes('master') && lineArray[8] != null) {
            lowerHash = lineArray[8].split('-')[0]
            upperHash = lineArray[8].split('-')[1]
          } else {
            masterNode = lineArray[3]
          }

          var isMaster = false
          if (lineArray[2].includes('master')) isMaster = true

          // Add an entry if needed
          if (outLookingIn.filter(function (e) { return e.host === curNodeHost && e.port === curNodePort }).length === 0) {
            outLookingIn.push({
              id: curNodeId,
              host: curNodeHost,
              port: curNodePort,
              lowerHash: lowerHash,
              upperHash: upperHash,
              masterNode: masterNode,
              isMaster: isMaster,
              clusterState: nodeResponse.info[0].split(':')[1].split('\r')[0],
              pfailCount: nodeResponse.info[3].split(':')[1].split('\r')[0],
              failCount: nodeResponse.info[4].split(':')[1].split('\r')[0],
              knownCount: nodeResponse.info[5].split(':')[1].split('\r')[0],
              normal: [],
              pfail: [],
              fail: [],
              connecting: []
            })
          }

          if (isMaster) {
            outLookingIn.find(function (e) { return e.id === curNodeId })
                        .isMaster = true
          }

          var curReportedNode = outLookingIn.find(function (e) { return e.host === curNodeHost && e.port === curNodePort })

          if (curReportedNode.masterNode == null || curReportedNode.masterNode === '-') {
            if (masterNode != null && masterNode !== '-') curReportedNode.masterNode = masterNode
          }

          if (curNodeId !== curReportedNode.id) {
            discrepancies.find(function (e) { return e.id === nodeResponse.id })
                  .differentID.push({
                    sees: curNodeId,
                    shouldSee: curReportedNode.id
                  })
          }

          if (curReportedNode != null) {
            if (line.includes('handshake')) {
              curReportedNode.connecting.push(nodeResponse.id)
            } else if (line.includes('myself')) {
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

    cb(outLookingIn, discrepancies)
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
      noExternalReplication: [], // List of masters not replicated outside AZ
    }

    redtop.getMasters().forEach(function (node) {
      var replicated = false
      redtop.getSlaves().forEach(function (slave) {
        if (slave.replicates === node.id) {
          var sameZone = redtop.compareZones(node, slave)
          if (!sameZone) replicated = false
        }
      })

      if (!replicated) {
        flags.noExternalReplication.push(node.id)
      }
    })

    cb(flags)
  }

  _parseRedtop (ec2info, invertedNodeView, discrepancies, cb) {
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

    _this._createNodes(invertedNodeView, discrepancies, function (nodeList) {
      nodeList.forEach(function (node) {
        var inst = t.getInstances().find(function (e) { return e.ip === node.host })
        if (inst) inst.addNode(node)
      })
    })

    // remove empty non-leaf nodes from topology (bottom up)
    _this._cleanInstances(t, function (redtop) {
      _this._cleanSubnets(redtop, function (redtop) {
        _this._cleanAvailabilityZones(redtop, function (redtop) {
          cb(redtop)
        })
      })
    })
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

  _parseLocal (redtop, invertedNodeView, discrepancies, cb) {
    var t = new RedTop()
    var az = new AwsAvailabilityZone()
    var sn = new AwsSubnet()
    var inst = new Ec2Instance()

    az.setName(redtop.zones[0].name)
    sn.setNetID(redtop.zones[0].subnets[0].netid)
    inst.setId(redtop.zones[0].subnets[0].instances[0].id)

    this._createNodes(invertedNodeView, discrepancies, function (nodeList) {
      nodeList.forEach(function (node) {
        inst.addNode(node)
      })
      sn.addInstance(inst)
      az.addSubnet(sn)
      t.addAvailabilityZone(az)

      cb(t)
    })
  }

  _createNodes (invertedNodeView, discrepancies, cb) {
    var nodeList = []

    var masters = invertedNodeView.filter(function (e) { return e.isMaster })
    masters.forEach(function (master) {
      var newMaster = new ClusterNode()
      newMaster.setHost(master.host)
      newMaster.setPort(master.port)
      newMaster.setID(master.id)
      newMaster.addHash({lower: master.lowerHash, upper: master.upperHash})
      newMaster.setRole('Master')
      newMaster.name = master.id

      if (master.normal.length > 0 && master.pfail.length === 0 && master.fail.length === 0 && master.connecting.length === 0) {
        newMaster.state = 'NORMAL'
      } else if (master.normal.length === 0 && master.pfail.length > 0 && master.fail.length === 0 && master.connecting.length === 0) {
        newMaster.state = 'PFAIL'
      } else if (master.normal.length === 0 && master.pfail.length === 0 && master.fail.length > 0 && master.connecting.length === 0) {
        newMaster.state = 'FAIL'
      } else if (master.normal.length === 0 && master.pfail.length === 0 && master.fail.length === 0 && master.connecting.length > 0) {
        newMaster.state = 'CONNECTING'
      } else if (master.normal.length === 0 && master.pfail.length === 0 && master.fail.length === 0 && master.connecting.length === 0) {
        newMaster.state = 'FAIL'
      } else {
        newMaster.state = 'SPLIT'
      }

      invertedNodeView.filter(function (e) { return e.masterNode === master.id }).forEach(function (s) {
        newMaster.addSlave(s.id)
      })

      newMaster.failCount = master.failCount
      newMaster.pfailCount = master.pfailCount
      newMaster.knownCount = master.knownCount
      newMaster.seesNormal = master.normal
      newMaster.seesPfail = master.pfail
      newMaster.seesFail = master.fail
      newMaster.seesConnecting = master.connecting
      nodeList.push(newMaster)
    })

    var slaves = invertedNodeView.filter(function (e) { return !e.isMaster }) // get slaves that repicate this master
    slaves.forEach(function (slave) {
      var master = invertedNodeView.find(function (e) { return e.id === slave.masterNode })
      var newSlave = new ClusterNode()
      newSlave.setHost(slave.host)
      newSlave.setPort(slave.port)
      newSlave.setRole('Slave')
      newSlave.setID(slave.id)
      if (master) {
        newSlave.addHash({lower: master.lowerHash, upper: master.upperHash})
        newSlave.setReplicates(master.id)
      }

      newSlave.name = slave.id

      if (slave.normal.length > 0 && slave.pfail.length === 0 && slave.fail.length === 0 && slave.connecting.length === 0) {
        newSlave.state = 'NORMAL'
      } else if (slave.normal.length === 0 && slave.pfail.length > 0 && slave.fail.length === 0 && slave.connecting.length === 0) {
        newSlave.state = 'PFAIL'
      } else if (slave.normal.length === 0 && slave.pfail.length === 0 && slave.fail.length > 0 && slave.connecting.length === 0) {
        newSlave.state = 'FAIL'
      } else if (slave.normal.length === 0 && slave.pfail.length === 0 && slave.fail.length === 0 && slave.connecting.length > 0) {
        newSlave.state = 'CONNECTING'
      } else if (slave.normal.length === 0 && slave.pfail.length === 0 && slave.fail.length === 0 && slave.connecting.length === 0) {
        newSlave.state = 'FAIL'
      } else {
        newSlave.state = 'SPLIT'
      }

      newSlave.failCount = slave.failCount
      newSlave.pfailCount = slave.pfailCount
      newSlave.knownCount = slave.knownCount
      newSlave.seesNormal = slave.normal
      newSlave.seesPfail = slave.pfail
      newSlave.seesFail = slave.fail
      nodeList.push(newSlave)
    })

    /*
    discrepancies:
      id: reporting node ID,
      noAddrList: IDs this node sees with no address associated,
      differentID: a report of the ID the node should see for a given host/port,
            and the one it actually sese
    */
    discrepancies.forEach(function (dis) {
      if (dis.noAddrList.length > 0) {
        dis.noAddrList.forEach(function (noAddrId) {
          nodeList.find(function (e) { return e.id === dis.id })
                    .noAddr.push(noAddrId)
        })
      } else if (dis.differentID.length > 0) {
        dis.differentID.forEach(function (view) {
          // view = {sees : ID, shouldSee: ID}
          var n = nodeList.nodes.find(function (e) { return e.id === view.shouldSee })
          n.state = 'SPLIT'
          n.splitView.push({id: dis.id, sees: view.sees})
        })
      }
    })
    cb(nodeList)
  }
}
