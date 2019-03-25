function distanceBetween(a, b) {
    var xD = Math.pow(a.x - b.x, 2);
    var yD = Math.pow(a.y - b.y, 2);
    var zD = Math.pow(a.z - b.z, 2);

    return Math.sqrt(xD + yD + zD);
}

module.exports = distanceBetween;