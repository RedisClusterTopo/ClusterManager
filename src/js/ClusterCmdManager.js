'use strict'
// Logic for ioredis
var Redis = require('ioredis')
var Commander = require('ioredis').Command

// This call will contain the functionality to get information from a rediis cluster
module.exports = class ClusterCmdManager {
  constructor (nodes, useCluster, cb) {
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
      if (!connectionReturned) {
        connectionReturned = true
        if (cb) cb(true)
      }
    })

    _this.cluster.on('connect', function () {
      if (!connectionReturned) {
        connectionReturned = true
        if (cb) cb(true)
      }
    })

    _this.cluster.on('error', function (err) {
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
          if (port.includes('@')) port = port.split('@')[0]
          if (host.length > 0) nodeList.push({host: host, port: Number(port)})
        }
      })

      cb(nodeList)
    })

    _this.cluster.sendCommand(nodes)
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
          returnVal.id = line.substr(0, line.indexOf(' ')) // extract the currently-reporting node ID
        }
      })

      // Append the command response to the return value
      returnVal.clusterNodes = result.toString('utf8')

      cb(returnVal)
    })

    this.cluster.sendCommand(nodes)
  }

  getClusterInfo (cb) {
    var clusterInfo = new Commander('cluster', ['info'], 'utf8', function (err, result) {
      if (err) console.log(err)

      result = result.toString('utf8').split('\n')
      cb(result)
    })
    this.cluster.sendCommand(clusterInfo)
  }
}
