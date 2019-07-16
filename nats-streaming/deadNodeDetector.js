#!/usr/bin/env node
"use-strict";

let util = require('./util')
const operatorID = util.guid();
var stan = require('node-nats-streaming')
    .connect(util.getEnvironmentVariable('CLUSTER_ID'), `deadNodeDetector-${operatorID}`);

let _ = require('lodash');
let lastMessageTimes = {};
let now = () => new Date().getTime();
const threshold = 5000;

stan.on('connect', function () {

    var opts = stan.subscriptionOptions()
        .setStartWithLastReceived();
    var positionUpdateSubscription = stan.subscribe(
        util.getEnvironmentVariable('TOPIC_POSITION'),
        opts
    );

    setInterval(() => {
        let n = now();
        console.clear();
        console.info(`OperatorID: ${operatorID}`);
        Object.keys(lastMessageTimes).forEach(node => {
            console.info(`Node ${node} last update: ${n - lastMessageTimes[node]} ms ago`)
        });

        let deadNodes = _.map(Object.keys(lastMessageTimes), key => {
            return now() - lastMessageTimes[key] > threshold ? key : null
        })
            .filter(x => x != null)
            .forEach(x => {

                delete lastMessageTimes[x];

                stan.publish(util.getEnvironmentVariable('TOPIC_DEAD_NODE'),
                    x, function (err, guid) {
                        if (err) {
                            console.log('publish failed: ' + err);
                        }
                    });
            });
    }, 250);

    positionUpdateSubscription.on('message', function (event) {
        let e = JSON.parse(event.getData());
        lastMessageTimes[e.id] = now();
    });
})


