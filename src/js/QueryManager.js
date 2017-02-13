'use strict'

var AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2'})
var ec2 = new AWS.EC2({apiVersion: '2016-09-15'})

// Manages queries to ec2 in order to collect instance information for Redis Cluster hosts
module.exports = class QueryManager {
  getInstancesByTag (tag, callback) {
    var params = {
      Filters: [
        {
          Name: 'key',
          Values: [
            tag.key
          ]
        },
        {
          Name: 'value',
          Values: [
            tag.val
          ]
        }
      ]
    }

    ec2.describeTags(params, function (err, data) {
      var instanceIds = []
      var instances = []

      if (err) console.log(err, err.stack)
      else {
        for (var i = 0; i < data.Tags.length; i++) {
          instanceIds.push(data.Tags[i].ResourceId)
        }
        params = {
          InstanceIds: instanceIds
        }

        ec2.describeInstances(params, function (err, data) {
          if (err) {
            console.log(err, err.stack) // an error occurred
          } else {
            data.Reservations.forEach(function (set) {
              set.Instances.forEach(function (inst) {
                instances.push(inst)
              })
            })
            console.log(instances)
            callback(instances) // to getInstancesByTag()
          }
        })
      }
    })
  }
}
