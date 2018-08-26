var io = require('socket.io-client');
var socket = io.connect('http://localhost:3000', {
    reconnect: true
});

function guid(parts = 1) {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    var guid = "";
    for (var c = 0; c < parts; c++) {
        guid += s4() + "-";
    }

    guid = guid.substring(0, guid.length - 1);

    return guid;
}
var nodeID = guid(1);

var positionUpdateRate = 500;
var distanceUpdateRate = 750;
var lastDistanceUpdate = new Date().getTime();
var updateHistory = [];
var otherNodes = [];

function distanceBetween(a, b) {
    var xD = Math.pow(a.x - b.x, 2);
    var yD = Math.pow(a.y - b.y, 2);
    var zD = Math.pow(a.z - b.z, 2);

    return Math.sqrt(xD + yD + zD);
}

var currentPosition = {
    "NodeID": nodeID,
    "x": 0,
    "y": 0,
    "z": 0,
    "DistanceMoved": 0,
    "AverageSpeed": 0
}

function RandomDistance(min, max, floor = false) {
    var dif = (max - min);
    var value = (Math.random() * dif) + min;

    if (floor)
        return Math.floor(value);

    return value;
}

function GetAverageSpeed() {
    var totalDistance = 0;
    var consider = 10;

    if (updateHistory.length <= consider) {
        updateHistory.forEach(pos => {
            totalDistance += pos.DistanceMoved;
        });

        var totalTimeSeconds = updateHistory.length * positionUpdateRate / 1000;

        return totalDistance / totalTimeSeconds;
    } else {
        for (var cnt = updateHistory.length - (consider + 1); cnt < updateHistory.length; cnt++) {
            totalDistance += updateHistory[cnt].DistanceMoved;

            var totalTimeSeconds = consider * positionUpdateRate / 1000;

            return totalDistance / totalTimeSeconds;
        }
    }
}

var positionSequence = 0;

function moveRandom(maxSpeed) {
    currentPosition.x += RandomDistance(-1 * maxSpeed, maxSpeed);
    currentPosition.y += RandomDistance(-1 * maxSpeed, maxSpeed);
    currentPosition.z += RandomDistance(-1 * maxSpeed, maxSpeed);
}

function simpleMoveTo(origin, target, maxDistance) {
    var xDif = origin.x - target.x;
    var yDif = origin.y - target.y;
    var zDif = origin.z - target.z;

    if (xDif > 0) {
        origin.x = origin.x - maxDistance;
    } else {
        origin.x = origin.x + maxDistance;
    }

    if (yDif > 0) {
        origin.y = origin.y - maxDistance;
    } else {
        origin.y = origin.y + maxDistance;
    }

    if (zDif > 0) {
        origin.z = origin.z - maxDistance;
    } else {
        origin.z = origin.z + maxDistance;
    }
}

function simpleMoveFrom(origin, target, maxDistance) {
    var xDif = origin.x - target.x;
    var yDif = origin.y - target.y;
    var zDif = origin.z - target.z;

    if (xDif < 0) {
        origin.x = origin.x - maxDistance;
    } else {
        origin.x = origin.x + maxDistance;
    }

    if (yDif < 0) {
        origin.y = origin.y - maxDistance;
    } else {
        origin.y = origin.y + maxDistance;
    }

    if (zDif < 0) {
        origin.z = origin.z - maxDistance;
    } else {
        origin.z = origin.z + maxDistance;
    }
}

function newPosition() {
    var copyPosition = JSON.parse(JSON.stringify(currentPosition));

    var limit = 30;

    var maxSpeed = 2;

    var rangeUpperLimit = 10;
    var rangeLowerLimit = 2;

    var closestNode = null;

    var sumX = [];
    var sumY = [];
    var sumZ = [];

    if (Object.keys(otherNodes).length > 0) {
        for (var tmpNodeID in otherNodes) {
            if (otherNodes.hasOwnProperty(tmpNodeID)) {
                var node = otherNodes[tmpNodeID];
                sumX.push(node.x);
                sumY.push(node.y);
                sumZ.push(node.z);
            }
        }
    }
    //get average X
    var xsum, xavg = 0;
    if (sumX.length) {
        xsum = sumX.reduce(function (a, b) { return a + b; });
        xavg = xsum / sumX.length;
    }

    //get average Y
    var ysum, yavg = 0;
    if (sumY.length) {
        ysum = sumY.reduce(function (a, b) { return a + b; });
        yavg = ysum / sumY.length;
    }

    //get average Z
    var zsum, zavg = 0;
    if (sumZ.length) {
        zsum = sumZ.reduce(function (a, b) { return a + b; });
        zavg = zsum / sumZ.length;
    }


    if (Object.keys(otherNodes).length > 0) {
        for (var tmpNodeID in otherNodes) {
            if (otherNodes.hasOwnProperty(tmpNodeID)) {
                // do stuff
                var node = otherNodes[tmpNodeID];
                var distance = distanceBetween(node, currentPosition);

                if (distance > 0) {
                    if (closestNode == null) {
                        closestNode = node;
                    } else {
                        if (distanceBetween(node, currentPosition) < distanceBetween(node, closestNode)) {
                            closestNode = node;
                        }
                    }
                }
            }
        }
    } else {
        //move randomly
        moveRandom(maxSpeed);
    }

    if (closestNode != null) {
        // console.log("Position before: ", currentPosition);
        var distanceToClosestNode = distanceBetween(currentPosition, closestNode);

        if (distanceToClosestNode >= rangeLowerLimit && distanceToClosestNode <= rangeUpperLimit) {
            moveRandom(maxSpeed)
        } else if (distanceToClosestNode < rangeLowerLimit) {
            //move farther from closestNode
            simpleMoveFrom(currentPosition, closestNode, maxSpeed);

        } else if (distanceToClosestNode > rangeUpperLimit) {
            //move closer to closestNode
            simpleMoveTo(currentPosition, closestNode, maxSpeed);
        }
        //console.log("Position after: ", currentPosition);
    } else {
        //move randomly
        moveRandom(maxSpeed);
    }

    currentPosition.DistanceMoved = distanceBetween(copyPosition, currentPosition);
    currentPosition.PositionSequence = positionSequence++;


    if (updateHistory.length > limit) {
        updateHistory.sort(function (a, b) {
            if (a.positionSequence < b.positionSequence)
                return -1;
            if (a.positionSequence > b.positionSequence)
                return 1;
            return 0;
        });

        updateHistory = updateHistory.slice(updateHistory.length - limit, limit);
    }

    currentPosition.AverageSpeed = GetAverageSpeed();
    currentPosition.NodeID = nodeID;

    console.log(currentPosition.NodeID, currentPosition.AverageSpeed)


    updateHistory.push(currentPosition);

    var updateMessage = {
        "type": "positionUpdate",
        "message": JSON.stringify(currentPosition),
        "from": nodeID
    }

    socket.emit('transmission', updateMessage);
}

//periodically refresh position
setInterval(function () {
    newPosition();
}, positionUpdateRate);



// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected!');
});

socket.on('transmission', function (update) {

    //maintain list of other nodes
    if (update.from !== nodeID && update.type == "positionUpdate") {

        var message = JSON.parse(update.message);

        otherNodes[message.NodeID] = {
            x: message.x,
            y: message.y,
            z: message.z
        }
        //console.log("OtherNodes", otherNodes);
    }

    //handle positionUpdates to generate distanceUpdates
    if (update.from !== nodeID && update.type == "positionUpdate") {
        var now = new Date().getTime();
        if (now - lastDistanceUpdate < distanceUpdateRate)
            return;

        var message = JSON.parse(update.message);

        var d = distanceBetween(currentPosition, message);
        //console.log(`Distance to ${update.from}: ${d}`)
        var distanceUpdate = {
            "type": "distanceUpdate",
            "message": JSON.stringify({
                From: nodeID,
                To: update.from,
                Distance: d
            }),
            "from": nodeID
        }

        socket.emit('transmission', distanceUpdate);
        lastDistanceUpdate = now;
    }
});