"use strict";

var Cluster = require('ioredis').Cluster;
var querymanager = require('./query-manager.js');


//Data object representing a client connection and all related components used in
//accessing and manipulating ec2 and ioredis info
module.exports = class ClientToken {

    constructor(k, v, socket){
        this.client_id = {key : k, val : v};
        this.socket = socket;
        this.nodes = null;
        this.cluster_commander = null;
        this.ec2data = null;
        this.queryManager = new querymanager();
    }


    queryEC2(cb){
        var _this = this;
        this.queryManager.getInstancesByTag(this.client_id, function(d){
            _this.setEC2Data(d);
            cb(_this);
        });
    }

    parseNodes(){
        //TODO: iterate through this.ec2data to build a hash/port map of cluster nodes
        //possibly chain a call to update this.cluster_commander with new nodes?

    }

    initCommander(){
        //TODO: implement ClusterCmdManager and set object instances to this.cluster_commander
    }

    setEC2Data(d){
        this.ec2data = d;
    }

    getClientID(){
        return this.client_id;
    }

    getEC2Data(){
        return this.ec2data;
    }


}
