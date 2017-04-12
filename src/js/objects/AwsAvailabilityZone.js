'use strict'

module.exports = class AwsAvailabilityZone {
  constructor () {
    this.name = null  // The AWS-given id of this AZ
    this.type = 'Availability Zone'
    this.subnets = [] // The  AwsSubnet objects associated with this AZ
  }

  addSubnet (s) {
    this.subnets.forEach(function (sn) {
      if (sn.getNetId() === s.getNetId) return
    })
    this.subnets.push(s)
  }

  delSubnet (s) {
    var _this = this

    this.subnets.forEach(function (sn, i) {
      if (s.getNetId() === sn.getNetId()) {
        _this.subnets.splice(i, i + 1)
      }
    })
  }

  setName (n) {
    this.name = n
  }

  getName () {
    return this.name
  }

  getSubnets () {
    return this.subnets
  }
}
