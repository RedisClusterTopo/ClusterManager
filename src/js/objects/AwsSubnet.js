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
    var _this = this

    this.instances.forEach(function (inst, index) {
      if (inst.getId() === i.getId()) {
        _this.instances.splice(index, index + 1)
      }
    })
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
