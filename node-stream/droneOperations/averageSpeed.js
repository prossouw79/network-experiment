const _ = require('lodash');
const distanceBetween = require('./distanceBetween')

function GetAverageSpeed(updateHistory) {
    var totalDistance = 0;

    //get total distance moved
    for (let i = 0; i < (updateHistory.length - 1); i++) {
        const pos1 = updateHistory[i];
        const pos2 = updateHistory[i + 1];

        totalDistance += distanceBetween(pos1, pos2);
    }

    //get total time
    let earliestTimestampMS = _.minBy(updateHistory, function (i) {
        return i.timestamp;
    }).timestamp;

    let latestTimestampMS = _.maxBy(updateHistory, function (i) {
        return i.timestamp;
    }).timestamp;

    let totalTimeSeconds = (latestTimestampMS - earliestTimestampMS) / 1000;

    return totalDistance / totalTimeSeconds;
}

module.exports = GetAverageSpeed;