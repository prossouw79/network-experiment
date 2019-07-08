function getAveragePosition(nodePositions,avgPosKey) {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    
    Object.keys(nodePositions)
        .filter(x => x != avgPosKey)
        .forEach(node => {
            sumX += nodePositions[node].x;
            sumY += nodePositions[node].y;
            sumZ += nodePositions[node].z;
        });

    nodePositions[avgPosKey] = {
        NodeID: avgPosKey,
        x: sumX / Object.keys(nodePositions).length,
        y: sumY / Object.keys(nodePositions).length,
        z: sumZ / Object.keys(nodePositions).length,
    };
}


module.exports = getAveragePosition;