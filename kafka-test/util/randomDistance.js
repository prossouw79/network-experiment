module.exports = function RandomDistance(min, max, floor = false) {
    let dif = (max - min);
    let value = (Math.random() * dif) + min;

    return floor ? Math.floor(value) : value;
}