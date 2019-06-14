let nats = require('./nats-conf')
let util = require('./util')
let _ = require('lodash');

const threshold = 5000;

let now = () => new Date().getTime();

let lastMessageTimes = {};
nats.subscribe('positionUpdates', event => {
    let e = JSON.parse(event);
    lastMessageTimes[e.id] = now();

    let deadNodes = _.map(Object.keys(lastMessageTimes), key => {
        return now() - lastMessageTimes[key] > threshold ? key : null
    })
    .filter(x => x != null)
    .forEach(x => {
        console.log(`Reporting dead node: ${x}`);
        delete lastMessageTimes[x];
        nats.publish('deadNodeAlert', x);
    });
});