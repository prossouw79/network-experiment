module.exports = function distanceBetween(a, b) {
    let xD = Math.pow(a.x - b.x, 2);
    let yD = Math.pow(a.y - b.y, 2);
    let zD = Math.pow(a.z - b.z, 2);

    return Math.sqrt(xD + yD + zD);
}