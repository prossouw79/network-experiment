function randBetween(minimum, maximum) {
    let rnd = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    // console.info(rnd)
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

module.exports = {
    randBetween: randBetween,
    distanceBetween: distanceBetween,
    moveFrom: moveFrom,
    moveTo: moveTo
}