let util = require('./util')
const uuidv4 = require('uuid/v4');
const speed = parseInt(util.getEnvironmentVariable('MOVEMENT_SPEED'));
const moveInterval = parseInt(util.getEnvironmentVariable('UPDATE_RATE_MS'));
const producerID = util.guid()

let getNats = require('./randomNats.js');
let nats = getNats();
printState = {};

setInterval(() => {
    nats = getNats();
    printState.Server = nats.currentServer.url.host;
    console.info(`Connecting to:`, printState.Server);
}, 500);

setInterval(() => {
    util.printCurrentState(printState);
}, 250);

let randBetween = util.randBetween;
let moveTo = util.moveTo;
let moveFrom = util.moveFrom;

let moveRandom = true;
let latestReceivedWarning = {}
let latestActionedWarning = {}

lastMove = new Date().getTime()

//global state
state = {
    id: producerID,
    x: 0,
    y: 0,
    z: 0
}

//initial publish
setInterval(() => {
    if (!nats)
        return;

    let timeSinceLastMove = new Date().getTime() - lastMove;
    if (timeSinceLastMove > moveInterval) {
        if (moveRandom) {
            printState.Movement = 'Within bounds, moving randomly';

            printState.Movement = 'Random';
            printState.Target = 'None';
            printState.CurrentPosition = `${state.x}, ${state.y},${state.z}`;

            randomPosition(speed)
            let message = JSON.stringify(state);
            nats.publish(util.getEnvironmentVariable('TOPIC_POSITION'), message);
            lastMove = new Date().getTime();
            moveRandom = true;
        } else {
            if (latestActionedWarning.x != latestReceivedWarning.x ||
                latestActionedWarning.y != latestReceivedWarning.y ||
                latestActionedWarning.z != latestReceivedWarning.z) {
                printState.Movement = 'Responding to warning' + latestReceivedWarning;
                let message = JSON.stringify(state);
                nats.publish(util.getEnvironmentVariable('TOPIC_POSITION'), message);
                lastMove = new Date().getTime();
                latestActionedWarning = latestReceivedWarning;
            }
        }
        moveRandom = true;
    }
}, moveInterval / 2);

function randomPosition(maxDif) {
    maxDif = Math.abs(maxDif);
    state.x += randBetween(-1 * maxDif, maxDif);
    state.y += randBetween(-1 * maxDif, maxDif);
    state.z += randBetween(-1 * maxDif, maxDif);
}

nats.subscribe(util.getEnvironmentVariable('TOPIC_COLLISION_WARNING'), event => {
    let e = JSON.parse(event);
    if (e.from == producerID) {
        latestReceivedWarning = e;

        printState.Movement = `Moving further`;
        printState.Target = e.target;
        printState.CurrentPosition = `${state.x}, ${state.y},${state.z}`;

        moveFrom(state, e.target, speed)
        moveRandom = false;
    }
})

nats.subscribe(util.getEnvironmentVariable('TOPIC_SIGNAL_WARNING'), event => {
    let e = JSON.parse(event);
    if (e.from == producerID) {
        latestReceivedWarning = e;

        printState.Movement = `Moving closer`;
        printState.Target = e.target;
        printState.CurrentPosition = `${state.x}, ${state.y},${state.z}`;

        moveTo(state, e.target, speed)
        moveRandom = false;
    }
})
