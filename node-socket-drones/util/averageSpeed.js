
module.exports = function GetAverageSpeed(updateHistory,positionUpdateRate) {
    let totalDistance = 0;
    let consider = 10;

    if (updateHistory && updateHistory.length <= consider) {
        updateHistory.forEach(pos => {
            totalDistance += pos.DistanceMoved;
        });

        let totalTimeSeconds = updateHistory.length * positionUpdateRate / 1000;

        return totalDistance / totalTimeSeconds;
    } else {
        for (let cnt = updateHistory.length - (consider + 1); cnt < updateHistory.length; cnt++) {
            totalDistance += updateHistory[cnt].DistanceMoved;

            let totalTimeSeconds = consider * positionUpdateRate / 1000;

            return totalDistance / totalTimeSeconds;
        }
    }
}