let nats = require('./nats-conf')
let util = require('./util')
const uuidv4 = require('uuid/v4');
const speed = 1;
const moveInterval = 500;
const producerID = uuidv4()

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
    let timeSinceLastMove = new Date().getTime() - lastMove;
    if (timeSinceLastMove > moveInterval) {
        if (moveRandom) {
            console.log('Within bounds, moving randomly')
            randomPosition(speed)
            let message = JSON.stringify(state);
            nats.publish('positionUpdates', message);
            lastMove = new Date().getTime();
            moveRandom = true;
        } else {
            if (latestActionedWarning.x != latestReceivedWarning.x ||
                latestActionedWarning.y != latestReceivedWarning.y ||
                latestActionedWarning.z != latestReceivedWarning.z) {
                console.log('Responding to warning', latestReceivedWarning)
                let message = JSON.stringify(state);
                nats.publish('positionUpdates', message);
                lastMove = new Date().getTime();
                latestActionedWarning = latestReceivedWarning;
            }
        }
        moveRandom = true;
    }
}, 100);

function randomPosition(maxDif) {
    maxDif = Math.abs(maxDif);
    state.x += randBetween(-1 * maxDif, maxDif);
    state.y += randBetween(-1 * maxDif, maxDif);
    state.z += randBetween(-1 * maxDif, maxDif);
}

nats.subscribe('collision-avoidance-warning', event => {
    let e = JSON.parse(event);
    if (e.from == producerID) {
        latestReceivedWarning = e;

        console.log('Moving away from ', e.target, ` from ${state.x}, ${state.y},${state.z}`);
        moveFrom(state, e.target, speed)
        moveRandom = false;
    }
})

nats.subscribe('signal-loss-warning', event => {
    let e = JSON.parse(event);
    if (e.from == producerID) {
        latestReceivedWarning = e;

        console.log('Moving closer to ', e.target, ` from ${state.x}, ${state.y},${state.z}`);
        moveTo(state, e.target, speed)
        moveRandom = false;
    }
})