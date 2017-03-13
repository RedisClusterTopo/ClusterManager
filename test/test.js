var chai = require('chai')
// var chaiHttp = require('chai-http')
var server = require('../src/server')
var should = chai.should()
var it = chai.it()
var describe = chai.describe()
var io = require('socket.io-client')
// chai.use(chaiHttp)

describe('server', function () {
  it('should receive socket.io "subscribe" commands', function (done) {
    var socket = io('http://localhost:8080')
    socket.on('connect', function () {
      done()
    })
  })

  it('should receive socket.io "unsubscribe" commands')
  it('should receive async update requests')
})
