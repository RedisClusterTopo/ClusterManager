'use strict'

module.exports = class ClusterNode {

  constructor () {
    this.host = null  // The host EC2 instance IP
    this.port = null  // The port this node is running over
    this.role = null  // Master or slave
    this.type = 'Cluster Node'
    this.id = null    // ID of the node *NEW used to link masters/slaves
    this.replicates = null  // The master this node replicates if this.role == slave
    this.hash = [] // Array of objects with start and end hash slots to handle
    this.failCount = []
    this.pfailCount = null
    this.state = null
    this.knownCount = null
    // Nodes which serve a non-contiguous hash range
    this.slaves = []  // Array of slave ClusterNode objects associated with this
                      // if this this.role == master
    this.seesNormal = []
    this.seesPfail = []
    this.seesFail = []
    this.seesConnecting = []
    this.noAddr = []
    this.differentId = []
  }

  addHash (range) {
    this.hash.forEach(function (r) {
      if (r.upper === range.upper && r.lower === range.lower) return false
    })

    this.hash.push(range)
  }

  delHash (range) {
    var _this = this
    var success = false

    this.hash.forEach(function (r, index) {
      if (r.upper === range.upper && r.lower === range.lower) {
        _this.hash.slice(index, index + 1)
        success = true
      }
    })

    return success
  }

  getRole () {
    return this.role
  }

  setRole (r) {
    this.role = r
  }

  addSlave (newSlaveID) {
    if (this.role.toUpperCase() === 'MASTER') {
      if (newSlaveID) {
        var found = false

        this.slaves.forEach(function (slave) {
          if (newSlaveID === slave.id) {
            found = true
          }
        })

        if (!found) {
          this.slaves.push(newSlaveID)
        }
      }
    } else {
      return
    }
  }

  delSlave (s) {
    if (this.role.toUpperCase() === 'MASTER') {
      if (s) {
        this.slaves.forEach(function (slave, i) {
          this.slaves.splice(i, 1)
        })
      } else {
        return
      }
    }
  }

  getSlaves () {
    if (this.role.toUpperCase() === 'MASTER') {
      return this.slaves
    }
  }

  getPort () {
    return this.port
  }

  getReplicates () {
    if (this.role.toUpperCase() === 'SLAVE') {
      return this.replicates
    }
  }

  getHost () {
    return this.host
  }

  setHost (h) {
    this.host = h
  }
  setID(id){
    this.id = id
  }
  getID(){
    return this.id
  }
  setPort (p) {
    this.port = p
  }

  setReplicates (rID) {
    if (this.role.toUpperCase() === 'SLAVE') {
      this.replicates = rID
    }
  }
}
