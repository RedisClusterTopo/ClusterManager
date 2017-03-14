'use strict'

var QueryManager = require('./QueryManager.js')
var ClusterCmdManager = require('./ClusterCmdManager.js')
// var ClientConnection = require('./ClientConnection.js')
var RedtopParser = require('./RedtopParser.js')

// Data object representing a client connection and all related components used in
// accessing and manipulating ec2 and ioredis info

// TODO: Transfer setInterval functions used in updating subscribed clients to
// the ClientConnection class so an option to unsubscribe can be implemented

module.exports = class ClusterToken {

  constructor (k, v, socket) {
    this.clusterID = {key: k, val: v}
    this.subscribers = [] // Contains a list of sockets subscribed to updates from this cluster
    this.nodes = null
    this.queryManager = new QueryManager()
    this.cluster_commander = null
    this.ec2data = null
    this.redisData = {}
    this.parser = new RedtopParser()
    this.updater = null // The setInterval function responsible for calling ioredis and EC2 queries

    // Check key/val of new connection for dev configuration
    if (k === 'local' && v === 'cluster') {
      this._initLocal(this, socket)
    } else {
      this.updater = this._update(5000) // Update and push to all sockets every 5 seonds
    }
  }

  // Add a subscriber to the cluster represented by this token
  addSubscriber (socket) {
    if (this._isUniqueSocket(socket)) {
      this.subscribers.push(socket)
    }
  }

  // Remove a subscriber to the cluster represented by this token
  delSubscriber (socket) {
    this.subscibers.forEach(function (sub) {
      console.log(sub)
    })
  }

  // Gather a collection of ec2 informations for all ec2 resources hosting the cluster
  queryEC2 (cb) {
    var _this = this
    this.queryManager.getInstancesByTag(this.clusterID, function (d) {
      _this.setEC2Data(d)
      cb()
    })
  }

  // Use the instantiated ioredis commander to collect an aggregate of Redis Cluster info for parsing
  queryRedis (cb) {
    var _this = this

    // TODO: expose a single function in ClusterCmdManager to get the necessary
    // aggregate of ioredis information to be passed to the parser
    _this.cluster_commander.getNodes(function (nodes) {
      _this.redisData.nodes = nodes
      _this.cluster_commander.getClusterInfo(function (info) {
        _this.redisData.info = info
        cb()
      })
    })
  }

  // Orchestrate information collection / parsing to be pushed to clients
  // TODO: store the timeout function in a location so that it can be cleared later
  _update (timeout) {
    var _this = this
    return setInterval(function () {
      _this.queryEC2(function () {
        _this.queryRedis(function () {
          // Build an object containing:
          //  - the redtop object
          //  - state failures
          var clusterReport = _this.parser.parse(_this.ec2data, _this.redisData, false)
          _this.subscribers.forEach(function (sub) {
            sub.emit('update', clusterReport)
          })
        })
      })
    }, 5000)
  }

  // Use mode == 1 to access a local cluster
  // else use mode == 0 (get host:port from ec2data tags)
  // NOTE: REDTOP ClusterNodes ARE CREATED FROM EC2 TAGS WHEN CALLING THIS FUNCTION
  initCommander (redtop) {
    var nodes = []
    if (redtop === 'local') {
      this.cluster_commander = new ClusterCmdManager([['127.0.0.1', '30001']]) // Connect to local cluster
    } else if (redtop) {
      redtop.getNodes().forEach(function (node) {
        nodes.push([node.port, node.host])
      })

      if (nodes.length >= 1) {
        this.cluster_commander = new ClusterCmdManager(nodes)
      } else {
        console.log('Error initializing ClusterCmdManager of ' + this.clusterID.key + ':' + this.clusterID.val + ': no node tags in EC2 data')
      }
    } else {
      console.log('Error initializing ClusterCmdManager ' + this.clusterID.key + ':' + this.clusterID.val + ': no ec2data')
    }
  }

  // Setup for testing local cluster in development configuration
  _initLocal (_this, socket) {
    _this.initCommander('local')

    setInterval(function () {
      _this.queryRedis(function () {
        var r = {
          type: 'Root',
          zones: [
            {
              name: 'Local AZ',
              type: 'Availability Zone',
              subnets: [{
                netid: 'Local Subnet',
                type: 'Subnet',
                instances: [{
                  id: 'Local Instance',
                  ip: '127.0.0.1',
                  type: 'EC2 Instance',
                  nodes: []
                }]
              }]
            }]
        }

        var clusterState = _this.parser.parse(r, _this.redisData, true)

        // console.log(clusterState.redtop)

        socket.emit('update', clusterState)
      })
    }, 5000)
  }

  // Check to see if a socket.io connection is already subscribed to the token
  _isUniqueSocket (socket) {
    var unique = true

    this.connections.forEach(function (conn) {
      if (socket.id === conn.id) unique = false
    })

    return unique
  }

  setEC2Data (d) {
    this.ec2data = d
  }

  getClusterID () {
    return this.clusterID
  }

  getEC2Data () {
    return this.ec2data
  }
}
