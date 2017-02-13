'use strict'

var ClientToken = require('./ClientToken.js')

// This class is used to manipulate client connections via a collection of client tokens
module.exports = class ClientManager {
  constructor () {
    this.clients = []
  }

  addClient (id, socket, cb) {
    var c = new ClientToken(id.key, id.val, socket)

    if (this.isUnique(c)) {
      this.clients.push(c)
      cb(c)
    } else {
      cb(false)
    }
  }

  delClient (id, cb) {
    var success = false
    this.clients.forEach(function (c, i) {
      if (c.getClientID().key === id.key && c.getClientID().val === id.val) {
        this.clients.splice(i, 1)
        success = true
      }
    })
    cb(success)
  }

  getClient (id) {
    var client = null
    this.clients.forEach(function (c) {
      if (c.getClientID().key === id.key && c.getClientID().val === id.val) {
        client = c
      }
    })

    return client
  }

  update (id, cb) {
    if (this.getClient(id)) {
      this.getClient(id).queryEC2(cb)
    }
  }

  isUnique (newClient) {
    var found = true

    if (this.getClient(newClient) != null) found = false

    return found
  }
}
