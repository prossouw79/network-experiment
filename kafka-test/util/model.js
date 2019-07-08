let model = {
    positionUpdateRate: 500,
    distanceUpdateRate: 750,
    lastDistanceUpdate: new Date().getTime(),
    updateHistory: [],
    otherNodes: {},
}
module.exports = model;