'use strict'

// CURRENTLY UNUSED

module.exports = class ClientConnection {
  constructor (socket, updateFunction) {
    this.socket = socket
    this.updateFunction = updateFunction
  }
}
