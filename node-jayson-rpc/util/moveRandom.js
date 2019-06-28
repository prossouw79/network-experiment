let _randomDistance = require('./randomDistance');

module.exports = function moveRandom(maxSpeed, currentPosition) {
    currentPosition.x += _randomDistance(-1 * maxSpeed, maxSpeed);
    currentPosition.y += _randomDistance(-1 * maxSpeed, maxSpeed);
    currentPosition.z += _randomDistance(-1 * maxSpeed, maxSpeed);
    return currentPosition;
}