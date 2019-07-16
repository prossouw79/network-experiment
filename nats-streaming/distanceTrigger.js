#!/usr/bin/env node
"use-strict";
let util = require('./util')
const operatorID = util.guid();
var stan = require('node-nats-streaming')
    .connect(util.getEnvironmentVariable('CLUSTER_ID'), `distanceTrigger-${operatorID}`);

let _ = require('lodash')
let printState = {};
printState.OperatorID = operatorID;


const threshold_min_distance = parseInt(util.getEnvironmentVariable('DISTANCE_MIN'));
const threshold_max_distance = parseInt(util.getEnvironmentVariable('DISTANCE_MAX'));

stan.on('connect', function () {

    setInterval(() => {
        util.printCurrentState(printState);
    }, 250);

    var opts = stan.subscriptionOptions()
        .setStartWithLastReceived();
    var distanceUpdateSubscription = stan.subscribe(
        util.getEnvironmentVariable('TOPIC_DISTANCE'),
        opts
    );
    distanceUpdateSubscription.on('message', function (msg) {
        let e = JSON.parse(msg.getData());

        let collisionRisks = _.filter(e, x => x.distance < threshold_min_distance);
        let signalLossRisks = _.filter(e, x => x.distance > threshold_max_distance);

        collisionRisks.forEach(riskPair => {
            let warning = {
                distance: riskPair.distance,
                from: riskPair.from_id,
                to: riskPair.to_id,
                target: riskPair.to_pos
            }

            printState.Detected = `${riskPair.from_id}: PROX WARNING`;

            stan.publish(util.getEnvironmentVariable('TOPIC_COLLISION_WARNING'),
                JSON.stringify(warning), function (err, guid) {
                    if (err) {
                        console.log('publish failed: ' + err);
                    } else {
                        printState.Action = "Sent PROXIMITY warning"
                    }
                });
        });

        signalLossRisks.forEach(riskPair => {
            let warning = {
                distance: riskPair.distance,
                from: riskPair.from_id,
                to: riskPair.to_id,
                target: riskPair.to_pos
            }

            printState.Detected = `${riskPair.from_id}: DIST WARNING`;

            stan.publish(util.getEnvironmentVariable('TOPIC_SIGNAL_WARNING'),
            JSON.stringify(warning), function (err, guid) {
                if (err) {
                    console.log('publish failed: ' + err);
                } else {
                    printState.Action = "Sent SIGNAL-LOSS warning"
                }
            });
        });
    });
})


