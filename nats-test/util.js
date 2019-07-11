require('dotenv').config()

function getEnvironmentVariable(key){
    return process.env[key];
}

function printCurrentState(printState) {
    console.clear();
    console.log(printState)
}

function randBetween(minimum, maximum) {
    let rnd = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    return rnd
}

function distanceBetween(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dz = a.z - b.z;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function moveTo(origin, target, maxDistance = 2) {
    var xDif = origin.x - target.x;
    var yDif = origin.y - target.y;
    var zDif = origin.z - target.z;

    if (xDif > 0) {
        origin.x = origin.x - maxDistance;
    } else {
        origin.x = origin.x + maxDistance;
    }

    if (yDif > 0) {
        origin.y = origin.y - maxDistance;
    } else {
        origin.y = origin.y + maxDistance;
    }

    if (zDif > 0) {
        origin.z = origin.z - maxDistance;
    } else {
        origin.z = origin.z + maxDistance;
    }
}

function moveFrom(origin, target, maxDistance = 2) {
    var xDif = origin.x - target.x;
    var yDif = origin.y - target.y;
    var zDif = origin.z - target.z;

    if (xDif < 0) {
        origin.x = origin.x - maxDistance;
    } else {
        origin.x = origin.x + maxDistance;
    }

    if (yDif < 0) {
        origin.y = origin.y - maxDistance;
    } else {
        origin.y = origin.y + maxDistance;
    }

    if (zDif < 0) {
        origin.z = origin.z - maxDistance;
    } else {
        origin.z = origin.z + maxDistance;
    }
}

function guid(parts = 1) {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    let guid = "";
    for (let c = 0; c < parts; c++) {
        guid += s4() + "-";
    }

    guid = guid.substring(0, guid.length - 1);

    return guid;
}

module.exports = {
    randBetween: randBetween,
    distanceBetween: distanceBetween,
    moveFrom: moveFrom,
    moveTo: moveTo,
    printCurrentState: printCurrentState,
    getEnvironmentVariable: getEnvironmentVariable,
    guid: guid
}