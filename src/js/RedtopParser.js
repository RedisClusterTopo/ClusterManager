'use strict'

var RedTop = require('./RedTop.js')
var AwsAvailabilityZone = require('./AwsAvailabilityZone.js')
var AwsSubnet = require('./AwsSubnet.js')
var Ec2Instance = require('./Ec2Instance.js')
var ClusterNode = require('./ClusterNode.js')

module.exports = class RedtopParser {

  parse (ec2info, redisInfo,failFlags, local, cb) {
    var clusterState = {
      redtop: null,
      stateErrors: null, // A list of possible errors in the cluster and the associated nodes
      failFlags: null,//split brain information
      pfailFlags: null,//split brain information
      splitBrain: 0//boolean flag to determine split brain
    }

    if (local) {
            var _this = this
      this._parseLocal(ec2info, redisInfo,function(rt){
        clusterState.redtop = rt
      _this._evalClusterState(clusterState.redtop, function (errors) {
        clusterState.stateErrors = errors
        _this._checkSplitBrain(failFlags,function(ff,pff,sb)
        {
          clusterState.failFlags = ff
          clusterState.pfailFlags = pff
          clusterState.splitBrain = sb
          console.log("cluster state has been evaluated")
          cb(clusterState)
        })
      })
      })
    }
    else{
    this._parseRedtop(ec2info, redisInfo, function (rt) {
      clusterState.redtop = rt
    })
  }
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

  _parseLocal (redtop, redisInfo, cb) {
    if (!redisInfo) return
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
      master.failFlags.forEach(function(ff){
          newMaster.addFailFlag(ff)
      })
      master.slaves.forEach(function (slave) {
        var newSlave = new ClusterNode()
        newSlave.setHost(slave.ip)
        newSlave.setPort(slave.port)
        newSlave.setRole('Slave')
        newSlave.setID(slave.id)
        newSlave.addHash({lower: master.lowerHash, upper: master.upperHash})
        newMaster.addSlave(slave.id)
        newSlave.setReplicates(master.id)
        inst.addNode(newSlave)
      })
      inst.addNode(newMaster)
    })
    sn.addInstance(inst)
    az.addSubnet(sn)
    t.addAvailabilityZone(az)
    cb(t)
  }

  _checkSplitBrain(failFlags,cb)
  {
    //console.log("The fail flags array monstrosity" + failFlags[0])
    var failFlags = failFlags
    var ff = []
    var pff = []
    var sb = 0
    var count = 0
          //console.log("Check split brain " + failFlags.length)
    failFlags.forEach(function(node){
        //console.log("Failflags: " +failFlags)
        var countFail = 0;
        var countpFail = 0;
        var oNode = node
        //console.log("node inside first forEach " + node)
        node.forEach(function(flag){
          var flag = flag
          var matchFound = 0
          //console.log("2Failflags: " +failFlags)
          //var ifailFlags = ofailFlags;
          failFlags.forEach(function(iNode){
            var iNode = iNode
             for (var i = 0 ; count<oNode.length; count++)
             {
                //if nodes have the same node marked as pfail and fail
                if(flag[0] != iNode[i][0])
                {
                    if(flag[2] == iNode[i][2])//failures for the same node
                    {
                      if(flag[1].includes("fail?"))
                      {
                          pff.push(node)
                      }
                      else {
                        ff.push(node)
                      }
                      if(flag[1] != iNode[i][1])//fail flags differ for the same node
                      {
                      //  console.log("split brain detected")
                        sb =1
                      }
                    }
                }
              }
          })
          if(!matchFound)
          {
            //console.log("split brain detected")
            sb = 1
            if(flag[1].includes("fail?"))
            {
                pff.push(node)
            }
            else {
              ff.push(node)
            }
          }
        })
    })
    cb(ff,pff,sb)
  }
}
