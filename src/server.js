var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var path = require('path')

var bodyParser = require('body-parser') // For parsing POST request payload
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}))

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
    socket.on('subscribe', function () {
      clusterManager.addToken('local', socket)
    })

    return
  } else if (random) {
    socket.emit('generate random', null) // Forward the client from login to index to generate a random cluster

    return
  } else {
    // Register a user trying to log in normally
    socket.on('subscribe', function (vpcId) {
      // Add the subscribing client to the clusterManager
      if (!clusterManager.addToken(vpcId, socket)) {
        socket.emit('client not found', null)
      }
    })

    // Remove the socket from its corresponding ClusterToken if subscribed
    socket.on('unsubscribe', function (clientID) {
      clusterManager.getToken(clientID).delSubscriber(socket)
    })
  }
})

// Handle async requests for updates on a cluster
app.post('/update', function (req, res) {
  console.log(req.body) // The data payload sent with the POST request
})

var debugMode = true
function debug (s) {
  if (debugMode) console.log(s)
}
