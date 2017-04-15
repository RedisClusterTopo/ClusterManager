'use strict'
// Logic for ioredis
var Redis = require('ioredis')
var Commander = require('ioredis').Command

// This call will contain the functionality to get information from a rediis cluster
module.exports = class ClusterCmdManager {
  constructor (nodes, cb) {
    this.cluster = new Redis.Cluster(nodes)
    this._registerListeners(cb)
  }

  // Set up handlers for ioredis connection
  _registerListeners (cb) {
    var _this = this

    _this.cluster.on('ready', function () {
      // console.log('cluster ready')
      if (cb) cb(true)
    })

    _this.cluster.on('error', function (err) {
      console.log('ioredis failure: ' + err)
      if (cb) cb(false)
    })
  }

  getNodesList (cb) {
    var _this = this
    var nodeList = []

    for (var master in _this.cluster.connectionPool.nodes.master) {
      master = master.split(':')

      // master[0] == node host address
      // master[1] == node port
      nodeList.push({
        isMaster: true,
        hostPort: [master[0], master[1]]
      })
    }

    for (var slave in _this.cluster.connectionPool.nodes.slave) {
      slave = slave.split(':')

      // slave[0] == node host address
      // slave[1] == node port
      nodeList.push({
        isMaster: false,
        hostPort: [slave[0], slave[1]]
      })
    }

    cb(nodeList)
  }

  // Issues the 'cluster nodes' command to the ioredis cluster contained in this object
  // Returns:
  //    The ID of the node which received the command
  //    A string containing the command response for that node
  getClusterNodes (cb) {
    var nodes = new Commander('cluster', ['nodes'], 'utf8', function (err, result) {
      var returnVal = {
        id: null, // the ID of the currently reporting node
        clusterNodes: null  // the value of the 'cluster nodes' response
      }

      if (err) console.log(err)

      result.toString('utf8').split('\n').forEach(function (line) {
        if (line.includes('myself')) {
          returnVal.id = line.substr(0, line.indexOf(' ')) // extract the currently-reporting node ID
        }
      })
      // Append the command response to the return value
      returnVal.clusterNodes = result.toString('utf8')

      cb(returnVal)
    })

    this.cluster.sendCommand(nodes)
  }

  getErrorFlags (cluster) {
    var slots = new Commander('cluster', ['COUNT-FAILURE-REPORTS', /* CLUSTER ID */], 'utf8', function (err, result) {
        result.forEach(function(flag){
          console.log(flag)
        })
    })
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
