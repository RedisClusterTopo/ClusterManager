"use strict";
//Logic for ioredis
var Redis = require('ioredis');
var Commander = require('ioredis').Command;
var ClusterNode = require('./ClusterNode.js');
var _this;

//This call will contain the functionality to get information from a rediis cluster
module.exports = class ClusterCmdManager{

      constructor(port,ip){
          _this = this;
          this.cluster = new Redis.Cluster([port,ip]);
          this.cluster.on("ready",function(){
/*         This section was for testing commands to send tothe cluster
            as of right now there seems to be an issue calling the functions as ClusterCmdManager.<Command function>
            var info = new Commander('info', null, 'utf8', function (err, result) {
             console.log("Node Info Result: " + result);
            });
            console.log(_this.cluster.getBuiltinCommands());
*/
            //_this.cluster.sendCommand(slots);
            ///this.getHashSlots();
            //console.log(new Commander());
            _this.cluster.sendCommand(info);
          });
      }

      //cluster slots commands retuns the hash rang for the entire cluster as well as node ids
      getNodes(){
        var count =0;
        var slots = new Commander('cluster', ['slots'], 'utf8', function (err, result) {
        //The result being returned here is an array of the nodes in the cluster. It seems to return the masters
         var hashRange;
         console.log("Cluster Slots Result: " + result);
         result.forEach(function(node){
           console.log("Node Slot Configurations: " + node);
           /*This array is as follows
           0: lower hashslot
           1: upper hashrange
           2: master node array
              0: IP
              1: Port
              2: ID
          3: slave node array
              0: IP
              1: Port
              2: ID*/
              var detailsMaster = node[2];

              var detailsSlave = node[3];
              console.log("Master node "+ count + " Lower Hash Range: "+ node[0]);
              console.log("Master node "+ count + " Upper Hash Range: "+ node[1]);

              console.log("Master node "+ count + " IP: "+ detailsMaster[0]);
              console.log("Master node "+ count + " Port: "+ detailsMaster[1]);
              console.log("Master node "+ count + " ID: "+ detailsMaster[2]);

              console.log("Slave node "+ count + " ID: "+ detailsSlave[0]);
              console.log("Slave node "+ count + " ID: "+ detailsSlave[1]);
              console.log("Slave node "+ count + " ID: "+ detailsSlave[2]);
              //TODO: add all of the above fields in a redtop cluster and return it
              count++;
         });
        });
        _this.cluster.sendCommand(slots);
      }

      getSlaves(){

      }
      getClusterInfo(){
        var clusterInfo = new Commander('cluster', ['info'], 'utf8', function (err, result) {
            /*the object returned from this call:
              0: cluster state
              1: assigned cluster slots
              2: cluster slots status
              3: cluster slots pfail
              4: cluster slots fail
              5: cluster known nodes
              6: cluster size
              7: cluster epoch
              8: messages sent
              9: messages recieved
            */
        console.log("Cluster Info Result: " + result);
        });
        _this.cluster.sendCommand(clusterInfo);
      }
      //for testing purposes
      getCommands(){
        console.log(Redis.GetBuiltinCommands());
      }
}
