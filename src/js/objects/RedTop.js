'use strict'

module.exports = class RedTop {
  constructor () {
    this.type = 'Root'
    this.zones = [] // The AwsAvailabilityZones associated with this object
  }

  // Checks for unique AvailabilityZone name
  addAvailabilityZone (az) {
    var f = false
    this.zones.forEach(function (zone) {
      if (zone.getName() === az.getName()) {
        f = true
      }
    })
    if (!f) this.zones.push(az)
  }

  // Supports a string arg to remove by name or remove by index
  delAvailabilityZone (az) {
    if (typeof (az) === 'string') {
      this.zones.forEach(function (z, i) {
        if (z.getName() === az.getName()) {
          this.zones.slice(i, i + 1)
        }
      })
    } else if (typeof (az) === 'number') {
      this.zones.slice(az, az + 1)
    }
  }

  addSubnet (s, az) {
    var f = false
    this.zones.forEach(function (zone) {
      if (az.getName() === zone.getName()) {
        zone.subnets.forEach(function (sn) {
          if (sn.getNetId() === s.getNetId()) f = true
        })

        if (!f) zone.addSubnet(s)
      }
    })
  }

  delSubnet (s, az) {
    this.zones.forEach(function (zone) {
      if (zone.getName() === az.getName()) {
        zone.delSubnet(s)
      }
    })
  }

  addInstance (i, s, az) {
    this.zones.forEach(function (zone) {
      if (zone.getName() === az.getName()) {
        zone.subnets.forEach(function (net) {
          if (net.getNetId() === s.getNetId()) {
            net.addInstance(i)
          }
        })
      }
    })
  }

  delInstance (i, s, az) {
    this.zones.forEach(function (zone) {
      if (zone.getName() === az.getName()) {
        zone.subnets.forEach(function (net) {
          if (net.getNetId() === s.getNetId()) {
            net.delInstance(i)
          }
        })
      }
    })
  }

  addNode (n, i, s, az) {
    this.zones.forEach(function (zone) {
      if (zone.getName() === az.getName()) {
        zone.subnets.forEach(function (net) {
          if (net.getNetId() === s.getNetId()) {
            net.instances.forEach(function (inst) {
              if (inst.getId() === i.getId()) {
                inst.addNode(n)
              }
            })
          }
        })
      }
    })
  }

  delNode (n, i, s, az) {
    this.zones.forEach(function (zone) {
      if (zone.getName() === az.getName()) {
        zone.subnets.forEach(function (net) {
          if (net.getNetId() === s.getNetId()) {
            net.instances.forEach(function (inst) {
              if (inst.getId() === i.getId()) {
                inst.delNode(n)
              }
            })
          }
        })
      }
    })
  }

  getAvailabilityZones () {
    return this.zones
  }

  getAvailabilityZoneByNodeID (nodeID) {
    this.zones.forEach(function (zone) {
      zone.getSubnets().forEach(function (subnet) {
        subnet.getInstances().forEach(function (instance) {
          instance.getNodes().forEach(function (node) {
            if (node.id === nodeID) return zone
          })
        })
      })
    })
  }

  getSubnets (az) {
    if (az) {
      this.zones.forEach(function (zone) {
        if (zone.getName() === az.getName()) {
          return zone.getSubnets()
        }
      })
    } else {
      var subnets = []
      this.zones.forEach(function (zone) {
        zone.getSubnets().forEach(function (net) {
          subnets.push(net)
        })
      })
      return subnets
    }
  }

  getInstances (s, az) {
    var instances = []
    // Only az is given
    if (arguments.length === 1) {
      this.zones.forEach(function (zone) {
        if (zone.getName() === az.getName()) {
          zone.getSubnets().forEach(function (net) {
            net.getInstances().forEach(function (inst) {
              instances.push(inst)
            })
          })
        }
      })
      return instances
    } else if (arguments.length === 2) {
      this.zones.forEach(function (zone) {
        if (zone.getName() === az.getName()) {
          zone.getSubnets().forEach(function (net) {
            if (net.getId() === s.getId()) {
              return net.getInstances()
            }
          })
        }
      })
    } else {
      var nets = this.getSubnets()
      nets.forEach(function (net) {
        net.getInstances().forEach(function (inst) {
          instances.push(inst)
        })
      })
      return instances
    }
  }

  getNodes (i, sn, az) {
    if (arguments.length === 3) {
      // Get nodes at specified instance
    } else if (arguments.length === 2) {
      // Get nodes in specified subnet
    } else if (arguments.length === 1) {
      // get nodes in specified az
    } else {
      var nodes = []
      var inst = this.getInstances()
      inst.forEach(function (instance) {
        instance.getNodes().forEach(function (n) {
          nodes.push(n)
        })
      })

      return nodes
    }
  }

  getSlaves () {
    var s = []

    this.getNodes().forEach(function (node) {
      if (node.getRole().toUpperCase() === 'SLAVE') s.push(node)
    })

    return s
  }

  getMasters () {
    var m = []

    this.getNodes().forEach(function (node) {
      if (node.getRole().toUpperCase() === 'MASTER') m.push(node)
    })

    return m
  }
}
