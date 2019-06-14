module.exports = function RandomDistance(min, max, floor = false) {
    let dif = (max - min);
    let value = (Math.random() * dif) + min;

    if (floor)
        return Math.floor(value);

    return value;
}