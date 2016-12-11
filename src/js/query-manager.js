"use strict";

var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});
var ec2 = new AWS.EC2({apiVersion: '2016-09-15'});

module.exports = class querymanager {

    constructor(){
    }

    getInstancesByTag(tag, callback){

        var params = {
            Filters: [
                {
                    Name: "key",
                    Values: [
                        tag.key
                    ]
                },
                {
                    Name: "value",
                    Values:[
                        tag.val
                    ]
                }
            ]
        };

        ec2.describeTags(params, function(err, data){
            var instance_ids = [];
            var instances = [];


            if (err) debug(err, err.stack);
            else{

                var i;
                for(i = 0;i < data.Tags.length; i++){
                    instance_ids.push(data.Tags[i].ResourceId);
                }

                params = {
                    InstanceIds : instance_ids
                };

                ec2.describeInstances(params, function(err, data) {
                    if (err)
                    console.log(err, err.stack); // an error occurred
                    else{
                        data.Reservations.forEach(function(set){
                            set.Instances.forEach(function(inst){
                                instances.push(inst);
                            });
                        });

                        callback(instances); //to getInstancesByTag()
                    }
                });

            }

        });
    }
}
