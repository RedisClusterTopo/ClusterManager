'use strict'

module.exports = class Ec2Instance {
  constructor () {
    this.id = null  // The AWS-given EC2 instance id
    this.ip = null // The IP address of this host
    this.type = 'EC2 Instance'
    this.nodes = [] // The ClusterNode objects associated with this instance
  }

  addNode (n) {
    this.nodes.forEach(function (node) {
      if (node.getHost() === n.getHost() && node.getPort() === n.getPort()) {
        return
      }
    })
    this.nodes.push(n)
  }

  delNode (n) {
    if (typeof (n) === 'string') {
      this.nodes.forEach(function (node, i) {
        if (node.getHost() === n.getHost()) {
          this.nodes.slice(i, i + 1)
        }
      })
    } else if (typeof (n) === 'number') {
      this.nodes.slice(n, n + 1)
    }
  }

  setId (i) {
    this.id = i
  }

  getId () {
    return this.id
  }

  setIp (ip) {
    this.ip = ip
  }

  getIp () {
    return this.ip
  }

  getNodes () {
    return this.nodes
  }
}
