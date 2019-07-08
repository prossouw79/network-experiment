module.exports = function moveFrom(origin, target, maxDistance) {
    let xDif = origin.x - target.x;
    let yDif = origin.y - target.y;
    let zDif = origin.z - target.z;

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

    return origin;
}