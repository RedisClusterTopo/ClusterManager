'use strict'
var ClusterToken = require('./ClusterToken.js')

// This class is used to manipulate client connections via a collection of client tokens
module.exports = class ClusterManager {
  constructor () {
    this.tokens = []
  }

  getRestRequest(vpcID,socket, cb){
    new ClusterToken('local', socket,function(clusterState){
      cb(clusterState)
    })

  }


  addToken (vpcId, socket) {
    var success = false
    if(vpcId ==='local'){
      var c = new ClusterToken('local', socket)
      this.tokens.push(c)
      this.getToken('local').addSubscriber(socket)
      success = true
    }else{
      if (this._isUnique(vpcId)) {
        var c = new ClusterToken(vpcId, socket)
        this.tokens.push(c)
        success = true
      } else {
        this.getToken(vpcId).addSubscriber(socket)
        success = true
      }
    }

    return success
  }

  // Delete the token identified by the given ClientID.
  // Return true or false based on success in removing a token
  delToken (id, cb) {
    //console.log(id)
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
