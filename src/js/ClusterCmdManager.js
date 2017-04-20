'use strict'
// Logic for ioredis
var Redis = require('ioredis')
var Commander = require('ioredis').Command

// This call will contain the functionality to get information from a rediis cluster
module.exports = class ClusterCmdManager {
  constructor (nodes, useCluster, cb) {
    // console.log (nodes)
    if (useCluster === true) {
      this.cluster = new Redis.Cluster(nodes, {enableReadyCheck: false})
    } else {
      this.cluster = new Redis(nodes[0], nodes[1])
    }
    this._registerListeners(cb)
  }

  // Set up handlers for ioredis connection
  _registerListeners (cb) {
    var _this = this
    var connectionReturned = false
    _this.cluster.on('ready', function () {
      // console.log('cluster ready')
      if (!connectionReturned) {
        connectionReturned = true
        if (cb) cb(true)
      }
    })

    _this.cluster.on('connect', function () {
      // console.log(_this.cluster)
      if (!connectionReturned) {
        connectionReturned = true
        // for (var attr in _this.cluster) console.log(attr)
        // console.log(_this.cluster.status)
        if (cb) cb(true)
      }
    })

    _this.cluster.on('error', function (err) {
      // console.log('ioredis failure: ' + err)
      if (cb) cb(false)
      _this.cluster.disconnect()
    })
  }

  getNodesList (cb) {
    var _this = this
    var nodeList = []
    var nodes = new Commander('cluster', ['nodes'], 'utf8', function (err, result) {
      if (err) console.log(err)

      result.toString('utf8').split('\n').forEach(function (line) {
        if (line.length > 0) {
          line = line.split(' ')
          var host = line[1].split(':')[0]
          var port = line[1].split(':')[1]
          var isMaster = false
          if (line[2].includes('master')) isMaster = true
          if (host.length > 0) nodeList.push({host: host, port: Number(port)})
        }
      })

      cb(nodeList)
    })

    _this.cluster.sendCommand(nodes)
    //
    // for (var master in _this.cluster.connectionPool.nodes.master) {
    //   master = master.split(':')
    //
    //   // master[0] == node host address
    //   // master[1] == node port
    //   nodeList.push({
    //     isMaster: true,
    //     hostPort: [master[0], master[1]]
    //   })
    // }
    // for (var slave in _this.cluster.connectionPool.nodes.slave) {
    //   slave = slave.split(':')
    //
    //   // slave[0] == node host address
    //   // slave[1] == node port
    //   nodeList.push({
    //     isMaster: false,
    //     hostPort: [slave[0], slave[1]]
    //   })
    // }
    //
    // cb(nodeList)
  }

  // Issues the 'cluster nodes' command to the ioredis cluster contained in this object
  // Returns:
  //    The ID of the node which received the command
  //    A string containing the command response for that node
  getClusterNodes (cb) {
    var nodes = new Commander('cluster', ['nodes'], 'utf8', function (err, result) {
      var returnVal = {
        id: null, // the ID of the currently reporting node
        clusterNodes: null,  // the value of the 'cluster nodes' response
        info: null
      }

      if (err) console.log(err)

      result.toString('utf8').split('\n').forEach(function (line) {
        if (line.includes('myself')) {
          // console.log("cur Node Line: " + line)
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
        result.forEach(function (flag){
          // console.log(flag)
        })
    })
  }

  getClusterInfo (cb) {
    var clusterInfo = new Commander('cluster', ['info'], 'utf8', function (err, result) {
      if (err) console.log(err)

      result = result.toString('utf8').split('\n')
      cb(result)
    })
    this.cluster.sendCommand(clusterInfo)
  }
  // for testing purposes
  getCommands () {
    console.log(Redis.GetBuiltinCommands())
  }
}
