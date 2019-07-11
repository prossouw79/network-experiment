let util = require('./util')
let _ = require('lodash');

let getNats = require('./randomNats.js');
let nats = getNats();
printState = {};

setInterval(() => {
    nats = getNats();
    printState.Server = nats.currentServer.url.host;
    console.info(`Connecting to:`, printState.Server);
}, 3000);

setInterval(() => {
    util.printCurrentState(printState);
}, 250);


const threshold = 5000;

let now = () => new Date().getTime();

let lastMessageTimes = {};
nats.subscribe(util.getEnvironmentVariable('TOPIC_POSITION'), event => {
    let e = JSON.parse(event);
    lastMessageTimes[e.id] = now();

    let deadNodes = _.map(Object.keys(lastMessageTimes), key => {
        return now() - lastMessageTimes[key] > threshold ? key : null
    })
    .filter(x => x != null)
    .forEach(x => {
        printState.Action =`Reporting dead node: ${x}`;

        delete lastMessageTimes[x];
        nats.publish(util.getEnvironmentVariable('TOPIC_DEAD_NODE'), x);
    });
});