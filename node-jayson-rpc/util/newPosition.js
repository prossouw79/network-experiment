module.exports = function newPosition(currentPosition) {
    let copyPosition = JSON.parse(JSON.stringify(currentPosition));

    let limit = 30;

    let maxSpeed = 2;

    let rangeUpperLimit = 10;
    let rangeLowerLimit = 2;

    let closestNode = null;

    let sumX = [];
    let sumY = [];
    let sumZ = [];

    if (Object.keys(model.otherNodes).length > 0) {
        for (let tmpNodeID in model.otherNodes) {
            if (model.otherNodes.hasOwnProperty(tmpNodeID)) {
                let node = model.otherNodes[tmpNodeID];
                sumX.push(node.x);
                sumY.push(node.y);
                sumZ.push(node.z);
            }
        }
    }
    //get average X
    let xsum, xavg = 0;
    if (sumX.length) {
        xsum = sumX.reduce(function (a, b) { return a + b; });
        xavg = xsum / sumX.length;
    }

    //get average Y
    let ysum, yavg = 0;
    if (sumY.length) {
        ysum = sumY.reduce(function (a, b) { return a + b; });
        yavg = ysum / sumY.length;
    }

    //get average Z
    let zsum, zavg = 0;
    if (sumZ.length) {
        zsum = sumZ.reduce(function (a, b) { return a + b; });
        zavg = zsum / sumZ.length;
    }


    if (Object.keys(model.otherNodes).length > 0) {
        for (let tmpNodeID in model.otherNodes) {
            if (model.otherNodes.hasOwnProperty(tmpNodeID)) {
                // do stuff
                let node = model.otherNodes[tmpNodeID];
                let distance = _distanceBetween(node, currentPosition);

                if (distance > 0) {
                    if (closestNode == null) {
                        closestNode = node;
                    } else {
                        if (_distanceBetween(node, currentPosition) < _distanceBetween(node, closestNode)) {
                            closestNode = node;
                        }
                    }
                }
            }
        }
    } else {
        //move randomly
        _moveRandom(maxSpeed);
    }

    if (closestNode != null) {
        // console.log("Position before: ", currentPosition);
        let distanceToClosestNode = _distanceBetween(currentPosition, closestNode);

        if (distanceToClosestNode >= rangeLowerLimit && distanceToClosestNode <= rangeUpperLimit) {
            _moveRandom(maxSpeed)
        } else if (distanceToClosestNode < rangeLowerLimit) {
            //move farther from closestNode
            _moveFrom(currentPosition, closestNode, maxSpeed);

        } else if (distanceToClosestNode > rangeUpperLimit) {
            //move closer to closestNode
            _moveTo(currentPosition, closestNode, maxSpeed);
        }
        //console.log("Position after: ", currentPosition);
    } else {
        //move randomly
        _moveRandom(maxSpeed);
    }

    currentPosition.DistanceMoved = _distanceBetween(copyPosition, currentPosition);
    currentPosition.PositionSequence = positionSequence++;


    if (model.updateHistory.length > limit) {
        model.updateHistory.sort(function (a, b) {
            if (a.positionSequence < b.positionSequence)
                return -1;
            if (a.positionSequence > b.positionSequence)
                return 1;
            return 0;
        });

        model.updateHistory = model.updateHistory.slice(model.updateHistory.length - limit, limit);
    }

    currentPosition.AverageSpeed = _averageSpeed();
    currentPosition.NodeID = nodeID;

    //console.log(currentPosition.NodeID, currentPosition.AverageSpeed)


    model.updateHistory.push(currentPosition);


    broadcastCurrentPostion()
}