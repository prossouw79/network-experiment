var NATS = require('nats');
// var servers = ['nats://pi-1:4222','nats://pi-2:4222','nats://pi-3:4222'];
var servers = ['nats://pi-1:4222'];
var nats = NATS.connect({'servers': servers});

module.exports = nats;