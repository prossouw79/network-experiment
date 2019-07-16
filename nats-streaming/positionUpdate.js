#!/usr/bin/env node
"use-strict";

let util = require('./util')
const operatorID = util.guid();
var stan = util.getDefaultSTAN('positionUpdate')

const speed = parseInt(util.getEnvironmentVariable('MOVEMENT_SPEED'));
const moveInterval = parseInt(util.getEnvironmentVariable('UPDATE_RATE_MS'));
const producerID = util.guid()


let randBetween = util.randBetween;
let moveTo = util.moveTo;
let moveFrom = util.moveFrom;

let moveRandom = true;
let latestReceivedWarning = {}
let latestActionedWarning = {}

lastMove = new Date().getTime()
printState = {};
printState.NodeID = producerID;
//global state
state = {
    id: producerID,
    x: 0,
    y: 0,
    z: 0
}

stan.on('connect', function () {
    setInterval(() => {
        util.printCurrentState(printState);
    }, 250);

    setInterval(() => {

        let timeSinceLastMove = new Date().getTime() - lastMove;
        if (timeSinceLastMove > moveInterval) {
            if (moveRandom) {

                printState.CurrentPosition = `${state.x}, ${state.y},${state.z}`;

                randomPosition(speed)
                let message = JSON.stringify(state);

                stan.publish(util.getEnvironmentVariable('TOPIC_POSITION'),
                    message, function (err, guid) {
                        if (err) {
                            console.log('publish failed: ' + err);
                        } else {
                            printState.Movement = 'Within bounds, moving randomly';
                            printState.Movement = 'Random';
                            printState.Target = 'None';
                            lastMove = new Date().getTime();
                            moveRandom = true;
                        }
                    });

            } else {
                if (latestActionedWarning.x != latestReceivedWarning.x ||
                    latestActionedWarning.y != latestReceivedWarning.y ||
                    latestActionedWarning.z != latestReceivedWarning.z) {
                    

                    let message = JSON.stringify(state);

                    stan.publish(util.getEnvironmentVariable('TOPIC_POSITION'),
                        message, function (err, guid) {
                            if (err) {
                                console.log('publish failed: ' + err);
                            } else {
                                printState.Movement = 'Responding to warning' + latestReceivedWarning;
                                lastMove = new Date().getTime();
                            }
                        });
                    latestActionedWarning = latestReceivedWarning;
                }
            }
            moveRandom = true;
        }
    }, moveInterval / 2);


    var opts = stan.subscriptionOptions()
        .setStartWithLastReceived();
    var collisionWarningSubscription = stan.subscribe(
        util.getEnvironmentVariable('TOPIC_COLLISION_WARNING'),
        opts
    );
    collisionWarningSubscription.on('message', function (msg) {
        let e = JSON.parse(msg.getData());

        if (e.from == producerID) {
            latestReceivedWarning = e;

            printState.Movement = `Moving further`;
            printState.Target = e.target;
            printState.CurrentPosition = `${state.x}, ${state.y},${state.z}`;

            moveFrom(state, e.target, speed)
            moveRandom = false;
        }
    });

    var signalWarningSubscription = stan.subscribe(
        util.getEnvironmentVariable('TOPIC_SIGNAL_WARNING'),
        opts
    );
    signalWarningSubscription.on('message', function (msg) {
        let e = JSON.parse(msg.getData());

        if (e.from == producerID) {
            latestReceivedWarning = e;

            printState.Movement = `Moving closer`;
            printState.Target = e.target;
            printState.CurrentPosition = `${state.x}, ${state.y},${state.z}`;

            moveTo(state, e.target, speed)
            moveRandom = false;
        }
    });

});

stan.on('close', function () {
    process.exit();
});



function randomPosition(maxDif) {
    maxDif = Math.abs(maxDif);
    state.x += randBetween(-1 * maxDif, maxDif);
    state.y += randBetween(-1 * maxDif, maxDif);
    state.z += randBetween(-1 * maxDif, maxDif);
}

