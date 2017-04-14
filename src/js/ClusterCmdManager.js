'use strict'
// Logic for ioredis
var Redis = require('ioredis')
var Commander = require('ioredis').Command

// This call will contain the functionality to get information from a rediis cluster
module.exports = class ClusterCmdManager {
  constructor (nodes) {
    this.cluster = new Redis.Cluster(nodes)
    this._registerListeners()

    var retry = 5
    while (retry > 0) {

      retry--
    }
  }

  // Set up handlers for ioredis connection
  _registerListeners () {
    var _this = this

    _this.cluster.on('ready', function () {
     // console.log('ioredis ready')
    })

    _this.cluster.on('error', function (err) {
      console.log('ioredis failure: ' + err)
    })
  }

  // Cluster slots commands retuns the hash range for the entire cluster as well as node ids
  getNodes (cb) {
    var nodeInfo = new Commander('cluster', ['nodes'], 'utf8', function (err, result) {
      if (err) console.log(err)
      var returnVal ={
        masters: []
      }
      var r = result.toString("utf8").split(" ")
      var count = 0
      for (var i=0;i<r.length;i++)
      {
        var n = {
          lowerHash: null,
          upperHash: null,
          ip: null,
          port: null,
          id: null,
          failFlags:[],
          slaves: []
        }
          if(r[i].includes("master"))//always checking for masters
          {
                if(i<6)
                {
                  var ipNode = r[1].toString("utf8").split(":")
                  //0 is id
                  //1 is ip and port
                  //2 slave or master
                      //if slave find the master and attach it
                      n.id = r[0]
                      n.ip = ipNode[0]
                      n.port = ipNode[1]
                  if(r[i+6].includes("-"))
                  {
                      var hSlots = r[i].split("\n")[0].split("-")//split the next node id off of the slots, and then split the slots
                      n.lowerHash = hSlots[0]
                      n.upperHash = hSlots[1]
                  }
                }
                else
                {
                  //node id = curposition -2 and split off of newline
                  //ip/port cur position -1
                  var ipNode = r[i-1].toString("utf8").split(":")
                  n.id = r[i-2].split("\n")[1]
                  n.ip  = ipNode[0]
                  n.port  = ipNode[1]
                  if(r[i+6].includes("-"))
                  {
                      var hSlots = r[i+6].split("\n")[0].split("-")//split the next node id off of the slots, and then split the slots
                      n.lowerHash = hSlots[0]
                      n.upperHash = hSlots[1]
                  }
                }
                returnVal.masters.push(n)
          }
      }
      for (var i=0;i<r.length;i++)
      {
        var sn = {
          ip: null,
          port: null,
          id: null,
        }
        if(r[i].includes("slave"))//always checking for masters
        {
          //console.log("found a slave")
          if(i<6)
          {
            var ipNode = r[1].toString("utf8").split(":")
                sn.id = r[0]
                sn.ip = ipNode[0]
                sn.port = ipNode[1]
          }
          else
          {
            var ipNode = r[i-1].toString("utf8").split(":")
            //console.log("slave information\n" + " id: " +r[i-2].split("\n")[1] + "\n"+ " ip: " +ipNode[0] + "\n"+ " port: " +ipNode[1])
            sn.id = r[i-2].split("\n")[1]
            sn.ip  = ipNode[0]
            sn.port  = ipNode[1]
          }
          var count = 0
          returnVal.masters.forEach(function(master)
          {
            //console.log("finding masters. masterid: " + master.id + "  slaves master: " + r[i+1])
            if(master.id.toString("utf8") == r[i+1].toString("utf8"))
            {
                //console.log("current slave value: "+ JSON.stringify(sn))
                master.slaves.push(sn)
            }
            count++
          })
        }
      }
      //console.log(JSON.stringify(returnVal))
      cb(returnVal)
    })
    this.cluster.sendCommand(nodeInfo)
  }
  //not sure that we will need this
  getErrorFlags (node, eNodes, cb) {
    var curNode = node;
    var nodeInstance = new Redis(node.port, node.ip)
    console.log(nodeInstance)
    eNodes.forEach(function(n){
      if(curNode.id !=n.id){
          console.log(n.id)
            var masterFails = new Commander('cluster', ['COUNT-FAILURE-REPORTS',n.id], 'utf8', function (err, result) {
                if (err) console.log(err)
                curNode.failFlags.push(n.id,result)
                console.log( node.id + " " +n.id+ " " + result)
                cb();
            })
            nodeInstance.sendCommand(masterFails)
      }
    })
  }

  getClusterInfo (node,cb) {
    var curNode = node
    //console.log(curNode.port +"_"+ curNode.ip)
    var nodeInstance = new Redis(curNode.port, curNode.ip)
    var clusterInfo = new Commander('cluster', ['nodes'], 'utf8', function (err, result) {
      if (err) console.log(err)
      var failFlags=[];
      var r = result.toString("utf8").split(" ")
      var count = 0
      for (var i=0;i<r.length;i++)
      {
        //console.log("cluster nodes result: "+ i+ " " + r[i] + "\n")
            var nID;
            if(i<3){
              nID = r[0]
            }
            else{
              nID = r[i-2].split("\n")[1]
            }
            if(r[i].includes("fail?"))
            {
                failFlags.push([curNode.id,"fail?",nID])
            }
            else if(r[i].includes("fail"))
            {
              failFlags.push([curNode.id,"fail",nID])
            }
      }
      //console.log("fail flags list:" +failFlags)
      cb(Array.from(failFlags))
    })
    nodeInstance.sendCommand(clusterInfo)
  }
  // for testing purposes
  getCommands () {
    console.log(Redis.GetBuiltinCommands())
  }
}
