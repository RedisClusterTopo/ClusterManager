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

  constructor (vpcId, socket) {
    this.clusterID = vpcId
    this.subscribers = [] // Contains a list of sockets subscribed to updates from this cluster
    this.queryManager = new QueryManager()
    this.cluster_commander = null
    this.ec2data = null
    this.redisData = {}
    this.parser = new RedtopParser()
    this.updater = null // The setInterval function responsible for calling ioredis and EC2 queries

    // Check key/val of new connection for dev configuration
    if (vpcId === 'local') {
      this._initLocal(this, socket)
    } else {
      this.addSubscriber(socket)
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
    this.queryManager.getInstanceInfoByVpc(this.clusterID, function (data) {
      _this.setEC2Data(data)
      cb()
    })
  }

  // Use the instantiated ioredis commander to collect an aggregate of Redis Cluster info for parsing
  queryRedis (cb) {
    if (this.cluster_commander.cluster.status.toUpperCase() === 'READY') {
      var _this = this
      _this.cluster_commander.getNodes(function (nodes) {
        _this.redisData.nodes = nodes
        _this.cluster_commander.getClusterInfo(function (info) {
          _this.redisData.info = info

          cb()
        })
      })
    }
  }

  // Orchestrate information collection / parsing for info to be pushed to clients
  // TODO: store the timeout function in a location so that it can be cleared later
  _update (timeout) {
    var _this = this

    return setInterval(function () {
      _this.queryEC2(function () {
        if (_this.cluster_commander == null) {
          _this.parser.parseNodesByInstanceInfo(_this.ec2data, function (taggedNodes) {
            _this.initCommander(taggedNodes, function () {
	      if (_this.cluster_commander.cluster.status.toUpperCase() === 'READY') {
                _this.queryRedis(function () {
                  _this.parser.parse(_this.ec2data, _this.redisData, false, function (clusterReport) {
                    _this.subscribers.forEach(function (sub) {
                      sub.emit('update', clusterReport)
                    })
                  })
	        })
              }
            })
          })
        } else {
	  if (_this.cluster_commander.cluster.status.toUpperCase() === 'READY') {
            _this.queryRedis(function () {
              _this.parser.parse(_this.ec2data, _this.redisData, false, function (clusterReport) {
                _this.subscribers.forEach(function (sub) {
                  sub.emit('update', clusterReport)
                })
              })
            })
	  }
        }


        // TODO: add split brain checks
        //    -instantiate ioredis objects using each node contained in cluster_commander
        //    -get fail/pfail counts and check against each other
      })
    }, 5000)
  }

  // Input: An array containing ip/port information for a list of cluster nodes
  // contained in a 2 element array
  // Output: initalizes the cluster_commander class object
  initCommander (nodes, cb) {
    if (nodes === 'local') {
      this.cluster_commander = new ClusterCmdManager(['127.0.0.1', '7000']) // Connect to local cluster
    } else if (nodes) {
      if (nodes.length >= 1) {
        this.cluster_commander = new ClusterCmdManager(nodes)
      } else {
        console.log('Error initializing ClusterCmdManager of ' + this.clusterID + ': no nodes in list')
      }
    } else {
      console.log('Error initializing ClusterCmdManager ' + this.clusterID + ': no list of nodes')
    }

    cb()
  }

  // Setup for testing local cluster in development configuration
  _initLocal (_this, socket) {
    _this.initCommander('local', function () {
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

          _this.parser.parse(r, _this.redisData, true, function (clusterState) {
            socket.emit('update', clusterState)
          })
        })
      }, 5000)
    })
  }

  // Check to see if a socket.io connection is already subscribed to the token
  _isUniqueSocket (socket) {
    var unique = true

    this.subscribers.forEach(function (conn) {
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
