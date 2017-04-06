'use strict'
// Logic for ioredis
var Redis = require('ioredis')
var Commander = require('ioredis').Command

// This call will contain the functionality to get information from a rediis cluster
module.exports = class ClusterCmdManager {
  constructor (nodes) {
    this.cluster = new Redis.Cluster(nodes[0])
    this._registerListeners()
  }

  // Set up handlers for ioredis connection
  _registerListeners () {
    var _this = this

    _this.cluster.on('ready', function () {
    })

    _this.cluster.on('err', function (err) {
      console.log(err)
    })
  }

  // Cluster slots commands retuns the hash range for the entire cluster as well as node ids
  getNodes (cb) {
    var slots = new Commander('cluster', ['slots'], 'utf8', function (err, result) {
      var returnVal = {
        masters: []
      }

      if (err) console.log(err)

      result.forEach(function (masterNode) {
        var n = {
          lowerHash: null,
          upperHash: null,
          ip: null,
          port: null,
          id: null,
          failFlags:[],
          slaves: []
        }

        masterNode.forEach(function (val, i) {
          if (i === 0) n.lowerHash = val
          else if (i === 1) n.upperHash = val
          else if (i === 2) {
            n.ip = '' + val[0]
            n.port = val[1]
            n.id = '' + val[2]
          } else {
            var newSlave = {}
            newSlave.ip = '' + val[0]
            newSlave.port = val[1]
            newSlave.id = '' + val[2]
            n.slaves.push(newSlave)
          }
        })
        returnVal.masters.push(n)
      })

      cb(returnVal)
    })
    this.cluster.sendCommand(slots)
  }

  //not sure that we will need this
  getErrorFlags (node, eNodes, cb) {
    var curNode = node;
    var nodeInstance = new Redis(node.port, node.ip)
    console.log(nodeInstance)
    eNodes.forEach(function(n){
      if(curNode.id !=n.id){
          console.log(n.id)
            var masterFails = new Commander('cluster', ['COUNT-FAILURE-REPORTS',n.id], 'utf8', function (err, result) {
                if (err) console.log(err)
                curNode.failFlags.push(n.id,result)
                console.log( node.id + " " +n.id+ " " + result)
                cb();
            })
            nodeInstance.sendCommand(masterFails)
      }
    })
  }

  getClusterInfo (node,cb) {
    var curNode = node
    var nodeInstance = new Redis(curNode.port, curNode.ip)
    var clusterInfo = new Commander('cluster', ['nodes'], 'utf8', function (err, result) {
      if (err) console.log(err)
      var failFlags=[];
      var r = result.toString("utf8").split(" ")
      var count = 0
      for (var i=0;i<r.length;i++)
      {
            var nID;
            if(i<3){
              nID = r[0]
            }
            else{
              nID = r[i-2].split("\n")[1]
            }
            if(r[i].includes("fail?"))
            {
                failFlags.push([curNode.id,"fail?",nID])
            }
            else if(r[i].includes("fail"))
            {
              failFlags.push([curNode.id,"fail",nID])
            }
      }
      //console.log("fail flags list:" +failFlags)
      cb(Array.from(failFlags))
    })
    nodeInstance.sendCommand(clusterInfo)
  }
  // for testing purposes
  getCommands () {
    console.log(Redis.GetBuiltinCommands())
  }
}
