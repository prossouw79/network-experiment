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

const threshold_min_distance = parseInt(util.getEnvironmentVariable('DISTANCE_MIN'));
const threshold_max_distance = parseInt(util.getEnvironmentVariable('DISTANCE_MAX'));

nats.subscribe(util.getEnvironmentVariable('TOPIC_DISTANCE'), event => {
    let e = JSON.parse(event);

    let collisionRisks = _.filter(e, x => x.distance < threshold_min_distance);
    let signalLossRisks = _.filter(e, x => x.distance > threshold_max_distance);

    collisionRisks.forEach(riskPair => {
        let warning = {
            distance: riskPair.distance,
            from: riskPair.from_id,
            to: riskPair.to_id,
            target: riskPair.to_pos
        }

        printState.Detected =`${riskPair.from_id}: PROX WARNING`;
        nats.publish(util.getEnvironmentVariable('TOPIC_COLLISION_WARNING'), JSON.stringify(warning))
    });

    signalLossRisks.forEach(riskPair => {
        let warning = {
            distance: riskPair.distance,
            from: riskPair.from_id,
            to: riskPair.to_id,
            target: riskPair.to_pos
        }

        printState.Detected =`${riskPair.from_id}: DIST WARNING`;
        nats.publish(util.getEnvironmentVariable('TOPIC_SIGNAL_WARNING'), JSON.stringify(warning))
    });

})