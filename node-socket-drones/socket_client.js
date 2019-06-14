let io = require('socket.io-client');
let socket = io.connect('http://localhost:7000', {
    reconnect: true
});
//register functions and objects
let _guid = require('./util/guid.js');
let _distanceBetween = require('./util/distance.js');
let _averageSpeed = require('./util/averageSpeed.js')
let _moveRandom = require('./util/moveRandom.js');
let _moveTo = require('./util/moveTo.js')
let _moveFrom = require('./util/moveFrom.js')
let model = require('./util/model.js');


//initial local state
let nodeID = _guid(1);
let currentPosition = {
    "NodeID": nodeID,
    "x": 0,
    "y": 0,
    "z": 0,
    "DistanceMoved": 0,
    "AverageSpeed": 0
}
let positionSequence = 0;


function newPosition() {
    let copyPosition = JSON.parse(JSON.stringify(currentPosition));

    let limit = 30;

    let maxSpeed = 2;

    let rangeUpperLimit = 10;
    let rangeLowerLimit = 2;

    let closestNode = null;

    let sumX = [];
    let sumY = [];
    let sumZ = [];

    if (model.otherNodes && Object.keys(model.otherNodes).length > 0) {
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


    if (model.otherNodes && Object.keys(model.otherNodes).length > 0) {
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
        _moveRandom(maxSpeed, currentPosition);
    }

    if (closestNode != null) {
        // console.log("Position before: ", currentPosition);
        let distanceToClosestNode = _distanceBetween(currentPosition, closestNode);

        if (distanceToClosestNode >= rangeLowerLimit && distanceToClosestNode <= rangeUpperLimit) {
            currentPosition = _moveRandom(maxSpeed,currentPosition)
        } else if (distanceToClosestNode < rangeLowerLimit) {
            //move farther from closestNode
            currentPosition = _moveFrom(currentPosition, closestNode, maxSpeed);

        } else if (distanceToClosestNode > rangeUpperLimit) {
            //move closer to closestNode
            currentPosition = _moveTo(currentPosition, closestNode, maxSpeed);
        }
        //console.log("Position after: ", currentPosition);
    } else {
        //move randomly
        currentPosition = _moveRandom(maxSpeed, currentPosition);
    }

    currentPosition.DistanceMoved = _distanceBetween(copyPosition, currentPosition);
    currentPosition.PositionSequence = positionSequence++;


    if (model.updateHistory && model.updateHistory.length > limit) {
        model.updateHistory.sort(function (a, b) {
            if (a.positionSequence < b.positionSequence)
                return -1;
            if (a.positionSequence > b.positionSequence)
                return 1;
            return 0;
        });

        model.updateHistory = model.updateHistory.slice(model.updateHistory.length - limit, limit);
    }

    currentPosition.AverageSpeed = _averageSpeed(model.updateHistory, model.positionUpdateRate);
    currentPosition.NodeID = nodeID;

    model.updateHistory.push(currentPosition);
    broadcastCurrentPostion()
}

function broadcastCurrentPostion() {
    let positionUpdateMessage = {
        "type": "positionUpdate",
        "message": JSON.stringify(currentPosition),
        "from": nodeID
    }
    socket.emit('transmission', positionUpdateMessage);
}

//periodically refresh position
setInterval(function () {
    newPosition();
}, model.positionUpdateRate);



// Add a connect listener
socket.on('connect', function (socket) {
    console.log('Connected!');
});

socket.on('transmission', function (update) {
    //maintain list of other nodes
    if (update.from !== nodeID && update.type == "positionUpdate") {

        let message = JSON.parse(update.message);

        model.otherNodes[message.NodeID] = {
            x: message.x,
            y: message.y,
            z: message.z
        }

        //broadcast model.otherNodes
        let fieldKnowledgeUpdateMessage = {
            "type": "fieldKnowledgeUpdate",
            "message": JSON.stringify(model.otherNodes),
            "from": nodeID
        }
        socket.emit('transmission', fieldKnowledgeUpdateMessage);
    }

    //get other nodes' field knowledge
    if (update.from !== nodeID && update.type == "fieldKnowledgeUpdate") {

        let message = JSON.parse(update.message);

        //console.log(`FieldKnowledge from ${update.from}`, message);

        //check if other node knows about this node
        if (message[nodeID]) {
            //compare other node's knowledge to this nodes
            let t = message[nodeID];
            let distance = _distanceBetween(currentPosition, t);

            if (distance > 0) {
                console.log(`Mismatch between ${update.from} and ${nodeID}. Distance: ${distance}`);
                broadcastCurrentPostion()
            }
        } else {
            broadcastCurrentPostion()
        }
    }

    //handle positionUpdates to generate distanceUpdates
    if (update.from !== nodeID && update.type == "positionUpdate") {
        let now = new Date().getTime();
        if (now - model.lastDistanceUpdate < model.distanceUpdateRate)
            return;

        let message = JSON.parse(update.message);

        let d = _distanceBetween(currentPosition, message);
        //console.log(`Distance to ${update.from}: ${d}`)
        let distanceUpdate = {
            "type": "distanceUpdate",
            "message": JSON.stringify({
                From: nodeID,
                To: update.from,
                Distance: d
            }),
            "from": nodeID
        }

        socket.emit('transmission', distanceUpdate);
        model.lastDistanceUpdate = now;
    }
});