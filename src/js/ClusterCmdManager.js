'use strict'
// Logic for ioredis
var Redis = require('ioredis')
var Commander = require('ioredis').Command

// This call will contain the functionality to get information from a rediis cluster
module.exports = class ClusterCmdManager {
  constructor (nodes) {
    this.cluster = new Redis.Cluster(nodes)
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

  getSlaves () {

  }

  getClusterInfo (cb) {
    var clusterInfo = new Commander('cluster', ['info'], 'utf8', function (err, result) {
      if (err) console.log(err)
      /* the object returned from this call:
      0: cluster state
      1: assigned cluster slots
      2: cluster slots status
      3: cluster slots pfail
      4: cluster slots fail
      5: cluster known nodes
      6: cluster size
      7: cluster epoch
      8: messages sent
      9: messages recieved
      */
      // console.log('Cluster Info Result: ' + result)
      cb(result)
    })
    this.cluster.sendCommand(clusterInfo)
  }
  // for testing purposes
  getCommands () {
    console.log(Redis.GetBuiltinCommands())
  }
}
