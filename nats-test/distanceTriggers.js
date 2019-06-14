let nats = require('./nats-conf')
let util = require('./util')
let _ = require('lodash');

const threshold_min_distance = 2;
const threshold_max_distance = 10;

nats.subscribe('distanceUpdates', event => {
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

        console.log(`Trigger ${riskPair.from_id}: PROX WARNING`);
        nats.publish('collision-avoidance-warning', JSON.stringify(warning))
    });

    signalLossRisks.forEach(riskPair => {
        let warning = {
            distance: riskPair.distance,
            from: riskPair.from_id,
            to: riskPair.to_id,
            target: riskPair.to_pos
        }

        console.log(`Trigger ${riskPair.from_id}: DIST WARNING`);
        nats.publish('signal-loss-warning', JSON.stringify(warning))
    });

})