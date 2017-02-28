'use strict'

module.exports = class AwsSubnet {
  constructor () {
    this.netid = null // The AWS-given id of this subnet
    this.type = 'Subnet'
    this.instances = [] // The Ec2Instance objects associated with this subnet
  }

  addInstance (i) {
    this.instances.forEach(function (inst) {
      if (i.getId() === inst.getId()) {
        return
      }
    })
    this.instances.push(i)
  }

  delInstance (i) {
    if (typeof (i) === 'string') {
      this.instances.forEach(function (inst, index) {
        if (inst.getId() === i.getId()) {
          this.instances.slice(index, index + 1)
        }
      })
    } else if (typeof (i) === 'number') {
      this.instances.slice(i, i + 1)
    }
  }

  setNetID (i) {
    this.netid = i
  }

  getNetId () {
    return this.netid
  }

  getInstances (i) {
    if (i) {
      this.instances.forEach(function (inst, index) {
        if (i.id === inst.id) {
          return this.instances.at(index)
        }
      })
    } else {
      return this.instances
    }
  }
}
