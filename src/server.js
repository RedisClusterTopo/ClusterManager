var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)

var path = require('path')

var ClusterManager = require('./js/ClusterManager.js')

var random = false // Toggle whether to generate a random cluster to view
var localCluster = false // Toggle whether to connect to a locally hosted redis cluster

process.argv.forEach(function (val, index, array) {
  if (val === 'random') {
    random = true
  } else if (val === 'local') {
    localCluster = true // Use a topology with one ec2 instance node (the server host)
  }
})

server.listen(8080)

app.use('/js', express.static(path.join(__dirname, 'js')))
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/css', express.static(path.join(__dirname, 'css')))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'aws-login.html'))
})

app.get('/index', function (req, res) {
  res.sendFile(path.join(__dirname, '../public', 'index.html'))
})

var clusterManager = new ClusterManager()

// Add event listeners to new socket connections
io.on('connection', function (socket) {
  // Guards for random and localCluster clients connecting to login screen
  if (localCluster) {
    socket.emit('local cluster', null)  // Alert the client to draw only 1 instance
    socket.on('subscribe', function () {
      clusterManager.addToken({key: 'local', val: 'cluster'}, socket, null, function () {})
    })

    return
  } else if (random) {
    socket.emit('generate random', null) // Forward the client from login to index to generate a random cluster

    return
  }

  // Register a user trying to log in normally
  socket.on('subscribe', function (clientID, timeout) {
    if (!timeout) timeout = 5000

    // Add the subscribing client to the clusterManager
    clusterManager.addToken(clientID, socket, timeout, function (newClient) {
    })
  })

  // Remove the socket from its corresponding ClusterToken if subscribed
  socket.on('unsubscribe', function (clientID) {
    clusterManager.delToken(clientID, function (success, err) {
      if (!success) {
        console.log(err)
      } else {
        debug('Client successfully deleted')
      }
    })
  })
})

var debugMode = true
function debug (s) {
  if (debugMode) console.log(s)
}
