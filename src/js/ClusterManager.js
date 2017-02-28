'use strict'

var ClusterToken = require('./ClusterToken.js')

// This class is used to manipulate client connections via a collection of client tokens
module.exports = class ClusterManager {
  constructor () {
    this.tokens = []
  }

  addToken (id, socket, timeout, cb) {
    if (this._isUnique(id)) {
      var c = new ClusterToken(id.key, id.val, socket, timeout)
      this.tokens.push(c)
      cb(c)
    } else {
      this.getToken(id).addSubscriber(socket, timeout)
      cb(false)
    }
  }

  // Delete the token identified by the given ClientID.
  // Return true or false based on success in removing a token
  delToken (id, cb) {
    var success = false
    this.tokens.forEach(function (c, i) {
      if (c.getClusterID().key === id.key && c.getClusterID().val === id.val) {
        this.tokens.splice(i, 1)
        success = true
      }
    })
    cb(success)
  }

  // Return the token identified by the given ClientID
  getToken (id) {
    var token = null
    this.tokens.forEach(function (t) {
      if (t.getClusterID().key === id.key && t.getClusterID().val === id.val) {
        token = t
      }
    })

    return token
  }

  // Check if a token already exists with the given ClientID
  _isUnique (clientID) {
    var unique = true

    if (this.getToken(clientID) != null) unique = false

    return unique
  }
}
