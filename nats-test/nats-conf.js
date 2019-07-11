let util = require('./util');
var NATS = require('nats');

let s = util.getEnvironmentVariable('NATS_NODES');
let p = util.getEnvironmentVariable('NATS_PORT');
let servers = s.split(',').map(x => {
    return `nats://${x}:${p}`;
});

// Randomly connect to a server in the cluster group.
var nats = NATS.connect({ 'servers': servers });
module.exports = nats;