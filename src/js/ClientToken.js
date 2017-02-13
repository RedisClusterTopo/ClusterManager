'use strict'

var QueryManager = require('./QueryManager.js')
var ClusterCmdManager = require('./ClusterCmdManager.js')

// Data object representing a client connection and all related components used in
// accessing and manipulating ec2 and ioredis info
// TODO: We need some sort of function that allows us to get the ip and port number of the cluster we are taling to
module.exports = class ClientToken {

  constructor (k, v, socket) {
    this.client_id = {key: k, val: v}
    this.socket = socket
    this.nodes = null
    this.cluster_commander = null
    this.ec2data = null
    this.queryManager = new QueryManager()
  }

  queryEC2 (cb) {
    var _this = this
    this.queryManager.getInstancesByTag(this.client_id, function (d) {
      _this.setEC2Data(d)
      cb(_this)
    })
  }

  parseNodes () {
    // TODO: iterate through this.ec2data to build a hash/port map of cluster nodes
    // possibly chain a call to update this.cluster_commander with new nodes?
  }

  initCommander () {
    // TODO: implement ClusterCmdManager and set object instances to this.cluster_commander
    if (this.ec2data != null) {
      this.cluster_commander = new ClusterCmdManager(this.getClusterPort(), this.getClusterIP())
      // this.cluster_commander.getHashSlots()
      // this.cluster_commander.getCommands()
    } else {
      console.log('no cluster data found. IP: ' + this.getClusterIP() + ' Port: ' + this.getClusterPort() + ' ec2data: ' + this.ec2data)
    }
  }
  // TODO: move this functionality over to a parser class
  getClusterIP () {
    return '127.0.0.1'
    /* this.ec2data.forEach(function(inst) {
    console.log('pseudo random ip: ' + inst.PrivateIpAddress)
    return inst.PrivateIpAddress
  })
  */
  }
  // TODO: move this functionality over to a parser class
  getClusterPort () {
    return '30001'
    /* this.ec2data.forEach(function(inst, i) {
    inst.Tags.forEach(function(ta) {
    if(ta.Key == 'master' || ta.Key == 'slave') {
    console.log('pseudo random port: ' + ta.Value)
    return ta.Value
  }
})
})
*/
  }

  setEC2Data (d) {
    console.log(d)
    this.ec2data = d
  }

  getClientID () {
    return this.client_id
  }

  getEC2Data () {
    return this.ec2data
  }
}
