#!/usr/bin/env node
"use-strict";

let util = require('./util')
const operatorID = util.guid();
var stan = require('node-nats-streaming')
    .connect(util.getEnvironmentVariable('CLUSTER_ID'), `distanceCalculator-${operatorID}`);

let _ = require('lodash')
asTable = require('as-table')
let distanceBetween = util.distanceBetween;
let printState = {};
printState.OperatorID = operatorID;
let lastKnownPositions = {};

stan.on('connect', function () {
    setInterval(() => {
        util.printCurrentState(printState);
    }, 250);


    var opts = stan.subscriptionOptions()
        .setStartWithLastReceived();
    var positionUpdateSubscription = stan.subscribe(
        util.getEnvironmentVariable('TOPIC_POSITION'),
        opts
    );
    positionUpdateSubscription.on('message', function (msg) {
        let e = JSON.parse(msg.getData());

        if (!lastKnownPositions[e.id]) {
            lastKnownPositions[e.id] = {};
        }
        lastKnownPositions[e.id] = e;
        let lastKnownDistances = [];
        Object.keys(lastKnownPositions).forEach(a => {
            Object.keys(lastKnownPositions).forEach(b => {
                if (a != b) {
                    let obj_a = lastKnownPositions[a];
                    let obj_b = lastKnownPositions[b];

                    let d = distanceBetween(obj_a, obj_b).toFixed(3);

                    let dto = {
                        from_pos: {
                            x: obj_a.x,
                            y: obj_a.y,
                            z: obj_a.z,
                        },
                        from_id: obj_a.id,
                        to_id: obj_b.id,
                        to_pos: {
                            x: obj_b.x,
                            y: obj_b.y,
                            z: obj_b.z,
                        },
                        distance: d
                    }

                    lastKnownDistances.push(dto);
                }
            });
        });

        let headers = ['Distance', 'Node A', 'Node B'];
        let printTable = _.orderBy(lastKnownDistances, x => parseInt(x.distance));
        printTable = _.uniqBy(printTable, x => x.distance);
        printTable = _.map(printTable, summary => [summary.distance, summary.from_id, summary.to_id]);
        printTable.splice(0, 0, headers);


        printState.Table = asTable(printTable);

        let message = JSON.stringify(lastKnownDistances);

        stan.publish(util.getEnvironmentVariable('TOPIC_DISTANCE'),
            message, function (err, guid) {
                if (err) {
                    console.log('publish failed: ' + err);
                } else {
                    printState.Action = "Sent DISTANCE-UPDATE"
                }
            });
    });

    var deadNodeSubscription = stan.subscribe(
        util.getEnvironmentVariable('TOPIC_DEAD_NODE'),
        opts
    );
    deadNodeSubscription.on('message', function (event) {
        let e = event.getData();

        if (lastKnownPositions[e]) {
            delete lastKnownPositions[e];
            printState.Action = `Removing: ${e}`;
        }
    });
})


