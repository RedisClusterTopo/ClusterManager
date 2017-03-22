'use strict'

var AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2'})
var ec2 = new AWS.EC2({apiVersion: '2016-09-15'})

// Manages queries to ec2 in order to collect instance information for Redis Cluster hosts
module.exports = class QueryManager {

  // Input: an EC2 vpc ID
  // Output: An array of EC2 instance desriptors for instances within the given vpc
  getInstanceInfoByVpc (vpcId, cb) {
    var params = {
      Filters: [
        {
          Name: 'vpc-id',
          Values: [
            vpcId
          ]
        }
      ]
    }

    ec2.describeInstances(params, function (err, data) {
      if (err) console.log(err)
      else {
        var instances = []

        data.Reservations.forEach(function (reservation) {
          reservation.Instances.forEach(function (instance) {
            instances.push(instance)
          })
        })

        cb(instances)
      }
    })
  }
}
